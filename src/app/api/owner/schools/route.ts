import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { AppVariant } from '@prisma/client';
import { db } from '@/lib/db';
import { guard, serverError } from '@/lib/guard';
import { generateTempPassword } from '@/lib/password';
import { AVAILABLE_VARIANTS } from '@/lib/variant';
import { PLATFORM_SCHOOL_ID } from '@/lib/platform';
import { billingInfo } from '@/lib/billing';
import { logAudit } from '@/lib/audit';

// GET: daftar semua sekolah klien beserta status langganan
export async function GET() {
  const { error } = await guard(['OWNER']);
  if (error) return error;

  try {
    const [schools, lastAtt] = await Promise.all([
      db.school.findMany({
        where: { id: { not: PLATFORM_SCHOOL_ID } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          appVariant: true,
          isActive: true,
          createdAt: true,
          contactName: true,
          contactPhone: true,
          pricePerMonth: true,
          paidUntil: true,
          notes: true,
          lateAfter: true,
          _count: { select: { students: true, users: true } },
          users: { where: { role: 'ADMIN' }, select: { email: true, name: true }, take: 1, orderBy: { createdAt: 'asc' } },
        },
      }),
      db.attendance.groupBy({ by: ['schoolId'], _max: { date: true } }),
    ]);
    const lastMap = new Map(lastAtt.map((a) => [a.schoolId, a._max.date]));

    const data = schools.map(({ _count, users, ...s }) => {
      const b = billingInfo(s.paidUntil);
      return {
        ...s,
        totalStudents: _count.students,
        totalUsers: _count.users,
        adminEmail: users[0]?.email ?? null,
        adminName: users[0]?.name ?? null,
        lastActivity: lastMap.get(s.id) ?? null,
        billingStatus: b.status,
        daysLeft: b.daysLeft,
      };
    });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return serverError(e, 'Gagal mengambil daftar sekolah');
  }
}

// POST: tambah sekolah baru + akun admin pertamanya
export async function POST(req: Request) {
  const { user: owner, error } = await guard(['OWNER']);
  if (error) return error;

  try {
    const { name, appVariant, adminName, adminEmail, contactName, contactPhone, pricePerMonth } = await req.json();

    if (!name?.trim() || !adminName?.trim() || !adminEmail?.trim()) {
      return NextResponse.json({ success: false, message: 'Nama sekolah, nama admin, dan email admin wajib diisi' }, { status: 400 });
    }
    const email = String(adminEmail).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Format email admin tidak valid' }, { status: 400 });
    }
    const variant = (appVariant || 'VARIANT_1') as AppVariant;
    if (!AVAILABLE_VARIANTS.includes(variant)) {
      return NextResponse.json({ success: false, message: 'Mode ini belum tersedia' }, { status: 400 });
    }
    let price: number | null = null;
    if (pricePerMonth !== undefined && pricePerMonth !== null && pricePerMonth !== '') {
      price = Number(pricePerMonth);
      if (!Number.isInteger(price) || price < 0) {
        return NextResponse.json({ success: false, message: 'Harga per bulan harus angka bulat' }, { status: 400 });
      }
    }

    // Email unik di seluruh platform
    if (await db.user.findFirst({ where: { email } })) {
      return NextResponse.json({ success: false, message: 'Email admin sudah terdaftar. Gunakan email lain.' }, { status: 400 });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const school = await db.$transaction(async (tx) => {
      const s = await tx.school.create({
        data: {
          name: name.trim().slice(0, 120),
          appVariant: variant,
          contactName: contactName?.trim()?.slice(0, 120) || null,
          contactPhone: contactPhone?.trim()?.slice(0, 30) || null,
          pricePerMonth: price,
        },
      });
      await tx.user.create({
        data: {
          name: adminName.trim(),
          email,
          password: passwordHash,
          role: 'ADMIN',
          mustChangePassword: true,
          schoolId: s.id,
        },
      });
      return s;
    });

    await logAudit(owner, 'SCHOOL_CREATED', { schoolId: school.id, schoolName: school.name, detail: `Admin: ${email}` });

    return NextResponse.json(
      {
        success: true,
        data: { id: school.id },
        message: `Sekolah "${school.name}" dibuat.\n\nAkun admin sekolah:\nEmail: ${email}\nPassword sementara: ${tempPassword}\n(Catat dan berikan ke admin sekolah. Hanya tampil sekali, wajib diganti saat login pertama.)`,
      },
      { status: 201 }
    );
  } catch (e) {
    return serverError(e, 'Gagal membuat sekolah');
  }
}
