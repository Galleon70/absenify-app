import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashInvite } from '@/lib/invite';
import { clientIp, lockedMinutes, lockMessage, recordFailure } from '@/lib/login-throttle';

// POST: periksa kode pendaftaran dan tampilkan anak yang dituju (supaya orang tua yakin kodenya benar).
export async function POST(req: Request) {
  const key = `reg:${clientIp(req)}`;
  const locked = await lockedMinutes([key]);
  if (locked > 0) return NextResponse.json({ success: false, message: lockMessage(locked) }, { status: 429 });

  try {
    const { code } = await req.json();
    const student = await db.student.findFirst({
      where: { inviteHash: hashInvite(String(code ?? '')), inviteExpiresAt: { gt: new Date() }, parentId: null },
      select: { name: true, classRoom: { select: { name: true } }, school: { select: { name: true, isActive: true } } },
    });
    if (!student || !student.school.isActive) {
      await recordFailure([{ key, max: 10 }]);
      return NextResponse.json({ success: false, message: 'Kode tidak valid atau sudah kedaluwarsa' }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      data: { studentName: student.name, className: student.classRoom?.name ?? null, schoolName: student.school.name },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan' }, { status: 500 });
  }
}
