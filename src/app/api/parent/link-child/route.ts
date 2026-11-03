import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard } from '@/lib/guard';
import { hashInvite } from '@/lib/invite';
import { clientIp, lockedMinutes, lockMessage, recordFailure } from '@/lib/login-throttle';

const bad = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

// POST: orang tua yang sudah punya akun menambahkan anak lain dengan kode dari sekolah.
export async function POST(req: Request) {
  const { user, error } = await guard(['PARENT']);
  if (error) return error;

  const key = `reg:${clientIp(req)}`;
  const locked = await lockedMinutes([key]);
  if (locked > 0) return bad(lockMessage(locked), 429);

  try {
    const { code } = await req.json();
    const hash = hashInvite(String(code ?? ''));
    // Murid harus di sekolah yang sama dengan akun orang tua ini
    const claimed = await db.student.updateMany({
      where: { inviteHash: hash, inviteExpiresAt: { gt: new Date() }, parentId: null, schoolId: user.schoolId },
      data: { parentId: user.userId, inviteHash: null, inviteExpiresAt: null },
    });
    if (claimed.count !== 1) {
      await recordFailure([{ key, max: 10 }]);
      return bad('Kode tidak valid atau sudah kedaluwarsa');
    }
    return NextResponse.json({ success: true, message: 'Anak berhasil ditambahkan' });
  } catch (e) {
    console.error('Gagal menambah anak:', e);
    return bad('Terjadi kesalahan server', 500);
  }
}
