import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { allowedRoles } from '@/lib/variant';
import { generateTempPassword } from '@/lib/password';

// GET: daftar user HANYA di sekolah milik admin yang login
export async function GET() {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const rows = await db.user.findMany({
      where: { schoolId: user.schoolId },
      select: { id: true, name: true, email: true, username: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const users = rows.map(({ isActive, ...u }) => ({ ...u, status: isActive ? 'Aktif' : 'Non-Aktif' }));
    return NextResponse.json({ success: true, data: users });
  } catch (e) {
    return serverError(e, 'Gagal mengambil data user');
  }
}

// POST: tambah user baru (Guru, Orang Tua, Kepala Sekolah, Admin)
export async function POST(req: Request) {
  const { user, error } = await guard(['ADMIN']);
  if (error) return error;

  try {
    const { name, email, password, role, status } = await req.json();

    if (!name?.trim() || !email?.trim() || !role) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }
    if (!allowedRoles(user.appVariant).includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Role tidak tersedia untuk mode sekolah ini' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Email unik di seluruh platform (login mencari akun lewat email)
    const existing = await db.user.findFirst({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            existing.schoolId === user.schoolId
              ? 'Email sudah terdaftar'
              : 'Email sudah dipakai di sekolah lain. Gunakan email yang berbeda.',
        },
        { status: 400 }
      );
    }

    // Tanpa password dari admin -> dibuatkan password sementara acak
    const tempPassword: string = password?.trim() || generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
        mustChangePassword: true,
        isActive: status === undefined || status === 'Aktif',
        schoolId: user.schoolId, // dari token, bukan dari body
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: `User berhasil dibuat.\n\nEmail: ${normalizedEmail}\nPassword sementara: ${tempPassword}\n(Catat dan berikan ke pemilik akun. Wajib diganti saat login pertama.)`,
        data: newUser,
      },
      { status: 201 }
    );
  } catch (e) {
    return serverError(e, 'Gagal membuat user');
  }
}
