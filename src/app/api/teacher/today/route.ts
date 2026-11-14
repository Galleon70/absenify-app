// src/app/api/teacher/today/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { nowInSchoolTz } from '@/lib/school-time';

// GET: semua data yang dibutuhkan dashboard guru untuk HARI INI (menurut zona waktu sekolah):
// kelas, murid aktif, absensi yang sudah tercatat (termasuk hasil scan QR), dan izin yang disetujui.
export async function GET() {
  const { user, error } = await guard(['TEACHER', 'ADMIN']);
  if (error) return error;

  try {
    const today = nowInSchoolTz();

    const [classes, students, attendance, leaves] = await Promise.all([
      db.classRoom.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, waliKelas: true },
      }),
      db.student.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { name: 'asc' },
        take: 3000,
        select: { id: true, name: true, nisn: true, classRoomId: true, status: true },
      }),
      db.attendance.findMany({
        where: { schoolId: user.schoolId, date: today.date },
        select: { studentId: true, status: true, note: true },
      }),
      db.leaveRequest.findMany({
        where: { schoolId: user.schoolId, status: 'APPROVED', startDate: { lte: today.date }, endDate: { gte: today.date } },
        select: {
          id: true, studentId: true, type: true, startDate: true, endDate: true, reason: true,
          student: { select: { name: true, classRoom: { select: { name: true } } } },
        },
      }),
    ]);

    // Cari nama kelas jika guru ini terdaftar sebagai wali kelas
    const managedClass = classes.find(
      (c) => c.waliKelas && c.waliKelas.trim().toLowerCase() === user.name.trim().toLowerCase()
    );

    return NextResponse.json({
      success: true,
      data: {
        today,
        me: {
          name: user.name,
          email: user.email || null,
          nip: (user as any).nip || null,
          waliKelasName: managedClass?.name || null,
        },
        classes,
        students: students
          .filter((s) => (s.status || 'Aktif').toLowerCase().startsWith('aktif'))
          .map((s) => ({ id: s.id, name: s.name, nisn: s.nisn, classId: s.classRoomId })),
        attendance,
        leaves: leaves.map((l) => ({
          id: l.id, studentId: l.studentId, studentName: l.student.name, className: l.student.classRoom?.name ?? null,
          type: l.type, startDate: l.startDate, endDate: l.endDate, reason: l.reason,
        })),
      },
    });
  } catch (e) {
    return serverError(e, 'Gagal memuat data guru');
  }
}