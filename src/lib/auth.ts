// src/lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { Role, AppVariant } from '@prisma/client'; // <-- IMPORT DARI PRISMA

// Gunakan fallback secret jika JWT_SECRET belum terbaca saat fase static build Next.js
const SECRET_KEY_STRING = process.env.JWT_SECRET || 'dev-only-secret-ganti-di-env';

const JWT_SECRET = new TextEncoder().encode(SECRET_KEY_STRING);

export interface TokenPayload {
  userId: string;
  role: Role;            // <-- MENGGUNAKAN ENUM PRISMA
  schoolId: string;
  appVariant: AppVariant; // <-- MENGGUNAKAN ENUM PRISMA
  email?: string | null;
  username?: string | null;
  name: string;
  mustChangePassword?: boolean;
  tv?: number; // versi sesi (lihat User.tokenVersion)
}

// Lama sesi: owner lebih pendek karena hak aksesnya paling besar
export function sessionSeconds(role: Role): number {
  return role === 'OWNER' ? 60 * 60 * 4 : 60 * 60 * 24;
}

// 1. Buat Token JWT
export async function createToken(payload: TokenPayload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${sessionSeconds(payload.role)}s`)
    .sign(JWT_SECRET);
}

// 2. Verifikasi Token JWT
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

// 3. Simpan Token ke Cookie
export async function setAuthCookie(token: string, role?: Role) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: role ? sessionSeconds(role) : 60 * 60 * 24,
    path: '/',
  });
}

// 4. Hapus Cookie (Logout)
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

// 5. Helper Ambil User Sekarang
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;
  return await verifyToken(token);
}