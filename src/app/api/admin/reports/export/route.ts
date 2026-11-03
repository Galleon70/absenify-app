import { NextResponse } from 'next/server';
import XLSX from 'xlsx-js-style';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !['ADMIN', 'PRINCIPAL', 'OWNER'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const classRoomId = searchParams.get('classRoomId');

    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { name: true }
    });

    const whereCondition: any = { schoolId: user.schoolId };
    if (classRoomId) whereCondition.classRoomId = classRoomId;

    const students = await prisma.student.findMany({
      where: whereCondition,
      include: {
        classRoom: true,
        attendances: {
          where: { date: { startsWith: month } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const dateObj = new Date(`${month}-01`);
    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    // Definisi Style Border & Alignment
    const thinBorder = {
      top: { style: 'thin', color: { rgb: 'D0D5DD' } },
      bottom: { style: 'thin', color: { rgb: 'D0D5DD' } },
      left: { style: 'thin', color: { rgb: 'D0D5DD' } },
      right: { style: 'thin', color: { rgb: 'D0D5DD' } },
    };

    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Calibri', sz: 11 },
      fill: { fgColor: { rgb: '1E293B' } }, // Dark Slate (sesuai tema HadirKu)
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    };

    const cellCenter = {
      font: { name: 'Calibri', sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder,
    };

    const cellLeft = {
      font: { name: 'Calibri', sz: 11 },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: thinBorder,
    };

    // Susun Sheet Data Manual
    const ws: XLSX.WorkSheet = {};

    // 1. Title Kop Laporan
    ws['A1'] = { v: `REKAPITULASI KEHADIRAN SISWA - ${school?.name?.toUpperCase() || 'HADIRKU'}`, t: 's', s: { font: { bold: true, sz: 14 } } };
    ws['A2'] = { v: `PERIODE: ${monthName.toUpperCase()}`, t: 's', s: { font: { bold: true, sz: 11, color: { rgb: '475569' } } } };

    // 2. Header Tabel (Baris ke-4)
    const headers = ['NO', 'NAMA SISWA', 'NIS', 'NISN', 'KELAS', 'HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA', 'TOTAL KEHADIRAN'];
    headers.forEach((h, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 3, c: colIdx });
      ws[cellRef] = { v: h, t: 's', s: headerStyle };
    });

    // 3. Isi Data Siswa (Mulai Baris ke-5)
    students.forEach((s, rowIdx) => {
      const r = 4 + rowIdx;
      const hadir = s.attendances.filter((a) => a.status === 'HADIR').length;
      const terlambat = s.attendances.filter((a) => a.status === 'TERLAMBAT').length;
      const izin = s.attendances.filter((a) => a.status === 'IZIN').length;
      const sakit = s.attendances.filter((a) => a.status === 'SAKIT').length;
      const alpa = s.attendances.filter((a) => a.status === 'ALPA').length;

      const rowValues = [
        { v: rowIdx + 1, t: 'n', s: cellCenter },
        { v: s.name ? s.name.toUpperCase() : '-', t: 's', s: cellLeft },
        { v: s.nis || '-', t: 's', s: cellCenter },
        { v: s.nisn || '-', t: 's', s: cellCenter },
        { v: s.classRoom?.name || '-', t: 's', s: cellCenter },
        { v: hadir, t: 'n', s: cellCenter },
        { v: terlambat, t: 'n', s: cellCenter },
        { v: izin, t: 'n', s: cellCenter },
        { v: sakit, t: 'n', s: cellCenter },
        { v: alpa, t: 'n', s: cellCenter },
        { v: hadir + terlambat, t: 'n', s: { ...cellCenter, font: { bold: true } } },
      ];

      rowValues.forEach((val, c) => {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        ws[cellRef] = val;
      });
    });

    // Menentukan Range Sheet
    const totalRows = 4 + students.length;
    ws['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: totalRows > 4 ? totalRows - 1 : 4, c: 10 },
    });

    // Setting Lebar Kolom
    ws['!cols'] = [
      { wch: 6 },  // NO
      { wch: 30 }, // NAMA SISWA
      { wch: 14 }, // NIS
      { wch: 18 }, // NISN
      { wch: 12 }, // KELAS
      { wch: 10 }, // HADIR
      { wch: 12 }, // TERLAMBAT
      { wch: 10 }, // IZIN
      { wch: 10 }, // SAKIT
      { wch: 10 }, // ALPA
      { wch: 18 }, // TOTAL KEHADIRAN
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const fileName = `Rekap_Absensi_${month}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengekspor data' }, { status: 500 });
  }
}