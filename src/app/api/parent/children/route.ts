// src/app/api/parent/children/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';

// GET: daftar anak milik orang tua yang sedang login
export async function GET() {
  const { user, error } = await guard(['PARENT']);
  if (error) return error;

  try {
    const students = await db.student.findMany({
      where: { parentId: user.userId, schoolId: user.schoolId },
      select: { id: true, name: true, nisn: true, classRoom: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    const data = students.map((s) => ({
      id: s.id,
      name: s.name,
      nisn: s.nisn,
      className: s.classRoom?.name ?? null,
    }));
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return serverError(e, 'Gagal mengambil data anak');
  }
}