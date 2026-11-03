// Mereset password akun OWNER (jika lupa). Jalankan:
//   npx tsx prisma/reset-owner.ts email@kamu.com
// Password sementara ditampilkan SEKALI di terminal dan wajib diganti saat login berikutnya.
// Semua sesi login lama owner itu otomatis berakhir, dan kunci login (jika ada) dibuka.
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
  if (!email) {
    console.error('Pemakaian: npx tsx prisma/reset-owner.ts email@kamu.com');
    process.exit(1);
  }

  const owner = await prisma.user.findFirst({ where: { email, role: 'OWNER' } });
  if (!owner) {
    console.error(`Tidak ada akun OWNER dengan email ${email}.`);
    process.exit(1);
  }

  const pw = tempPassword();
  await prisma.user.update({
    where: { id: owner.id },
    data: {
      password: await bcrypt.hash(pw, 10),
      mustChangePassword: true,
      isActive: true,
      tokenVersion: { increment: 1 },
    },
  });
  await prisma.loginThrottle.deleteMany({ where: { key: `id:${email}` } });

  console.log('✅ Password OWNER direset');
  console.log('   Email             :', email);
  console.log('   Password sementara:', pw);
  console.log('   (Catat sekarang. Wajib diganti saat login.)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
