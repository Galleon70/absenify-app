import { NextResponse } from 'next/server';
import type { AppVariant } from '@prisma/client';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { AVAILABLE_VARIANTS } from '@/lib/variant';
import { PLATFORM_SCHOOL_ID } from '@/lib/platform';
import { logAudit } from '@/lib/audit';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const bad = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

// PATCH: ubah data sekolah. (Sekolah sengaja TIDAK bisa dihapus dari sini karena menghapus sekolah
// menghapus seluruh datanya. Gunakan "nonaktifkan".)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user: owner, error } = await guard(['OWNER']);
  if (error) return error;

  try {
    const { id } = await params;
    if (id === PLATFORM_SCHOOL_ID) return bad('Tidak bisa diubah');

    const current = await db.school.findUnique({ where: { id } });
    if (!current) return bad('Sekolah tidak ditemukan', 404);

    const b = await req.json();
    const data: {
      name?: string;
      appVariant?: AppVariant;
      isActive?: boolean;
      contactName?: string | null;
      contactPhone?: string | null;
      pricePerMonth?: number | null;
      paidUntil?: Date | null;
      notes?: string | null;
      lateAfter?: string;
    } = {};
    const changed: string[] = [];

    if (typeof b.name === 'string' && b.name.trim() && b.name.trim() !== current.name) {
      data.name = b.name.trim().slice(0, 120);
      changed.push('nama');
    }
    if (b.appVariant !== undefined && b.appVariant !== current.appVariant) {
      if (!AVAILABLE_VARIANTS.includes(b.appVariant)) return bad('Mode ini belum tersedia');
      data.appVariant = b.appVariant;
      changed.push('mode');
    }
    if (typeof b.isActive === 'boolean' && b.isActive !== current.isActive) {
      data.isActive = b.isActive;
    }
    if (b.contactName !== undefined) {
      data.contactName = String(b.contactName ?? '').trim().slice(0, 120) || null;
      changed.push('kontak');
    }
    if (b.contactPhone !== undefined) {
      data.contactPhone = String(b.contactPhone ?? '').trim().slice(0, 30) || null;
      if (!changed.includes('kontak')) changed.push('kontak');
    }
    if (b.pricePerMonth !== undefined) {
      if (b.pricePerMonth === null || b.pricePerMonth === '') {
        data.pricePerMonth = null;
      } else {
        const n = Number(b.pricePerMonth);
        if (!Number.isInteger(n) || n < 0) return bad('Harga per bulan harus angka bulat');
        data.pricePerMonth = n;
      }
      changed.push('harga');
    }
    if (b.paidUntil !== undefined) {
      if (b.paidUntil === null || b.paidUntil === '') {
        data.paidUntil = null;
      } else {
        if (!DATE_RE.test(String(b.paidUntil))) return bad('Format tanggal tidak valid');
        data.paidUntil = new Date(`${b.paidUntil}T23:59:59.000`);
      }
      changed.push('masa berlaku');
    }
    if (b.lateAfter !== undefined) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(b.lateAfter))) return bad('Format jam harus HH:MM, mis. 07:15');
      data.lateAfter = String(b.lateAfter);
      changed.push('jam batas terlambat');
    }
    if (b.notes !== undefined) {
      data.notes = String(b.notes ?? '').trim().slice(0, 500) || null;
      changed.push('catatan');
    }

    if (Object.keys(data).length === 0) return bad('Tidak ada perubahan');

    await db.school.update({ where: { id }, data });

    const name = data.name ?? current.name;
    if (data.isActive !== undefined) {
      await logAudit(owner, data.isActive ? 'SCHOOL_ACTIVATED' : 'SCHOOL_DEACTIVATED', { schoolId: id, schoolName: name });
    }
    if (changed.length > 0) {
      await logAudit(owner, 'SCHOOL_UPDATED', { schoolId: id, schoolName: name, detail: `Diubah: ${changed.join(', ')}` });
    }
    return NextResponse.json({ success: true, message: 'Sekolah diperbarui' });
  } catch (e) {
    return serverError(e, 'Gagal memperbarui sekolah');
  }
}
