import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// GET: pengaturan sekolah yang boleh diubah admin sekolah
export async function GET() {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;
  try {
    const school = await db.school.findUnique({ where: { id: user.schoolId }, select: { name: true, lateAfter: true } });
    return NextResponse.json({ success: true, data: { name: school?.name ?? '', lateAfter: school?.lateAfter || '07:15' } });
  } catch (e) {
    return serverError(e, 'Gagal memuat pengaturan');
  }
}

// PUT: ubah jam batas terlambat (scan QR). Format HH:MM, 24 jam, zona waktu sekolah.
export async function PUT(req: Request) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;
  try {
    const { lateAfter } = await req.json();
    if (!TIME_RE.test(String(lateAfter ?? ''))) {
      return NextResponse.json({ success: false, message: 'Format jam harus HH:MM, mis. 07:30' }, { status: 400 });
    }
    await db.school.update({ where: { id: user.schoolId }, data: { lateAfter: String(lateAfter) } });
    return NextResponse.json({ success: true, message: 'Jam batas terlambat disimpan' });
  } catch (e) {
    return serverError(e, 'Gagal menyimpan pengaturan');
  }
}
