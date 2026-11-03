import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';

export async function GET() {
  const { user, error } = await guard(['ADMIN', 'TEACHER', 'PRINCIPAL']);
  if (error) return error;

  try {
    const classes = await db.classRoom.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { students: true } } },
    });
    const data = classes.map(({ _count, ...c }) => ({ ...c, totalStudents: _count.students }));
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return serverError(e, 'Gagal mengambil data kelas');
  }
}

export async function POST(req: Request) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const { name, grade, waliKelas } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ success: false, message: 'Nama kelas wajib diisi' }, { status: 400 });
    }
    const newClass = await db.classRoom.create({
      data: {
        name: name.trim(),
        grade: grade || null,
        waliKelas: waliKelas?.trim() || null,
        schoolId: user.schoolId,
      },
    });
    return NextResponse.json({ success: true, data: newClass }, { status: 201 });
  } catch (e) {
    return serverError(e, 'Gagal membuat kelas');
  }
}
