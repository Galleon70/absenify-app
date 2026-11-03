import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { hasStudentRole } from '@/lib/variant';
import { findOrCreateParent } from '@/lib/parent';
import { generateTempPassword } from '@/lib/password';

export async function GET() {
  const { user, error } = await guard(['ADMIN', 'TEACHER', 'PRINCIPAL']);
  if (error) return error;

  try {
    const students = await db.student.findMany({
      where: { schoolId: user.schoolId },
      include: {
        classRoom: true,
        user: { select: { email: true, username: true } },
        parent: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: students });
  } catch (e) {
    return serverError(e, 'Gagal mengambil data siswa');
  }
}

export async function POST(req: Request) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const b = await req.json();
    if (!b.name?.trim()) {
      return NextResponse.json({ success: false, message: 'Nama siswa wajib diisi' }, { status: 400 });
    }

    if (b.classRoomId) {
      const cls = await db.classRoom.findFirst({ where: { id: b.classRoomId, schoolId: user.schoolId } });
      if (!cls) {
        return NextResponse.json({ success: false, message: 'Kelas tidak valid' }, { status: 400 });
      }
    }

    // Akun login murid HANYA dibuat di Mode 2 & 3, dan butuh NISN (dipakai sebagai username).
    const nisnValue: string = b.nisn?.trim() || '';
    const createAccount = hasStudentRole(user.appVariant) && !!nisnValue;
    const studentUsername = nisnValue.toLowerCase();
    if (createAccount && (await db.user.findFirst({ where: { username: studentUsername } }))) {
      return NextResponse.json({ success: false, message: 'NISN ini sudah dipakai akun lain' }, { status: 400 });
    }
    const studentTemp: string | undefined = createAccount ? generateTempPassword() : undefined;
    const passwordHash = studentTemp ? await bcrypt.hash(studentTemp, 10) : '';

    const parentEmail: string = b.parentEmail?.trim() || '';
    let parentTemp: string | undefined;

    const student = await db.$transaction(async (tx) => {
      let parentId: string | null = null;
      if (parentEmail) {
        const p = await findOrCreateParent(tx, user.schoolId, parentEmail, b.parentName);
        parentId = p.id;
        parentTemp = p.tempPassword;
      }
      let userId: string | null = null;
      if (createAccount) {
        const u = await tx.user.create({
          data: {
            name: b.name.trim(),
            username: studentUsername,
            password: passwordHash,
            role: 'STUDENT',
            mustChangePassword: true,
            schoolId: user.schoolId,
          },
        });
        userId = u.id;
      }
      return tx.student.create({
        data: {
          userId,
          parentId,
          parentName: b.parentName?.trim() || null,
          name: b.name.trim(),
          nis: b.nis || null,
          nisn: b.nisn || null,
          classRoomId: b.classRoomId || null,
          gender: b.gender || null,
          status: b.status || 'Aktif',
          birthDate: b.birthDate ? new Date(b.birthDate) : null,
          parentPhone: b.parentPhone || null,
          schoolId: user.schoolId,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: student,
        message:
          'Siswa berhasil ditambahkan.' +
          (parentTemp
            ? `\n\nAkun orang tua dibuat:\nEmail: ${parentEmail}\nPassword sementara: ${parentTemp}\n(Catat dan berikan ke orang tua. Password ini hanya tampil sekali dan wajib diganti saat login pertama.)`
            : '') +
          (studentTemp ? `\n\nAkun murid dibuat:\nUsername (NISN): ${studentUsername}\nPassword sementara: ${studentTemp}\n(Catat dan berikan ke murid. Hanya tampil sekali, wajib diganti saat login pertama.)` : ''),
      },
      { status: 201 }
    );
  } catch (e) {
    if ((e as Error).message === 'EMAIL_OTHER_SCHOOL') {
      return NextResponse.json(
        { success: false, message: 'Email itu sudah terdaftar di sekolah lain. Gunakan email orang tua yang berbeda.' },
        { status: 400 }
      );
    }
    if ((e as Error).message === 'EMAIL_ROLE_CONFLICT') {
      return NextResponse.json(
        { success: false, message: 'Email itu sudah dipakai akun lain (bukan orang tua)' },
        { status: 400 }
      );
    }
    return serverError(e, 'Gagal menambah siswa');
  }
}
