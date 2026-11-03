import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { allowedRoles } from '@/lib/variant';
import { clearAccountLock } from '@/lib/login-throttle';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const { id } = await params;
    const { name, email, role, password, status } = await req.json();

    const data: Record<string, string | boolean | { increment: number }> = {};
    if (name?.trim()) data.name = name.trim();
    if (email?.trim()) data.email = email.toLowerCase().trim();
    if (role) {
      if (!allowedRoles(user.appVariant).includes(role)) {
        return NextResponse.json(
          { success: false, message: 'Role tidak tersedia untuk mode sekolah ini' },
          { status: 400 }
        );
      }
      data.role = role;
      if (id !== user.userId) data.tokenVersion = { increment: 1 };
    }
    if (password && password.trim() !== '') {
      data.password = await bcrypt.hash(password, 10);
      // Admin mereset password orang lain -> pemilik akun wajib menggantinya
      if (id !== user.userId) {
        data.mustChangePassword = true;
        data.tokenVersion = { increment: 1 }; // cabut sesi lama milik akun itu
      }
    }

    // Status akun: Aktif / Non-Aktif. Akun yang sedang dipakai tidak boleh menonaktifkan dirinya sendiri.
    if (typeof status === 'string') {
      const active = status === 'Aktif';
      if (!active && id === user.userId) {
        return NextResponse.json(
          { success: false, message: 'Anda tidak bisa menonaktifkan akun yang sedang dipakai' },
          { status: 400 }
        );
      }
      data.isActive = active;
      if (!active) data.tokenVersion = { increment: 1 }; // sesi yang sedang berjalan langsung berhenti
    }

    // Sebelum diubah, catat email/username lama supaya kunci login akun itu bisa dibuka setelah reset
    const before = password && password.trim() !== ''
      ? await db.user.findFirst({ where: { id, schoolId: user.schoolId }, select: { email: true, username: true } })
      : null;

    const result = await db.user.updateMany({
      where: { id, schoolId: user.schoolId },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }
    if (before) await clearAccountLock([before.email, before.username, data.email as string | undefined]);
    return NextResponse.json({ success: true, message: 'User berhasil diperbarui' });
  } catch (e) {
    return serverError(e, 'Gagal mengupdate pengguna');
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const { id } = await params;
    if (id === user.userId) {
      return NextResponse.json(
        { success: false, message: 'Tidak bisa menghapus akun yang sedang dipakai' },
        { status: 400 }
      );
    }
    const result = await db.user.deleteMany({ where: { id, schoolId: user.schoolId } });
    if (result.count === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'User berhasil dihapus' });
  } catch (e) {
    return serverError(e, 'Gagal menghapus pengguna');
  }
}
