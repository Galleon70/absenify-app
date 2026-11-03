import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { hasStudentRole } from '@/lib/variant';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3 MB

// Deteksi tipe file dari isi file (bukan dari nama/ekstensi yang dikirim browser)
function sniffMime(b: Uint8Array): string | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length > 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  if (
    b.length > 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return 'image/webp';
  return null;
}

const bad = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

// POST: orang tua mengajukan izin untuk anaknya (multipart/form-data, bukti opsional)
export async function POST(req: Request) {
  const { user, error } = await guard(['PARENT', 'ADMIN', 'STUDENT']);
  if (error) return error;

  try {
    let studentId = '', type = '', startDate = '', endDate = '', reason = '';
    let file: File | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData();
      studentId = String(fd.get('studentId') ?? '');
      type = String(fd.get('type') ?? '');
      startDate = String(fd.get('startDate') ?? '');
      endDate = String(fd.get('endDate') ?? '');
      reason = String(fd.get('reason') ?? '');
      const f = fd.get('attachment');
      if (f instanceof File && f.size > 0) file = f;
    } else {
      const body = await req.json();
      ({ studentId = '', type = '', startDate = '', endDate = '', reason = '' } = body);
    }

    // Murid (Mode 2/3) hanya boleh mengajukan untuk dirinya sendiri; studentId dari input diabaikan
    if (user.role === 'STUDENT') {
      if (!hasStudentRole(user.appVariant)) return bad('Fitur murid tidak aktif untuk sekolah ini', 403);
      const me = await db.student.findFirst({ where: { userId: user.userId, schoolId: user.schoolId }, select: { id: true } });
      if (!me) return bad('Data murid belum terhubung ke akun ini', 404);
      studentId = me.id;
    }

    if (!studentId || !reason.trim() || !DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return bad('Data tidak lengkap');
    }
    if (type !== 'SAKIT' && type !== 'IZIN') return bad('Jenis izin tidak valid');
    if (startDate > endDate) return bad('Tanggal selesai tidak boleh sebelum tanggal mulai');

    // Validasi bukti
    let attachment: { name: string; mime: string; data: Uint8Array<ArrayBuffer> } | null = null;
    if (file) {
      if (file.size > MAX_FILE_BYTES) return bad('Ukuran bukti maksimal 3 MB');
      const data = new Uint8Array(await file.arrayBuffer());
      const mime = sniffMime(data);
      if (!mime) return bad('Bukti harus berupa foto (JPG/PNG/WEBP) atau PDF');
      const safeName = (file.name || 'bukti').split(/[\\/]/).pop()!.replace(/[^\w.\- ]/g, '_').slice(0, 100);
      attachment = { name: safeName, mime, data };
    }

    // Siswa harus di sekolah ini; orang tua hanya boleh untuk anaknya sendiri
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        schoolId: user.schoolId,
        ...(user.role === 'PARENT' ? { parentId: user.userId } : {}),
      },
    });
    if (!student) return bad('Siswa tidak ditemukan', 404);

    const overlap = await db.leaveRequest.findFirst({
      where: {
        studentId,
        status: { not: 'REJECTED' },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlap) return bad('Pengajuan bentrok dengan tanggal izin yang sudah ada!');

    const leave = await db.leaveRequest.create({
      data: {
        studentId,
        type,
        startDate,
        endDate,
        reason: reason.trim(),
        schoolId: user.schoolId,
        requestedBy: user.role === 'STUDENT' ? 'STUDENT' : user.role === 'ADMIN' ? 'ADMIN' : 'PARENT',
        attachmentName: attachment?.name ?? null,
        attachmentMime: attachment?.mime ?? null,
        attachmentData: attachment?.data ?? null,
      },
      select: { id: true, type: true, startDate: true, endDate: true, status: true },
    });
    return NextResponse.json({ success: true, data: leave }, { status: 201 });
  } catch (e) {
    return serverError(e, 'Gagal mengajukan izin');
  }
}

// GET: daftar izin. Orang tua hanya melihat milik anaknya. File bukti TIDAK ikut dikirim di sini.
export async function GET(req: Request) {
  const { user, error } = await guard(['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT']);
  if (error) return error;

  try {
    const status = new URL(req.url).searchParams.get('status');
    const rows = await db.leaveRequest.findMany({
      where: {
        schoolId: user.schoolId,
        ...(status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}),
        ...(user.role === 'PARENT' ? { student: { parentId: user.userId } } : {}),
        ...(user.role === 'STUDENT' ? { student: { userId: user.userId } } : {}),
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        reason: true,
        status: true,
        requestedBy: true,
        createdAt: true,
        attachmentName: true,
        studentId: true,
        student: { select: { id: true, name: true, classRoom: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const data = rows.map(({ attachmentName, ...r }) => ({
      ...r,
      hasAttachment: !!attachmentName,
      attachmentName,
    }));
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return serverError(e, 'Gagal mengambil data izin');
  }
}
