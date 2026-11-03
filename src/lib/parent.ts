// src/lib/parent.ts
// Cari atau buat akun Orang Tua dari email, lalu dipakai untuk menghubungkan ke siswa.
import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import { generateTempPassword } from '@/lib/password';

export async function findOrCreateParent(
  tx: Prisma.TransactionClient,
  schoolId: string,
  email: string,
  name?: string | null
): Promise<{ id: string; created: boolean; tempPassword?: string }> {
  const normalized = email.toLowerCase().trim();
  // Email unik di SELURUH platform supaya login (yang mencari lewat email) tidak tertukar antar sekolah
  const existing = await tx.user.findFirst({ where: { email: normalized } });
  if (existing && existing.schoolId !== schoolId) {
    throw new Error('EMAIL_OTHER_SCHOOL');
  }

  if (existing) {
    if (existing.role !== 'PARENT') {
      throw new Error('EMAIL_ROLE_CONFLICT');
    }
    return { id: existing.id, created: false };
  }

  const tempPassword = generateTempPassword();
  const created = await tx.user.create({
    data: {
      name: name?.trim() || 'Orang Tua',
      email: normalized,
      password: await bcrypt.hash(tempPassword, 10),
      role: 'PARENT',
      mustChangePassword: true,
      schoolId,
    },
  });
  return { id: created.id, created: true, tempPassword };
}
