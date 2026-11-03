// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { hasStudentRole, STUDENT_PORTAL_READY } from './lib/variant';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Jika mencoba akses /login atau / saat SUDAH login
  if (pathname === '/login' || pathname === '/') {
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        if (payload.mustChangePassword) {
          return NextResponse.redirect(new URL('/change-password', request.url));
        }
        // Akun siswa diblokir kalau mode tidak mengizinkan ATAU portal murid belum dibangun
        if (payload.role === 'STUDENT' && (!hasStudentRole(payload.appVariant) || !STUDENT_PORTAL_READY)) {
          const response = NextResponse.redirect(new URL('/login?error=variant_blocked', request.url));
          response.cookies.delete('auth_token');
          return response;
        }

        // Redirect sesuai Role masing-masing
        if (payload.role === 'OWNER') return NextResponse.redirect(new URL('/owner/dashboard', request.url));
        if (payload.role === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        if (payload.role === 'TEACHER') return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
        if (payload.role === 'PARENT') return NextResponse.redirect(new URL('/parent/dashboard', request.url));
        if (payload.role === 'PRINCIPAL') return NextResponse.redirect(new URL('/principal/dashboard', request.url));
        if (payload.role === 'STUDENT') return NextResponse.redirect(new URL('/student/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Jika BELUM login dan mencoba buka area terproteksi
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Verifikasi Token
  const payload = await verifyToken(token);
  if (!payload) {
    // Token basi/invalid -> Hapus cookie & redirect ke login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  const { role, appVariant } = payload;

  // Akun dengan password sementara wajib ganti password dulu
  if (payload.mustChangePassword && pathname !== '/change-password') {
    return NextResponse.redirect(new URL('/change-password', request.url));
  }

  // 4. Blokir akun siswa jika mode tidak mengizinkan / portal murid belum tersedia
  if (role === 'STUDENT' && (!hasStudentRole(appVariant) || !STUDENT_PORTAL_READY)) {
    const response = NextResponse.redirect(new URL('/login?error=variant_blocked', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  // 5. Batasi Hak Akses Berdasarkan Role & Route
  if (pathname.startsWith('/owner') && role !== 'OWNER') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (pathname.startsWith('/teacher') && role !== 'TEACHER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (pathname.startsWith('/parent') && role !== 'PARENT') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (pathname.startsWith('/principal') && role !== 'PRINCIPAL' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 6. Area Khusus Murid (Mode 2 & 3)
  if (pathname.startsWith('/student') && role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 7. Scanner QR (Mode 3) untuk guru/admin
  if (pathname.startsWith('/scan')) {
    if (role !== 'TEACHER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (appVariant !== 'VARIANT_3') {
      return NextResponse.redirect(new URL(role === 'ADMIN' ? '/admin/dashboard' : '/teacher/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/owner/:path*',
    '/admin/:path*',
    '/teacher/:path*',
    '/parent/:path*',
    '/principal/:path*',
    '/student/:path*',
    '/scan',
    '/scan/:path*',
    '/login',
    '/change-password',
  ],
};