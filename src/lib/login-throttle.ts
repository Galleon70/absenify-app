// src/lib/login-throttle.ts
// Membatasi percobaan login/ganti password yang gagal. Tersimpan di database (bukan memori)
// supaya tetap berlaku di hosting serverless. Berlaku juga untuk email yang TIDAK terdaftar,
// sehingga penyerang tidak bisa membedakan akun yang ada dan tidak.
import { db } from '@/lib/db';

export const LOCK_MINUTES = 15;
export const WINDOW_MINUTES = 15;
export const MAX_PER_ACCOUNT = 5;
export const MAX_PER_IP = 300; // longgar: satu sekolah biasanya berbagi satu IP publik

export type ThrottleKey = { key: string; max: number };

export function clientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim().slice(0, 64);
  return (req.headers.get('x-real-ip') || 'unknown').slice(0, 64);
}

// Kembalikan sisa menit terkunci (0 = boleh lanjut)
export async function lockedMinutes(keys: string[]): Promise<number> {
  const rows = await db.loginThrottle.findMany({ where: { key: { in: keys } } });
  const now = Date.now();
  let until = 0;
  for (const r of rows) {
    if (r.lockedUntil && r.lockedUntil.getTime() > now) until = Math.max(until, r.lockedUntil.getTime());
  }
  return until ? Math.max(1, Math.ceil((until - now) / 60000)) : 0;
}

export async function recordFailure(keys: ThrottleKey[]) {
  const now = new Date();
  for (const { key, max } of keys) {
    const row = await db.loginThrottle.findUnique({ where: { key } });
    const windowOld = !row || now.getTime() - row.windowStart.getTime() > WINDOW_MINUTES * 60000;
    const count = windowOld ? 1 : row.count + 1;
    if (count >= max) {
      await db.loginThrottle.upsert({
        where: { key },
        update: { count: 0, windowStart: now, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60000) },
        create: { key, count: 0, windowStart: now, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60000) },
      });
    } else {
      await db.loginThrottle.upsert({
        where: { key },
        update: { count, windowStart: windowOld ? now : undefined },
        create: { key, count, windowStart: now },
      });
    }
  }
  // Bersih-bersih sesekali supaya tabel tidak menumpuk
  if (Math.random() < 0.02) {
    const cutoff = new Date(now.getTime() - 24 * 3600 * 1000);
    await db.loginThrottle.deleteMany({ where: { windowStart: { lt: cutoff }, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] } });
  }
}

export async function clearFailures(key: string) {
  await db.loginThrottle.deleteMany({ where: { key } });
}

// Dipanggil saat password sebuah akun direset oleh admin/owner: kunci login akun itu ikut dibuka,
// supaya pemilik akun bisa langsung masuk dengan password baru (tidak perlu menunggu 15 menit).
export async function clearAccountLock(identifiers: (string | null | undefined)[]) {
  const keys = identifiers
    .filter((v): v is string => !!v)
    .map((v) => `id:${v.toLowerCase().trim().slice(0, 120)}`);
  if (keys.length > 0) await db.loginThrottle.deleteMany({ where: { key: { in: keys } } });
}

export const lockMessage = (minutes: number) =>
  `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`;
