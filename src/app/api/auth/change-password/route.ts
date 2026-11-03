// src/app/api/auth/change-password/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createToken, setAuthCookie } from '@/lib/auth';
import { guard } from '@/lib/guard';
import { validateNewPassword } from '@/lib/password';
import { clearFailures, lockedMinutes, lockMessage, MAX_PER_ACCOUNT, recordFailure } from '@/lib/login-throttle';

// POST: pengguna yang sedang login mengganti passwordnya sendiri.
// Semua sesi lama (perangkat lain) otomatis berakhir; sesi ini mendapat token baru.
export async function POST(req: Request) {
  const { user: session, error } = await guard(undefined, { allowMustChange: true });
  if (error) return error;

  try {
    const { currentPassword, newPassword } = await req.json();
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    const key = `pw:${session.userId}`;
    const locked = await lockedMinutes([key]);
    if (locked > 0) {
      return NextResponse.json({ success: false, message: lockMessage(locked) }, { status: 429 });
    }

    const invalid = validateNewPassword(newPassword, currentPassword);
    if (invalid) {
      return NextResponse.json({ success: false, message: invalid }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { id: session.userId, schoolId: session.schoolId },
      include: { school: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Akun tidak ditemukan' }, { status: 404 });
    }

    // Data lama yang belum di-hash hanya diterima di development
    const isHashed = user.password.startsWith('$2');
    const ok = isHashed
      ? await bcrypt.compare(currentPassword, user.password)
      : process.env.NODE_ENV !== 'production' && user.password === currentPassword;
    if (!ok) {
      await recordFailure([{ key, max: MAX_PER_ACCOUNT }]);
      return NextResponse.json({ success: false, message: 'Password saat ini salah' }, { status: 400 });
    }
    await clearFailures(key);

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        mustChangePassword: false,
        tokenVersion: { increment: 1 }, // mencabut semua sesi lama
      },
    });

    const token = await createToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      schoolId: user.schoolId,
      appVariant: user.school.appVariant,
      mustChangePassword: false,
      tv: updated.tokenVersion,
    });
    await setAuthCookie(token, user.role);

    return NextResponse.json({ success: true, message: 'Password berhasil diganti', role: user.role });
  } catch (e) {
    console.error('Gagal ganti password:', e);
    return NextResponse.json({ success: false, message: 'Gagal mengganti password' }, { status: 500 });
  }
}
