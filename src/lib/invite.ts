// src/lib/invite.ts
// Kode pendaftaran orang tua: acak, sekali pakai, kedaluwarsa. Di database hanya hash-nya yang disimpan.
import { createHmac, randomInt } from 'crypto';

export const INVITE_TTL_DAYS = 30;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0/O/1/I agar mudah dibaca

export function generateInviteCode(): string {
  const raw = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function normalizeInvite(code: string): string {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function hashInvite(code: string): string {
  const secret = process.env.JWT_SECRET || 'dev-only-secret-ganti-di-env';
  return createHmac('sha256', `${secret}:invite`).update(normalizeInvite(code)).digest('hex');
}

export const inviteExpiry = () => new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);
