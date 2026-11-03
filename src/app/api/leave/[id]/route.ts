import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';

// PATCH: admin menyetujui / menolak izin. Body: { status: 'APPROVED' | 'REJECTED' }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const { id } = await params;
    const { status } = await req.json();
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return NextResponse.json({ success: false, message: 'Status tidak valid' }, { status: 400 });
    }
    const result = await db.leaveRequest.updateMany({
      where: { id, schoolId: user.schoolId },
      data: { status },
    });
    if (result.count === 0) {
      return NextResponse.json({ success: false, message: 'Pengajuan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Status izin diperbarui' });
  } catch (e) {
    return serverError(e, 'Gagal memperbarui izin');
  }
}
