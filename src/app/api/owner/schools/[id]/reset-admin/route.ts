import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { generateTempPassword } from '@/lib/password';
import { PLATFORM_SCHOOL_ID } from '@/lib/platform';
import { logAudit } from '@/lib/audit';
import { clearAccountLock } from '@/lib/login-throttle';

// POST: buat password sementara baru untuk admin pertama sekolah (kalau admin lupa password)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user: owner, error } = await guard(['OWNER']);
  if (error) return error;

  try {
    const { id } = await params;
    if (id === PLATFORM_SCHOOL_ID) {
      return NextResponse.json({ success: false, message: 'Tidak bisa diubah' }, { status: 400 });
    }
    const admin = await db.user.findFirst({
      where: { schoolId: id, role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Admin sekolah tidak ditemukan' }, { status: 404 });
    }

    const tempPassword = generateTempPassword();
    await db.user.update({
      where: { id: admin.id },
      data: { password: await bcrypt.hash(tempPassword, 10), mustChangePassword: true, tokenVersion: { increment: 1 } },
    });

    await clearAccountLock([admin.email, admin.username]);
    const school = await db.school.findUnique({ where: { id }, select: { name: true } });
    await logAudit(owner, 'ADMIN_PASSWORD_RESET', { schoolId: id, schoolName: school?.name, detail: admin.email ?? undefined });

    return NextResponse.json({
      success: true,
      message: `Password admin direset.\n\nEmail: ${admin.email}\nPassword sementara: ${tempPassword}\n(Hanya tampil sekali, wajib diganti saat login.)`,
    });
  } catch (e) {
    return serverError(e, 'Gagal mereset password admin');
  }
}
