// Pemeriksa database: mengecek SETIAP kolom yang dikenal aplikasi, satu per satu, lewat koneksi yang sama
// dengan aplikasi. Hasilnya menunjuk kolom/tabel yang hilang. Aman: hanya membaca, tidak mengubah data.
// Jalankan:  npx tsx prisma/check-db.ts
import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL || '';
if (!url) {
  console.error('DATABASE_URL kosong. Pastikan file .env ada di folder project.');
  process.exit(1);
}

let hostInfo = '(tidak terbaca)';
try {
  const u = new URL(url);
  hostInfo = `${u.host}${u.pathname}`;
} catch {
  /* abaikan */
}
console.log('Database yang dipakai :', hostInfo, '(username/password disembunyikan)');

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

async function main() {
  const info = (await prisma.$queryRawUnsafe(
    'select current_database() as db, current_schema() as schema'
  )) as { db: string; schema: string }[];
  console.log('Nama database / schema :', info[0].db, '/', info[0].schema);

  const cols = (await prisma.$queryRawUnsafe(
    `select column_name from information_schema.columns where table_schema = current_schema() and table_name = 'User' order by 1`
  )) as { column_name: string }[];
  console.log('Kolom tabel "User" di database:', cols.map((c) => c.column_name).join(', ') || '(tabel tidak ditemukan)');
  console.log('');

  let problems = 0;
  for (const model of Object.values(Prisma.ModelName)) {
    const enumObj = (Prisma as unknown as Record<string, Record<string, string>>)[`${model}ScalarFieldEnum`];
    const delegate = (prisma as unknown as Record<string, { findFirst: (a: unknown) => Promise<unknown> }>)[lower(model)];
    if (!enumObj || !delegate) continue;

    let modelProblems = 0;
    for (const field of Object.values(enumObj)) {
      try {
        await delegate.findFirst({ select: { [field]: true } });
      } catch {
        modelProblems++;
        problems++;
        console.log(`  HILANG  ${model}.${field}`);
      }
    }
    if (modelProblems === 0) console.log(`  ok      ${model}`);
  }

  console.log('');
  if (problems === 0) {
    console.log('HASIL: semua kolom yang dibutuhkan aplikasi ada di database ini.');
    console.log('Jika error masih muncul, kemungkinan server dev lama masih jalan atau cache .next belum dihapus.');
  } else {
    console.log(`HASIL: ${problems} kolom/tabel hilang di database yang DIPAKAI APLIKASI.`);
    console.log('Artinya "prisma db push" tidak mengenai database yang sama, atau belum benar-benar menerapkan perubahan.');
  }
}

main()
  .catch((e) => {
    console.error('Gagal memeriksa:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
