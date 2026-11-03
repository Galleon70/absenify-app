// src/lib/guard.ts
// Helper untuk semua API: cek login + cek role. schoolId SELALU diambil dari token, bukan dari body.
// Role, mode sekolah, dan versi sesi dicek ulang ke database setiap request supaya perubahan
// (password direset, sekolah dinonaktifkan, mode diganti) langsung berlaku.
import { NextResponse } from 'next/server';
import { getCurrentUser, type TokenPayload } from '@/lib/auth';
import { db } from '@/lib/db';

type RoleName = TokenPayload['role'];

type GuardResult =
  | { user: TokenPayload; error: null }
  | { user: null; error: NextResponse };

export async function guard(
  roles?: RoleName[],
  opts: { allowMustChange?: boolean } = {}
): Promise<GuardResult> {
  const session = await getCurrentUser();
  if (!session) {
    return {
      user: null,
      error: NextResponse.json({ success: false, message: 'Belum login' }, { status: 401 }),
    };
  }

  const row = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      role: true,
      isActive: true,
      tokenVersion: true,
      mustChangePassword: true,
      schoolId: true,
      school: { select: { isActive: true, appVariant: true } },
    },
  });

  // Akun dihapus, atau sesi sudah dicabut (password diganti/direset)
  if (!row || row.tokenVersion !== (session.tv ?? 0) || row.schoolId !== session.schoolId) {
    const res = NextResponse.json(
      { success: false, message: 'Sesi berakhir, silakan login ulang' },
      { status: 401 }
    );
    res.cookies.delete('auth_token');
    return { user: null, error: res };
  }

  // Akun dinonaktifkan oleh admin sekolah
  if (!row.isActive) {
    const res = NextResponse.json(
      { success: false, message: 'Akun ini dinonaktifkan. Hubungi admin sekolah.' },
      { status: 401 }
    );
    res.cookies.delete('auth_token');
    return { user: null, error: res };
  }

  // Sekolah yang dinonaktifkan (mis. langganan berhenti) tidak bisa memakai API lagi
  if (row.role !== 'OWNER' && !row.school.isActive) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: 'Layanan sekolah ini sedang dinonaktifkan. Hubungi penyedia aplikasi.' },
        { status: 403 }
      ),
    };
  }

  if (row.mustChangePassword && !opts.allowMustChange) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: 'Anda wajib mengganti password terlebih dahulu' },
        { status: 403 }
      ),
    };
  }

  // Role & mode diambil dari database (bukan token) supaya tidak basi
  const user: TokenPayload = {
    ...session,
    role: row.role,
    appVariant: row.school.appVariant,
    mustChangePassword: row.mustChangePassword,
  };

  if (roles && !roles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 }),
    };
  }
  return { user, error: null };
}

export function serverError(e: unknown, fallback: string) {
  const err = e as { code?: string; message?: string };
  if (err?.code === 'P2002') {
    return NextResponse.json(
      { success: false, message: 'Data sudah ada (duplikat), cek email/NISN/nama kelas' },
      { status: 400 }
    );
  }
  console.error(fallback, e);
  return NextResponse.json({ success: false, message: fallback }, { status: 500 });
}
