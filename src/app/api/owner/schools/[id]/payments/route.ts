import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { PLATFORM_SCHOOL_ID } from '@/lib/platform';
import { addMonths } from '@/lib/billing';
import { logAudit } from '@/lib/audit';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const bad = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

// GET: riwayat pembayaran sekolah
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await guard(['OWNER']);
  if (error) return error;
  try {
    const { id } = await params;
    const data = await db.schoolPayment.findMany({
      where: { schoolId: id },
      orderBy: { paidAt: 'desc' },
      take: 24,
      select: { id: true, amount: true, months: true, paidAt: true, note: true },
    });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return serverError(e, 'Gagal mengambil riwayat pembayaran');
  }
}

// POST: catat pembayaran. Masa berlaku diperpanjang {months} bulan dari tanggal berlaku saat ini
// (atau dari hari ini kalau sudah lewat / belum diatur).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user: owner, error } = await guard(['OWNER']);
  if (error) return error;

  try {
    const { id } = await params;
    if (id === PLATFORM_SCHOOL_ID) return bad('Tidak bisa diubah');

    const school = await db.school.findUnique({ where: { id } });
    if (!school) return bad('Sekolah tidak ditemukan', 404);

    const b = await req.json();
    const amount = Number(b.amount);
    const months = Number(b.months ?? 1);
    if (!Number.isInteger(amount) || amount < 0) return bad('Jumlah pembayaran harus angka bulat');
    if (!Number.isInteger(months) || months < 1 || months > 36) return bad('Jumlah bulan harus 1 sampai 36');
    if (b.paidAt && !DATE_RE.test(String(b.paidAt))) return bad('Format tanggal bayar tidak valid');

    const now = new Date();
    const base = school.paidUntil && school.paidUntil > now ? school.paidUntil : now;
    const newPaidUntil = addMonths(base, months);

    await db.$transaction([
      db.schoolPayment.create({
        data: {
          schoolId: id,
          amount,
          months,
          paidAt: b.paidAt ? new Date(`${b.paidAt}T12:00:00.000`) : now,
          note: String(b.note ?? '').trim().slice(0, 200) || null,
        },
      }),
      db.school.update({ where: { id }, data: { paidUntil: newPaidUntil } }),
    ]);

    await logAudit(owner, 'PAYMENT_RECORDED', {
      schoolId: id,
      schoolName: school.name,
      detail: `Rp${amount.toLocaleString('id-ID')} untuk ${months} bulan`,
    });

    return NextResponse.json({
      success: true,
      message: `Pembayaran dicatat. Langganan berlaku sampai ${newPaidUntil.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      data: { paidUntil: newPaidUntil },
    });
  } catch (e) {
    return serverError(e, 'Gagal mencatat pembayaran');
  }
}
