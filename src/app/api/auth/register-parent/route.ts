import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createToken, setAuthCookie } from '@/lib/auth';
import { hashInvite } from '@/lib/invite';
import { validateNewPassword } from '@/lib/password';
import { clientIp, lockedMinutes, lockMessage, recordFailure } from '@/lib/login-throttle';

const bad = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

// POST: orang tua mendaftar sendiri memakai kode dari sekolah. Password dibuat sendiri, langsung login.
export async function POST(req: Request) {
  const key = `reg:${clientIp(req)}`;
  const locked = await lockedMinutes([key]);
  if (locked > 0) return bad(lockMessage(locked), 429);

  try {
    const { code, name, email, password } = await req.json();
    const hash = hashInvite(String(code ?? ''));

    const student = await db.student.findFirst({
      where: { inviteHash: hash, inviteExpiresAt: { gt: new Date() }, parentId: null },
      include: { school: true },
    });
    if (!student || !student.school.isActive) {
      await recordFailure([{ key, max: 10 }]);
      return bad('Kode tidak valid atau sudah kedaluwarsa');
    }

    const cleanName = String(name ?? '').trim();
    const cleanEmail = String(email ?? '').toLowerCase().trim();
    if (cleanName.length < 2) return bad('Nama wajib diisi');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return bad('Format email tidak valid');
    const weak = validateNewPassword(String(password ?? ''));
    if (weak) return bad(weak);

    // Email unik di seluruh platform
    if (await db.user.findFirst({ where: { email: cleanEmail } })) {
      return bad('Email sudah terdaftar. Silakan login, lalu pakai menu "Tambah anak dengan kode" di dashboard.');
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const parent = await db.$transaction(async (tx) => {
      // updateMany + syarat kode masih ada: mencegah dua orang memakai kode yang sama bersamaan
      const claimed = await tx.student.updateMany({
        where: { id: student.id, inviteHash: hash, parentId: null },
        data: { inviteHash: null, inviteExpiresAt: null, parentName: cleanName },
      });
      if (claimed.count !== 1) throw new Error('CODE_USED');
      const u = await tx.user.create({
        data: { name: cleanName, email: cleanEmail, password: passwordHash, role: 'PARENT', schoolId: student.schoolId },
      });
      await tx.student.update({ where: { id: student.id }, data: { parentId: u.id } });
      return u;
    });

    const token = await createToken({
      userId: parent.id,
      name: parent.name,
      email: parent.email,
      username: parent.username,
      role: 'PARENT',
      schoolId: parent.schoolId,
      appVariant: student.school.appVariant,
      mustChangePassword: false,
      tv: parent.tokenVersion,
    });
    await setAuthCookie(token, 'PARENT');
    return NextResponse.json({ success: true, role: 'PARENT' });
  } catch (e) {
    if ((e as Error).message === 'CODE_USED') return bad('Kode sudah dipakai');
    console.error('Gagal daftar orang tua:', e);
    return bad('Terjadi kesalahan server', 500);
  }
}
