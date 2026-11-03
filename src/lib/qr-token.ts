// src/lib/qr-token.ts
// Token QR murid (Mode 3). Berumur pendek dan ditandatangani, jadi screenshot yang dikirim ke teman
// tidak berguna dan QR tidak bisa dipalsukan.
import { createHmac, timingSafeEqual } from 'crypto';

export const QR_TTL_SECONDS = 90; // batas usia token saat dipindai
export const QR_REFRESH_SECONDS = 45; // layar murid memuat QR baru sebelum ini habis

const PREFIX = 'HK1';

function key() {
  const base = process.env.JWT_SECRET || 'dev-only-secret-ganti-di-env';
  return `${base}:qr`;
}

function sign(studentId: string, ts: number) {
  return createHmac('sha256', key()).update(`${studentId}.${ts}`).digest('hex').slice(0, 32);
}

export function createQrToken(studentId: string, now = Date.now()) {
  const ts = Math.floor(now / 1000);
  return `${PREFIX}.${studentId}.${ts}.${sign(studentId, ts)}`;
}

export type QrCheck =
  | { ok: true; studentId: string }
  | { ok: false; reason: 'INVALID' | 'EXPIRED' };

export function verifyQrToken(token: string, now = Date.now()): QrCheck {
  const parts = String(token || '').trim().split('.');
  if (parts.length !== 4 || parts[0] !== PREFIX) return { ok: false, reason: 'INVALID' };
  const [, studentId, tsStr, sig] = parts;
  const ts = Number(tsStr);
  if (!studentId || !Number.isInteger(ts)) return { ok: false, reason: 'INVALID' };

  const expected = Buffer.from(sign(studentId, ts));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'INVALID' };
  }

  const age = Math.floor(now / 1000) - ts;
  if (age > QR_TTL_SECONDS || age < -30) return { ok: false, reason: 'EXPIRED' };
  return { ok: true, studentId };
}
