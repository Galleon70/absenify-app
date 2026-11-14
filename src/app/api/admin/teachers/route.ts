// src/app/api/admin/teachers/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';

// GET: Ambil daftar guru beserta NIP (dari field username) dan status Wali Kelas
export async function GET() {
  const { user, error } = await guard(['ADMIN', 'OWNER']);
  if (error) return error;

  try {
    // 1. Ambil semua user dengan role TEACHER di sekolah yang sama
    const teachers = await db.user.findMany({
      where: { schoolId: user.schoolId, role: 'TEACHER' },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true, // username diisi NIP/NUPTK untuk guru
      },
    });

    // 2. Ambil data kelas untuk mengecek guru mana yang menjadi wali kelas
    const classes = await db.classRoom.findMany({
      where: { schoolId: user.schoolId },
      select: { id: true, name: true, waliKelas: true, waliKelasUserId: true },
    });

    // 3. Petakan NIP dan nama kelas yang diampu
    const data = teachers.map((t) => {
      const managed = classes.find(
        (c) =>
          c.waliKelasUserId === t.id ||
          (c.waliKelas && c.waliKelas.trim().toLowerCase() === t.name.trim().toLowerCase())
      );

      return {
        id: t.id,
        name: t.name,
        email: t.email || '',
        nip: t.username || null, // Mapping username ke field NIP di frontend
        nuptk: null,
        waliKelasName: managed ? managed.name : null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return serverError(e, 'Gagal mengambil data guru');
  }
}

// POST: Tambah Guru Baru atau Edit NIP / Email Guru
export async function POST(req: Request) {
  const { user, error } = await guard(['ADMIN', 'OWNER']);
  if (error) return error;

  try {
    const body = await req.json();
    const { id, name, email, nip, nuptk } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Nama dan Email wajib diisi' },
        { status: 400 }
      );
    }

    // Nilai NIP/NUPTK disimpan ke field username
    const formattedNip = nip || nuptk || null;

    if (id) {
      // Update data guru yang sudah ada
      await db.user.update({
        where: { id },
        data: {
          name,
          email,
          username: formattedNip,
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Data guru berhasil diperbarui',
      });
    } else {
      // Tambah guru baru
      await db.user.create({
        data: {
          schoolId: user.schoolId,
          role: 'TEACHER',
          name,
          email,
          username: formattedNip,
          password: '$2a$10$YourHashedPasswordHere', // Password default sistem kamu
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Guru baru berhasil ditambahkan',
      });
    }
  } catch (e) {
    return serverError(e, 'Gagal menyimpan data guru');
  }
}