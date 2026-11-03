// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { guard } from '@/lib/guard';

// GET: info singkat akun yang sedang login (dari token)
export async function GET() {
  const { user, error } = await guard(undefined, { allowMustChange: true });
  if (error) return error;
  return NextResponse.json({
    success: true,
    data: {
      name: user.name,
      identifier: user.email || user.username || '',
      role: user.role,
      appVariant: user.appVariant,
      mustChangePassword: !!user.mustChangePassword,
    },
  });
}
