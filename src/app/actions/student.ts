// src/app/actions/student.ts
'use server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// 1. READ: Ambil daftar siswa hanya dari sekolah user yang login
export async function getStudents() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  return await db.student.findMany({
    where: {
      schoolId: user.schoolId, // WAJIB: Memagari data spesifik sekolah ini
    },
    orderBy: { name: 'asc' },
  });
}

// 2. CREATE: Tambah siswa baru dan ikat otomatis ke schoolId user
export async function createStudent(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  if (user.role !== 'ADMIN') {
    throw new Error('Akses ditolak: Hanya Admin yang dapat menambah siswa');
  }

  const name = formData.get('name') as string;
  const nisn = formData.get('nisn') as string;

  const newStudent = await db.student.create({
    data: {
      name,
      nisn,
      schoolId: user.schoolId, // WAJIB: Otomatis mengikat ke tenant sekolah
    },
  });

  revalidatePath('/admin/students');
  return { success: true, data: newStudent };
}

// 3. DELETE: Hapus siswa dengan memverifikasi kepemilikan schoolId
export async function deleteStudent(studentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  if (user.role !== 'ADMIN') {
    throw new Error('Akses ditolak');
  }

  // Menggunakan deleteMany agar bisa memverifikasi ID + schoolId sekaligus
  // Mencegah hacker menebak studentId sekolah lain
  const deleted = await db.student.deleteMany({
    where: {
      id: studentId,
      schoolId: user.schoolId, // Pager keamanan tenant
    },
  });

  if (deleted.count === 0) {
    throw new Error('Data siswa tidak ditemukan atau tidak memiliki akses');
  }

  revalidatePath('/admin/students');
  return { success: true };
}