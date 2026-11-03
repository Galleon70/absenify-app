import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';

// GET: aktivitas terbaru. Opsional ?schoolId= untuk satu sekolah, ?limit= (maks 50)
export async function GET(req: Request) {
  const { error } = await guard(['OWNER']);
  if (error) return error;
  try {
    const sp = new URL(req.url).searchParams;
    const schoolId = sp.get('schoolId');
    const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 50);
    const data = await db.auditLog.findMany({
      where: schoolId ? { targetSchoolId: schoolId } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return serverError(e, 'Gagal mengambil aktivitas');
  }
}
