// src/lib/variant.ts
import type { AppVariant } from '@prisma/client';

// Portal murid (halaman /student) sudah tersedia untuk Mode 2 dan 3.
export const STUDENT_PORTAL_READY = true;

// Apakah mode ini mengizinkan akun/role Student?
export const hasStudentRole = (variant: AppVariant) =>
  variant === 'VARIANT_2' || variant === 'VARIANT_3';

// Apakah mode ini punya fitur QR presensi?
export const hasStudentQrFeature = (variant: AppVariant) => variant === 'VARIANT_3';

// Role yang boleh dibuat admin untuk sekolah dengan mode tertentu
export const allowedRoles = (variant: AppVariant): string[] =>
  hasStudentRole(variant)
    ? ['ADMIN', 'TEACHER', 'PARENT', 'PRINCIPAL', 'STUDENT']
    : ['ADMIN', 'TEACHER', 'PARENT', 'PRINCIPAL'];

// Mode yang SUDAH selesai dibangun dan boleh dipilih untuk sekolah baru.
export const AVAILABLE_VARIANTS: AppVariant[] = ['VARIANT_1', 'VARIANT_2', 'VARIANT_3'];
