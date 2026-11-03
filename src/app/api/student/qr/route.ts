import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { hasStudentQrFeature } from '@/lib/variant';
import { createQrToken, QR_REFRESH_SECONDS, QR_TTL_SECONDS } from '@/lib/qr-token';

// GET: token QR baru untuk murid yang sedang login (Mode 3). Dipanggil berkala oleh layar murid.
export async function GET() {
  const { user, error } = await guard(['STUDENT']);
  if (error) return error;

  try {
    if (!hasStudentQrFeature(user.appVariant)) {
      return NextResponse.json({ success: false, message: 'Fitur QR tidak aktif untuk sekolah ini' }, { status: 403 });
    }
    const student = await db.student.findFirst({
      where: { userId: user.userId, schoolId: user.schoolId },
      select: { id: true },
    });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Data murid belum terhubung ke akun ini' }, { status: 404 });
    }
    return NextResponse.json(
      {
        success: true,
        data: { token: createQrToken(student.id), refreshInSeconds: QR_REFRESH_SECONDS, validForSeconds: QR_TTL_SECONDS },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    return serverError(e, 'Gagal membuat QR');
  }
}
