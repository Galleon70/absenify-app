import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const { id } = await params;
    const { name, grade, waliKelas } = await req.json();

    const result = await db.classRoom.updateMany({
      where: { id, schoolId: user.schoolId },
      data: {
        name: name?.trim() || undefined,
        grade: grade === undefined ? undefined : grade || null,
        waliKelas: waliKelas === undefined ? undefined : waliKelas?.trim() || null,
      },
    });
    if (result.count === 0) {
      return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Kelas berhasil diperbarui' });
  } catch (e) {
    return serverError(e, 'Gagal mengupdate kelas');
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const { id } = await params;
    const result = await db.classRoom.deleteMany({ where: { id, schoolId: user.schoolId } });
    if (result.count === 0) {
      return NextResponse.json({ success: false, message: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (e) {
    return serverError(e, 'Gagal menghapus kelas');
  }
}
