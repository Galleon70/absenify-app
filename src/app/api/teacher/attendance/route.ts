import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user: any = await getCurrentUser();
    const userId = user?.id || user?.userId || user?.sub;

    if (!user || !userId || user.role !== 'TEACHER') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);

    const todayAttendance = await prisma.teacherAttendance.findFirst({
      where: {
        userId: userId,
        date: todayStr,
      },
    });

    const monthlyAttendances = await prisma.teacherAttendance.findMany({
      where: {
        userId: userId,
        date: { startsWith: monthStr },
      },
    });

    const summary = {
      hadir: monthlyAttendances.filter((a) => a.status === 'HADIR').length,
      terlambat: monthlyAttendances.filter((a) => a.status === 'TERLAMBAT').length,
      izin: monthlyAttendances.filter((a) => a.status === 'IZIN').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        today: todayAttendance || null,
        summary,
      },
    });
  } catch (error) {
    console.error('Fetch Teacher Attendance Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengambil data absensi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user: any = await getCurrentUser();
    const userId = user?.id || user?.userId || user?.sub;

    if (!user || !userId || user.role !== 'TEACHER') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const type: 'CHECK_IN' | 'CHECK_OUT' = body.type;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5); // HH:mm

    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { lateAfter: true },
    });
    const lateThreshold = school?.lateAfter || '07:15';

    const existingAttendance = await prisma.teacherAttendance.findFirst({
      where: {
        userId: userId,
        date: todayStr,
      },
    });

    if (type === 'CHECK_IN') {
      if (existingAttendance) {
        return NextResponse.json(
          { success: false, message: 'Anda sudah melakukan Absen Masuk hari ini!' },
          { status: 400 }
        );
      }

      const status = timeStr > lateThreshold ? 'TERLAMBAT' : 'HADIR';

      const newRecord = await prisma.teacherAttendance.create({
        data: {
          userId: userId,
          schoolId: user.schoolId,
          date: todayStr,
          checkIn: timeStr,
          status,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Absen Masuk Berhasil (${status === 'TERLAMBAT' ? 'Terlambat' : 'Tepat Waktu'})`,
        data: newRecord,
      });
    } else if (type === 'CHECK_OUT') {
      if (!existingAttendance) {
        return NextResponse.json(
          { success: false, message: 'Anda belum Absen Masuk hari ini!' },
          { status: 400 }
        );
      }

      if (existingAttendance.checkOut) {
        return NextResponse.json(
          { success: false, message: 'Anda sudah melakukan Absen Pulang hari ini!' },
          { status: 400 }
        );
      }

      const updatedRecord = await prisma.teacherAttendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkOut: timeStr,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Absen Pulang Berhasil!',
        data: updatedRecord,
      });
    }

    return NextResponse.json({ success: false, message: 'Tipe absensi tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('Submit Teacher Attendance Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal memproses absensi' }, { status: 500 });
  }
}