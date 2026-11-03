import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { hasStudentQrFeature, hasStudentRole } from '@/lib/variant';

// GET: data & rekap kehadiran murid yang sedang login (hanya miliknya sendiri)
export async function GET() {
  const { user, error } = await guard(['STUDENT']);
  if (error) return error;

  try {
    if (!hasStudentRole(user.appVariant)) {
      return NextResponse.json({ success: false, message: 'Fitur murid tidak aktif untuk sekolah ini' }, { status: 403 });
    }

    const student = await db.student.findFirst({
      where: { userId: user.userId, schoolId: user.schoolId },
      select: { id: true, name: true, nisn: true, classRoom: { select: { name: true } } },
    });
    if (!student) {
      return NextResponse.json({ success: false, message: 'Data murid belum terhubung ke akun ini' }, { status: 404 });
    }

    const [attendance, leaves] = await Promise.all([
      db.attendance.findMany({
        where: { studentId: student.id, schoolId: user.schoolId },
        orderBy: { date: 'desc' },
        take: 400,
        select: { id: true, date: true, status: true, note: true },
      }),
      db.leaveRequest.findMany({
        where: { studentId: student.id, schoolId: user.schoolId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, type: true, startDate: true, endDate: true, reason: true, status: true, requestedBy: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        student: { name: student.name, nisn: student.nisn, className: student.classRoom?.name ?? null },
        qrEnabled: hasStudentQrFeature(user.appVariant),
        attendance,
        leaves,
      },
    });
  } catch (e) {
    return serverError(e, 'Gagal mengambil data murid');
  }
}
