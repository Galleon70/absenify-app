import { Teacher, ClassRoom, Student, LeaveRequest, NotificationItem, AuditLog } from '../types';

export const initialTeachers: Teacher[] = [
  { id: 't1', nip: '198501152010011001', name: 'Budi Santoso, S.Pd', subject: 'Matematika', phone: '081122334455', email: 'budi@school.sch.id' },
  { id: 't2', nip: '198803222012022003', name: 'Siti Aminah, M.Pd', subject: 'Bahasa Indonesia', phone: '081122334456', email: 'siti@school.sch.id' },
  { id: 't3', nip: '199007102015031002', name: 'Dedi Kurniawan, S.T', subject: 'Fisika', phone: '081122334457', email: 'dedi@school.sch.id' },
];

export const initialClasses: ClassRoom[] = [
  { id: 'c1', name: 'X IPA 1', homeroomTeacherId: 't1', homeroomTeacherName: 'Budi Santoso, S.Pd', totalStudents: 32 },
  { id: 'c2', name: 'X IPA 2', homeroomTeacherId: 't2', homeroomTeacherName: 'Siti Aminah, M.Pd', totalStudents: 30 },
  { id: 'c3', name: 'XI IPS 1', homeroomTeacherId: 't3', homeroomTeacherName: 'Dedi Kurniawan, S.T', totalStudents: 28 },
];

export const initialStudents: Student[] = [
  { id: 's1', nisn: '0051234567', name: 'Ahmad Rizky', classId: 'c1', gender: 'L', parentPhone: '081234567890' },
  { id: 's2', nisn: '0051234568', name: 'Anisa Rahma', classId: 'c1', gender: 'P', parentPhone: '081234567891' },
  { id: 's3', nisn: '0051234569', name: 'Bagas Pratama', classId: 'c1', gender: 'L', parentPhone: '081234567892' },
  { id: 's4', nisn: '0051234570', name: 'Dewi Lestari', classId: 'c2', gender: 'P', parentPhone: '081234567893' },
];

export const initialLeaves: LeaveRequest[] = [
  {
    id: 'l1',
    studentId: 's1',
    studentName: 'Ahmad Rizky',
    className: 'X IPA 1',
    type: 'SAKIT',
    startDate: '2026-09-25',
    endDate: '2026-09-26',
    reason: 'Demam tinggi dan flu',
    status: 'PENDING',
  },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Pengajuan Izin Masuk',
    message: 'Ahmad Rizky (X IPA 1) mengajukan izin sakit.',
    timestamp: '10 Menit lalu',
    read: false,
    type: 'LEAVE',
    targetRoles: ['TEACHER', 'ADMIN'], // Hanya Guru & Admin
  },
  {
    id: 'n2',
    title: 'Pengajuan Izin Disetujui',
    message: 'Izin sakit Ahmad Rizky tanggal 25 Sep telah disetujui.',
    timestamp: '1 Jam lalu',
    read: false,
    type: 'LEAVE',
    targetRoles: ['PARENT'], // Hanya Orang Tua
  },
  {
    id: 'n3',
    title: 'Laporan Presensi Bulanan',
    message: 'Rekap kehadiran bulan September telah siap ditinjau.',
    timestamp: '3 Jam lalu',
    read: false,
    type: 'SYSTEM',
    targetRoles: ['PRINCIPAL', 'ADMIN'], // Hanya Kepsek & Admin
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'a1',
    timestamp: '2026-09-26 07:30:12',
    user: 'Budi Santoso (Teacher)',
    action: 'UPDATE_ATTENDANCE',
    details: 'Mengisi presensi kelas X IPA 1',
  },
];