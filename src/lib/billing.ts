// src/lib/billing.ts
export type BillingStatus = 'NONE' | 'OK' | 'DUE_SOON' | 'OVERDUE';

// NONE = tanggal berlaku belum diatur, OVERDUE = sudah lewat, DUE_SOON = 7 hari atau kurang lagi.
// daysLeft: sisa hari (0 = berakhir hari ini), negatif = sudah lewat sekian hari.
export function billingInfo(paidUntil: Date | null, now = new Date()) {
  if (!paidUntil) return { status: 'NONE' as BillingStatus, daysLeft: null as number | null };
  const diffMs = paidUntil.getTime() - now.getTime();
  if (diffMs < 0) {
    return { status: 'OVERDUE' as BillingStatus, daysLeft: -Math.ceil(-diffMs / 86_400_000) };
  }
  const daysLeft = Math.ceil(diffMs / 86_400_000);
  return { status: (daysLeft <= 7 ? 'DUE_SOON' : 'OK') as BillingStatus, daysLeft };
}

// Tambah bulan tanpa "loncat" (31 Jan + 1 bulan = 28/29 Feb, bukan 3 Mar)
export function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}
