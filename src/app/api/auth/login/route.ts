// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createToken, setAuthCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasStudentRole, STUDENT_PORTAL_READY } from '@/lib/variant';
import {
  clearFailures,
  clientIp,
  lockedMinutes,
  lockMessage,
  MAX_PER_ACCOUNT,
  MAX_PER_IP,
  recordFailure,
} from '@/lib/login-throttle';

// Hash palsu: dipakai supaya waktu respons "akun tidak ada" sama dengan "password salah"
const DUMMY_HASH = '$2b$10$i0BoHXdU.IdKZESwChKtIupx6nJCVxPhbsyJlT1QXGD/x3uNobryu';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Mendukung input 'email' maupun 'identifier' (NISN/NIP/Username)
    const rawIdentifier = body.identifier || body.email;
    const { password } = body;

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { message: 'Email/Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const identifier = String(rawIdentifier).toLowerCase().trim();
    const idKey = `id:${identifier.slice(0, 120)}`;
    const ipKey = `ip:${clientIp(req)}`;

    // 1. Terkunci karena terlalu banyak percobaan gagal?
    const locked = await lockedMinutes([idKey, ipKey]);
    if (locked > 0) {
      return NextResponse.json({ message: lockMessage(locked) }, { status: 429 });
    }

    const failKeys = [
      { key: idKey, max: MAX_PER_ACCOUNT },
      { key: ipKey, max: MAX_PER_IP },
    ];
    // Pesan sama untuk user tidak ada / password salah (tidak membocorkan akun mana yang ada)
    const invalid = async () => {
      await recordFailure(failKeys);
      return NextResponse.json(
        { message: 'Email/Username atau password salah' },
        { status: 401 }
      );
    };

    const user = await db.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
      include: { school: true },
    });

    if (!user) {
      await bcrypt.compare(String(password), DUMMY_HASH);
      return invalid();
    }

    // 2. Cek password DULU (sebelum status sekolah/role) supaya status akun tidak bocor ke orang asing.
    // Password di database harus bcrypt hash. Fallback teks biasa hanya untuk development.
    const isHashed = user.password.startsWith('$2');
    const valid = isHashed
      ? await bcrypt.compare(String(password), user.password)
      : process.env.NODE_ENV !== 'production' && user.password === password;
    if (!valid) return invalid();

    // 3. Password benar -> baru cek status sekolah & role
    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Akun ini dinonaktifkan. Hubungi admin sekolah.' },
        { status: 403 }
      );
    }
    if (user.role !== 'OWNER' && !user.school.isActive) {
      return NextResponse.json(
        { message: 'Layanan sekolah ini sedang dinonaktifkan. Hubungi penyedia aplikasi.' },
        { status: 403 }
      );
    }
    if (
      user.role === 'STUDENT' &&
      (!hasStudentRole(user.school.appVariant) || !STUDENT_PORTAL_READY)
    ) {
      return NextResponse.json(
        { message: 'Akses login siswa tidak tersedia untuk sekolah ini' },
        { status: 403 }
      );
    }

    await clearFailures(idKey);

    const token = await createToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      schoolId: user.schoolId,
      appVariant: user.school.appVariant,
      mustChangePassword: user.mustChangePassword,
      tv: user.tokenVersion,
    });
    await setAuthCookie(token, user.role);

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      role: user.role,
      schoolId: user.schoolId,
      appVariant: user.school.appVariant,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
