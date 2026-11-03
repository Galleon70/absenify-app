// src/lib/audit.ts
import { db } from '@/lib/db';
import type { TokenPayload } from '@/lib/auth';

// Catat aktivitas penting. Tidak pernah melempar error supaya aksi utama tidak ikut gagal.
export async function logAudit(
  actor: TokenPayload,
  action: string,
  opts: { schoolId?: string; schoolName?: string; detail?: string } = {}
) {
  try {
    await db.auditLog.create({
      data: {
        actorId: actor.userId,
        actorName: actor.name,
        action,
        targetSchoolId: opts.schoolId ?? null,
        targetName: opts.schoolName ?? null,
        detail: opts.detail ?? null,
      },
    });
  } catch (e) {
    console.error('Gagal mencatat audit log:', e);
  }
}
