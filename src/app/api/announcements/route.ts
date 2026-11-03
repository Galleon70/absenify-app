// src/app/api/announcements/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// 1. GET: Ambil Pengumuman Berdasarkan Role User
export async function GET() {
  try {
    const user: any = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let validTargets = ['ALL'];
    if (user.role === 'TEACHER' || user.role === 'PRINCIPAL') validTargets.push('TEACHER');
    else if (user.role === 'PARENT') validTargets.push('PARENT');
    else if (user.role === 'STUDENT') validTargets.push('STUDENT');
    else if (user.role === 'ADMIN') validTargets = ['ALL', 'TEACHER', 'PARENT', 'STUDENT'];

    const announcements = await prisma.announcement.findMany({
      where: {
        schoolId: user.schoolId,
        target: { in: validTargets },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ success: true, data: announcements });
  } catch (error) {
    console.error('Fetch Announcements Error:', error);
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}

// 2. POST: Admin & Kepsek (Principal) Bisa Terbitkan Pengumuman Baru
export async function POST(request: Request) {
  try {
    const user: any = await getCurrentUser();
    if (!user || !['ADMIN', 'TEACHER', 'PRINCIPAL'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, target } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ success: false, message: 'Judul dan isi pengumuman wajib diisi!' }, { status: 400 });
    }

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        content,
        target: target || 'ALL',
        author: user.name || (user.role === 'PRINCIPAL' ? 'Kepala Sekolah' : 'Admin Sekolah'),
        schoolId: user.schoolId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pengumuman berhasil diterbitkan!',
      data: newAnnouncement,
    });
  } catch (error) {
    console.error('Create Announcement Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal menerbitkan pengumuman' }, { status: 500 });
  }
}

// 3. PUT: Admin & Kepsek Bisa Edit Pengumuman (Auto Update updatedAt)
export async function PUT(request: Request) {
  try {
    const user: any = await getCurrentUser();
    if (!user || !['ADMIN', 'TEACHER', 'PRINCIPAL'].includes(user.role)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, content, target } = await request.json();

    if (!id || !title || !content) {
      return NextResponse.json({ success: false, message: 'ID, Judul, dan Isi pengumuman wajib diisi!' }, { status: 400 });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { 
        id,
        schoolId: user.schoolId // Menjaga tenant isolation agar tidak bisa edit milik sekolah lain
      },
      data: {
        title,
        content,
        target: target || 'ALL',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pengumuman berhasil diperbarui!',
      data: updatedAnnouncement,
    });
  } catch (error) {
    console.error('Update Announcement Error:', error);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui pengumuman' }, { status: 500 });
  }
}