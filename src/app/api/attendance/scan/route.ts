import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { hasStudentQrFeature } from '@/lib/variant';
import { verifyQrToken } from '@/lib/qr-token';
import { nowInSchoolTz } from '@/lib/school-time';

const bad = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

// POST: petugas (guru/admin) memindai QR murid -> absensi hari ini tercatat.
// Body: { token }
export async function POST(req: Request) {
  const { user, error } = await guard(['TEACHER', 'ADMIN']);
  if (error) return error;

  try {
    if (!hasStudentQrFeature(user.appVariant)) return bad('Fitur scan QR tidak aktif untuk sekolah ini', 403);

    const { token } = await req.json();
    const check = verifyQrToken(token);
    if (!check.ok) {
      return bad(
        check.reason === 'EXPIRED'
          ? 'QR sudah kedaluwarsa. Minta murid membuka ulang layar QR-nya.'
          : 'QR tidak valid.'
      );
    }

    // Murid harus di sekolah yang sama dengan petugas
    const student = await db.student.findFirst({
      where: { id: check.studentId, schoolId: user.schoolId },
      select: { id: true, name: true, classRoom: { select: { name: true } } },
    });
    if (!student) return bad('Murid tidak ditemukan di sekolah ini.', 404);

    const school = await db.school.findUnique({ where: { id: user.schoolId }, select: { lateAfter: true } });
    const { date, time } = nowInSchoolTz();
    const status = time > (school?.lateAfter || '07:15') ? 'TERLAMBAT' : 'HADIR';

    const existing = await db.attendance.findUnique({
      where: { date_studentId: { date, studentId: student.id } },
    });

    const base = { studentName: student.name, className: student.classRoom?.name ?? null, time };

    // Sudah tercatat hadir/terlambat hari ini: jangan timpa (jam masuk pertama yang dipakai)
    if (existing && (existing.status === 'HADIR' || existing.status === 'TERLAMBAT')) {
      return NextResponse.json({ success: true, data: { ...base, status: existing.status, outcome: 'ALREADY' } });
    }
    // Sudah tercatat izin/sakit: jangan diubah otomatis, beri tahu petugas
    if (existing && (existing.status === 'IZIN' || existing.status === 'SAKIT')) {
      return NextResponse.json({ success: true, data: { ...base, status: existing.status, outcome: 'LEAVE' } });
    }

    // Belum ada catatan, atau tadinya ditandai ALPA lalu murid ternyata datang
    try {
      await db.attendance.upsert({
        where: { date_studentId: { date, studentId: student.id } },
        update: { status, note: 'Scan QR' },
        create: { date, studentId: student.id, status, note: 'Scan QR', schoolId: user.schoolId },
      });
    } catch (e) {
      // Dua perangkat memindai murid yang sama di detik yang sama: yang kedua kalah balapan.
      // Itu bukan kesalahan -- murid sudah tercatat oleh perangkat lain.
      if ((e as { code?: string }).code === 'P2002') {
        const again = await db.attendance.findUnique({
          where: { date_studentId: { date, studentId: student.id } },
        });
        return NextResponse.json({
          success: true,
          data: { ...base, status: again?.status ?? status, outcome: 'ALREADY' },
        });
      }
      throw e;
    }

    return NextResponse.json({
      success: true,
      data: { ...base, status, outcome: existing ? 'UPDATED' : 'RECORDED' },
    });
  } catch (e) {
    return serverError(e, 'Gagal memproses scan');
  }
}
