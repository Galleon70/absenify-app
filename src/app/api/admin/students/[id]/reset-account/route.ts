import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { hasStudentRole } from '@/lib/variant';
import { generateTempPassword } from '@/lib/password';
import { clearAccountLock } from '@/lib/login-throttle';

// POST: password sementara baru untuk akun murid (atau membuat akunnya kalau belum ada)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    if (!hasStudentRole(user.appVariant)) {
      return NextResponse.json({ success: false, message: 'Mode sekolah ini tidak memakai akun murid' }, { status: 400 });
    }
    const { id } = await params;
    const student = await db.student.findFirst({ where: { id, schoolId: user.schoolId } });
    if (!student) return NextResponse.json({ success: false, message: 'Murid tidak ditemukan' }, { status: 404 });

    const password = generateTempPassword();
    const hash = await bcrypt.hash(password, 10);

    if (student.userId) {
      const acc = await db.user.update({
        where: { id: student.userId },
        data: { password: hash, mustChangePassword: true, tokenVersion: { increment: 1 } },
        select: { username: true },
      });
      await clearAccountLock([acc.username, student.nisn]);
      return NextResponse.json({ success: true, data: { username: acc.username, password } });
    }

    const username = student.nisn?.trim().toLowerCase();
    if (!username) {
      return NextResponse.json({ success: false, message: 'Isi NISN murid terlebih dahulu (dipakai sebagai username)' }, { status: 400 });
    }
    if (await db.user.findFirst({ where: { username } })) {
      return NextResponse.json({ success: false, message: 'NISN ini sudah dipakai akun lain' }, { status: 400 });
    }
    await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { name: student.name, username, password: hash, role: 'STUDENT', mustChangePassword: true, schoolId: user.schoolId },
      });
      await tx.student.update({ where: { id: student.id }, data: { userId: u.id } });
    });
    return NextResponse.json({ success: true, data: { username, password } });
  } catch (e) {
    return serverError(e, 'Gagal mereset akun murid');
  }
}
