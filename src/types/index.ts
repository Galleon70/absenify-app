export type Role = 'PARENT' | 'TEACHER' | 'ADMIN' | 'PRINCIPAL';

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  subject: string;
  phone: string;
  email: string;
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  classId: string;
  gender: 'L' | 'P';
  parentPhone: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  totalStudents: number;
  capacity?: number; // Opsional agar kompatibel
}

export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA' | 'TERLAMBAT';

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: 'SAKIT' | 'IZIN';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  createdAt?: string; // Opsional agar kompatibel
  read: boolean;
  type: 'LEAVE' | 'ATTENDANCE' | 'SYSTEM';
  targetRoles: Role[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}