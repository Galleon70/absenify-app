// src/app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
// import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    // 1. Hash token inputan untuk dicocokkan dengan yang ada di DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Cari user yang tokennya cocok DAN belum expired
    /*
    const user = await db.user.findFirst({
      where: {
        email,
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() }, // Expiry harus lebih besar dari jam sekarang
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Token tidak valid atau sudah kadaluarsa.' }, { status: 400 });
    }

    // 3. Update password baru & bersihkan token reset
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui. Silakan login kembali.',
    });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal memperbarui password' }, { status: 500 });
  }
}