import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { nowInSchoolTz } from '@/lib/school-time';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ['HADIR', 'IZIN', 'SAKIT', 'ALPA', 'TERLAMBAT'] as const;
type Status = (typeof STATUSES)[number];

// POST: guru/admin simpan absensi (records: [{ studentId, status, note }])
export async function POST(req: Request) {
  const { user, error } = await guard(['TEACHER', 'ADMIN']);
  if (error) return error;

  try {
    const { date, records } = await req.json();

    if (!DATE_RE.test(date ?? '') || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, message: 'Data absensi tidak valid' }, { status: 400 });
    }
    // Guru hanya boleh mengubah absensi hari ini (koreksi hari lain lewat admin)
    if (user.role === 'TEACHER' && date !== nowInSchoolTz().date) {
      return NextResponse.json({ success: false, message: 'Guru hanya bisa menyimpan absensi hari ini' }, { status: 403 });
    }
    for (const r of records) {
      if (!r.studentId || !STATUSES.includes(r.status)) {
        return NextResponse.json({ success: false, message: 'Status absensi tidak valid' }, { status: 400 });
      }
    }

    // Pastikan semua siswa memang milik sekolah user ini
    const ids = [...new Set<string>(records.map((r: { studentId: string }) => r.studentId))];
    const owned = await db.student.findMany({
      where: { id: { in: ids }, schoolId: user.schoolId },
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      return NextResponse.json({ success: false, message: 'Ada siswa yang tidak valid' }, { status: 400 });
    }

    await db.$transaction(
      records.map((r: { studentId: string; status: Status; note?: string }) =>
        db.attendance.upsert({
          where: { date_studentId: { date, studentId: r.studentId } },
          update: { status: r.status, note: r.note ?? null },
          create: {
            date,
            studentId: r.studentId,
            status: r.status,
            note: r.note ?? null,
            schoolId: user.schoolId,
          },
        })
      )
    );
    return NextResponse.json({ success: true, message: 'Absensi berhasil disimpan!' });
  } catch (e) {
    return serverError(e, 'Gagal menyimpan absensi');
  }
}

// GET: ?date=YYYY-MM-DD atau ?from=&to=, opsional &classRoomId=
// Orang tua hanya melihat anaknya sendiri.
export async function GET(req: Request) {
  const { user, error } = await guard(['ADMIN', 'TEACHER', 'PRINCIPAL', 'PARENT']);
  if (error) return error;

  try {
    const sp = new URL(req.url).searchParams;
    const date = sp.get('date');
    const from = sp.get('from');
    const to = sp.get('to');
    const classRoomId = sp.get('classRoomId');

    const records = await db.attendance.findMany({
      where: {
        schoolId: user.schoolId,
        ...(date ? { date } : {}),
        ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
        student: {
          ...(classRoomId ? { classRoomId } : {}),
          ...(user.role === 'PARENT' ? { parentId: user.userId } : {}),
        },
      },
      include: { student: { select: { id: true, name: true, classRoomId: true } } },
      orderBy: { date: 'desc' },
      take: 1000,
    });
    return NextResponse.json({ success: true, data: records });
  } catch (e) {
    return serverError(e, 'Gagal mengambil data absensi');
  }
}
