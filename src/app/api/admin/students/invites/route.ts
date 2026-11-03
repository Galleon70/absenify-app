import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { generateInviteCode, hashInvite, inviteExpiry, INVITE_TTL_DAYS } from '@/lib/invite';

// POST: buat kode pendaftaran orang tua. Body: { all: true } atau { studentIds: [...] }.
// Hanya murid yang belum terhubung ke orang tua. Kode tampil SEKALI (di database hanya hash-nya).
export async function POST(req: Request) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = Array.isArray(body.studentIds) ? body.studentIds.slice(0, 500) : undefined;
    if (!body.all && (!ids || ids.length === 0)) {
      return NextResponse.json({ success: false, message: 'Pilih murid terlebih dahulu' }, { status: 400 });
    }

    const students = await db.student.findMany({
      where: { schoolId: user.schoolId, ...(body.all ? {} : { id: { in: ids } }) },
      select: { id: true, name: true, nisn: true, parentId: true, classRoom: { select: { name: true } } },
      orderBy: [{ classRoom: { name: 'asc' } }, { name: 'asc' }],
      take: 1000,
    });

    const created: { name: string; className: string | null; nisn: string | null; code: string; expiresAt: string }[] = [];
    const skipped: { name: string; reason: string }[] = [];
    const expiresAt = inviteExpiry();

    for (const s of students) {
      if (s.parentId) {
        if (!body.all) skipped.push({ name: s.name, reason: 'Sudah terhubung ke orang tua' });
        continue;
      }
      const code = generateInviteCode();
      await db.student.update({ where: { id: s.id }, data: { inviteHash: hashInvite(code), inviteExpiresAt: expiresAt } });
      created.push({ name: s.name, className: s.classRoom?.name ?? null, nisn: s.nisn, code, expiresAt: expiresAt.toISOString() });
    }

    return NextResponse.json({ success: true, data: { created, skipped, validDays: INVITE_TTL_DAYS } });
  } catch (e) {
    return serverError(e, 'Gagal membuat kode pendaftaran');
  }
}
