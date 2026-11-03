import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { addDays, nowInSchoolTz } from '@/lib/school-time';

export const ALPA_ATTENTION_MIN = 3; // murid dengan Alpa sebanyak ini (30 hari terakhir) ditandai perlu perhatian

// GET: ringkasan kehadiran sekolah untuk kepala sekolah (semua angka dihitung dari database).
export async function GET() {
  const { user, error } = await guard(['PRINCIPAL', 'ADMIN']);
  if (error) return error;

  try {
    const today = nowInSchoolTz();
    const from7 = addDays(today.date, -6);
    const from30 = addDays(today.date, -29);

    const [classes, studentsAll, todayAtt, trendRows, alpaRows, pendingLeaves] = await Promise.all([
      db.classRoom.findMany({ where: { schoolId: user.schoolId }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      db.student.findMany({ where: { schoolId: user.schoolId }, select: { id: true, name: true, classRoomId: true, status: true }, take: 5000 }),
      db.attendance.findMany({ where: { schoolId: user.schoolId, date: today.date }, select: { studentId: true, status: true } }),
      db.attendance.groupBy({ by: ['date', 'status'], where: { schoolId: user.schoolId, date: { gte: from7 } }, _count: { _all: true } }),
      db.attendance.groupBy({ by: ['studentId'], where: { schoolId: user.schoolId, status: 'ALPA', date: { gte: from30 } }, _count: { _all: true } }),
      db.leaveRequest.count({ where: { schoolId: user.schoolId, status: 'PENDING' } }),
    ]);

    const students = studentsAll.filter((s) => (s.status || 'Aktif').toLowerCase().startsWith('aktif'));
    const total = students.length;
    const activeIds = new Set(students.map((s) => s.id));
    const classOf = new Map(students.map((s) => [s.id, s.classRoomId]));
    const className = new Map(classes.map((c) => [c.id, c.name]));

    // Hitungan hari ini (hanya murid aktif)
    const counts = { HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, ALPA: 0 };
    const presentByClass = new Map<string, number>();
    for (const a of todayAtt) {
      if (!activeIds.has(a.studentId)) continue;
      counts[a.status]++;
      if (a.status === 'HADIR' || a.status === 'TERLAMBAT') {
        const cid = classOf.get(a.studentId) ?? '';
        presentByClass.set(cid, (presentByClass.get(cid) ?? 0) + 1);
      }
    }
    const recorded = counts.HADIR + counts.TERLAMBAT + counts.IZIN + counts.SAKIT + counts.ALPA;

    const byClass = classes.map((c) => {
      const inClass = students.filter((s) => s.classRoomId === c.id);
      const recordedInClass = todayAtt.filter((a) => classOf.get(a.studentId) === c.id).length;
      return { id: c.id, name: c.name, total: inClass.length, present: presentByClass.get(c.id) ?? 0, recorded: recordedInClass };
    });

    // Tren 7 hari: persentase hadir (hadir + terlambat) dari total murid; null = tidak ada data hari itu
    const trend = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(from7, i);
      const rows = trendRows.filter((r) => r.date === date);
      const rec = rows.reduce((a, r) => a + r._count._all, 0);
      const present = rows.filter((r) => r.status === 'HADIR' || r.status === 'TERLAMBAT').reduce((a, r) => a + r._count._all, 0);
      return { date, recorded: rec, percent: rec === 0 || total === 0 ? null : Math.min(100, Math.round((present / total) * 100)) };
    });

    const nameOf = new Map(students.map((s) => [s.id, s]));
    const attention = alpaRows
      .filter((r) => r._count._all >= ALPA_ATTENTION_MIN && nameOf.has(r.studentId))
      .map((r) => {
        const st = nameOf.get(r.studentId)!;
        return { studentId: r.studentId, name: st.name, className: st.classRoomId ? className.get(st.classRoomId) ?? null : null, alpaCount: r._count._all };
      })
      .sort((a, b) => b.alpaCount - a.alpaCount)
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        today,
        totals: { students: total, classes: classes.length },
        todayCounts: { ...counts, belum: Math.max(0, total - recorded), recorded },
        byClass,
        trend,
        attention,
        alpaThreshold: ALPA_ATTENTION_MIN,
        pendingLeaves,
      },
    });
  } catch (e) {
    return serverError(e, 'Gagal memuat ringkasan');
  }
}
