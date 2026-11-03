import 'dotenv/config';
import { PrismaClient, Role, AppVariant } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashed = await bcrypt.hash('admin123', 10);

  // 1. Sekolah demo (Mode 1: 4 role, tanpa akun siswa)
  const school = await prisma.school.upsert({
    where: { id: 'default-school-001' },
    update: {},
    create: { id: 'default-school-001', name: 'SMA Negeri 1 HadirKu', appVariant: AppVariant.VARIANT_1 },
  });

  const mkUser = (name: string, email: string, role: Role) =>
    prisma.user.upsert({
      where: { email_schoolId: { email, schoolId: school.id } },
      update: {},
      create: { name, email, password: hashed, role, schoolId: school.id },
    });

  const admin = await mkUser('Super Admin HadirKu', 'admin@hadirku.com', Role.ADMIN);
  const teacher = await mkUser('Budi Santoso, S.Pd', 'guru@hadirku.com', Role.TEACHER);
  const principal = await mkUser('Kepala Sekolah', 'kepsek@hadirku.com', Role.PRINCIPAL);
  const parent = await mkUser('Orang Tua Demo', 'orangtua@hadirku.com', Role.PARENT);

  // 2. Kelas + siswa demo (terhubung ke orang tua demo)
  const kelas = await prisma.classRoom.upsert({
    where: { name_schoolId: { name: '7A', schoolId: school.id } },
    update: {},
    create: { name: '7A', grade: 'VII', waliKelas: teacher.name, schoolId: school.id },
  });
  await prisma.student.upsert({
    where: { nisn_schoolId: { nisn: '0012345678', schoolId: school.id } },
    update: {},
    create: {
      name: 'Andi Pratama',
      nisn: '0012345678',
      classRoomId: kelas.id,
      parentId: parent.id,
      schoolId: school.id,
    },
  });

  // 3. Riwayat presensi contoh (5 hari terakhir) supaya dashboard orang tua tidak kosong saat demo
  const andi = await prisma.student.findFirst({ where: { nisn: '0012345678', schoolId: school.id } });
  if (andi) {
    const statuses = ['HADIR', 'HADIR', 'SAKIT', 'HADIR', 'HADIR'] as const;
    for (let i = 0; i < statuses.length; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (i + 1));
      const date = d.toISOString().split('T')[0];
      await prisma.attendance.upsert({
        where: { date_studentId: { date, studentId: andi.id } },
        update: {},
        create: {
          date,
          studentId: andi.id,
          schoolId: school.id,
          status: statuses[i],
          note: statuses[i] === 'SAKIT' ? 'Demam, ada surat dokter' : null,
        },
      });
    }
  }

  console.log('✅ Seeding berhasil! Sekolah:', school.name, `[Mode: ${school.appVariant}]`);
  console.log('Semua akun password: admin123');
  for (const u of [admin, teacher, principal, parent]) console.log(` - ${u.role.padEnd(9)} ${u.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Gagal Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
