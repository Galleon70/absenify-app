import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { findOrCreateParent } from '@/lib/parent';

type Ctx = { params: Promise<{ id: string }> };

const opt = (v: unknown) => (v === undefined ? undefined : v || null);

export async function PUT(req: Request, { params }: Ctx) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const { id } = await params;
    const b = await req.json();

    const existing = await db.student.findFirst({ where: { id, schoolId: user.schoolId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    if (b.classRoomId) {
      const cls = await db.classRoom.findFirst({ where: { id: b.classRoomId, schoolId: user.schoolId } });
      if (!cls) {
        return NextResponse.json({ success: false, message: 'Kelas tidak valid' }, { status: 400 });
      }
    }

    // Hubungkan ke akun orang tua kalau email diisi (kosong = tidak mengubah hubungan yang ada)
    const parentEmail: string = b.parentEmail?.trim() || '';

    // Whitelist field: body mentah TIDAK langsung dimasukkan ke database
    const updated = await db.$transaction(async (tx) => {
      const parentId = parentEmail
        ? (await findOrCreateParent(tx, user.schoolId, parentEmail, b.parentName)).id
        : undefined;
      return tx.student.update({
      where: { id },
      data: {
        parentId,
        parentName: opt(b.parentName?.trim?.() ?? b.parentName) as string | null | undefined,
        name: b.name?.trim() || undefined,
        nis: opt(b.nis) as string | null | undefined,
        nisn: opt(b.nisn) as string | null | undefined,
        classRoomId: opt(b.classRoomId) as string | null | undefined,
        gender: opt(b.gender) as string | null | undefined,
        status: b.status || undefined,
        birthDate: b.birthDate === undefined ? undefined : b.birthDate ? new Date(b.birthDate) : null,
        parentPhone: opt(b.parentPhone) as string | null | undefined,
      },
      });
    });
    return NextResponse.json({ success: true, message: 'Data siswa berhasil diperbarui', data: updated });
  } catch (e) {
    if ((e as Error).message === 'EMAIL_OTHER_SCHOOL') {
      return NextResponse.json(
        { success: false, message: 'Email itu sudah terdaftar di sekolah lain. Gunakan email orang tua yang berbeda.' },
        { status: 400 }
      );
    }
    if ((e as Error).message === 'EMAIL_ROLE_CONFLICT') {
      return NextResponse.json(
        { success: false, message: 'Email itu sudah dipakai akun lain (bukan orang tua)' },
        { status: 400 }
      );
    }
    return serverError(e, 'Gagal memperbarui data siswa');
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await db.student.findFirst({ where: { id, schoolId: user.schoolId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Siswa tidak ditemukan' }, { status: 404 });
    }
    await db.$transaction(async (tx) => {
      await tx.student.delete({ where: { id } });
      if (existing.userId) await tx.user.delete({ where: { id: existing.userId } });
    });
    return NextResponse.json({ success: true, message: 'Siswa berhasil dihapus' });
  } catch (e) {
    return serverError(e, 'Gagal menghapus siswa');
  }
}
