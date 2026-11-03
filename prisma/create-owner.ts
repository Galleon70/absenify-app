// Membuat akun OWNER (pemilik platform). Jalankan:
//   npx tsx prisma/create-owner.ts email@kamu.com "Nama Kamu"
// Password sementara ditampilkan SEKALI di terminal dan wajib diganti saat login pertama.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const tempPassword = () => Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  const name = process.argv[3]?.trim() || 'Owner';
  if (!email || !email.includes('@')) {
    console.error('Pemakaian: npx tsx prisma/create-owner.ts email@kamu.com "Nama Kamu"');
    process.exit(1);
  }

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    console.error(`Email ${email} sudah terdaftar (role ${existing.role}). Pakai email lain.`);
    process.exit(1);
  }

  const platform = await prisma.school.upsert({
    where: { id: 'platform-owner' },
    update: {},
    create: { id: 'platform-owner', name: 'HadirKu Platform' },
  });

  const pw = tempPassword();
  await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(pw, 10),
      role: 'OWNER',
      mustChangePassword: true,
      schoolId: platform.id,
    },
  });

  console.log('✅ Akun OWNER dibuat');
  console.log('   Email             :', email);
  console.log('   Password sementara:', pw);
  console.log('   (Catat sekarang. Wajib diganti saat login pertama.)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
