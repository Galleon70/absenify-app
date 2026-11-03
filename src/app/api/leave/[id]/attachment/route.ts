import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';

// GET: tampilkan file bukti. Orang tua hanya boleh membuka bukti milik anaknya sendiri.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await guard(['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT']);
  if (error) return error;

  try {
    const { id } = await params;
    const leave = await db.leaveRequest.findFirst({
      where: {
        id,
        schoolId: user.schoolId,
        ...(user.role === 'PARENT' ? { student: { parentId: user.userId } } : {}),
        ...(user.role === 'STUDENT' ? { student: { userId: user.userId } } : {}),
      },
      select: { attachmentData: true, attachmentMime: true, attachmentName: true },
    });

    if (!leave || !leave.attachmentData || !leave.attachmentMime) {
      return NextResponse.json({ success: false, message: 'Bukti tidak ditemukan' }, { status: 404 });
    }

    const filename = encodeURIComponent(leave.attachmentName || 'bukti');
    return new NextResponse(leave.attachmentData, {
      headers: {
        'Content-Type': leave.attachmentMime,
        'Content-Disposition': `inline; filename*=UTF-8''${filename}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (e) {
    return serverError(e, 'Gagal mengambil bukti');
  }
}
