import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { hasStudentRole } from '@/lib/variant';
import { generateTempPassword } from '@/lib/password';

// POST: buatkan akun login untuk SEMUA murid yang belum punya akun (Mode 2 & 3).
// Username = NISN. Password sementara acak, dikembalikan SEKALI untuk dibagikan/dicetak.
export async function POST() {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    if (!hasStudentRole(user.appVariant)) {
      return NextResponse.json({ success: false, message: 'Mode sekolah ini tidak memakai akun murid' }, { status: 400 });
    }

    const students = await db.student.findMany({
      where: { schoolId: user.schoolId, userId: null },
      select: { id: true, name: true, nisn: true, classRoom: { select: { name: true } } },
      orderBy: [{ classRoom: { name: 'asc' } }, { name: 'asc' }],
    });

    const created: { name: string; className: string | null; username: string; password: string }[] = [];
    const skipped: { name: string; reason: string }[] = [];

    for (const s of students) {
      const username = s.nisn?.trim().toLowerCase();
      if (!username) {
        skipped.push({ name: s.name, reason: 'NISN belum diisi' });
        continue;
      }
      if (await db.user.findFirst({ where: { username } })) {
        skipped.push({ name: s.name, reason: 'NISN sudah dipakai akun lain' });
        continue;
      }
      const password = generateTempPassword();
      const hash = await bcrypt.hash(password, 10);
      await db.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: { name: s.name, username, password: hash, role: 'STUDENT', mustChangePassword: true, schoolId: user.schoolId },
        });
        await tx.student.update({ where: { id: s.id }, data: { userId: u.id } });
      });
      created.push({ name: s.name, className: s.classRoom?.name ?? null, username, password });
    }

    return NextResponse.json({ success: true, data: { created, skipped } });
  } catch (e) {
    return serverError(e, 'Gagal membuat akun murid');
  }
}
