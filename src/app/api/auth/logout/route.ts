// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Hapus cookie token autentikasi
    cookieStore.delete('token');
    cookieStore.delete('auth_token');

    return NextResponse.json({
      success: true,
      message: 'Berhasil keluar',
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Gagal melakukan logout' },
      { status: 500 }
    );
  }
}