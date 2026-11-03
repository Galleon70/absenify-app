// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email wajib diisi' }, { status: 400 });
    }

    // 1. Cari user di DB (Simulasi)
    // const user = await db.user.findUnique({ where: { email } });

    // Keamanan: Tetap kembalikan pesan sukses meskipun email tak terdaftar untuk cegah User Enumeration Attack
    // if (!user) {
    //   return NextResponse.json({ message: 'Instruksi reset password telah dikirim jika email terdaftar.' });
    // }

    // 2. Generate token mentah & token yang ter-hash untuk simpan di DB
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // Kadaluarsa dalam 1 Jam

    // 3. Simpan hash & expiry ke DB
    /*
    await db.user.update({
      where: { email },
      data: {
        resetToken: hashedResetToken,
        resetTokenExpiry: tokenExpiry,
      },
    });
    */

    // 4. Link yang dikirim ke email user (membawa token mentah)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${rawResetToken}&email=${encodeURIComponent(email)}`;

    console.log('--- LINK RESET PASSWORD (KIRIM VIA EMAIL / WA) ---');
    console.log(resetUrl);

    return NextResponse.json({
      success: true,
      message: 'Instruksi reset password telah dikirim jika email terdaftar.',
    });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal memproses permintaan' }, { status: 500 });
  }
}