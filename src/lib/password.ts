// src/lib/password.ts
import { randomInt } from 'crypto';

// Tanpa karakter yang mirip (0/O, 1/l/I) supaya mudah dibaca dan diketik orang tua
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function generateTempPassword(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

const COMMON = ['ortu12345', 'admin123', 'password123', 'siswa123', '12345678', 'password', 'qwerty123'];

// Aturan password baru. Mengembalikan pesan error, atau null kalau valid.
export function validateNewPassword(pw: string, current?: string): string | null {
  if (pw.length < 8) return 'Password baru minimal 8 karakter';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password baru harus mengandung huruf dan angka';
  if (COMMON.includes(pw.toLowerCase())) return 'Password terlalu umum, gunakan yang lain';
  if (current && pw === current) return 'Password baru tidak boleh sama dengan password lama';
  return null;
}
