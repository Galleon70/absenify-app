// src/lib/site-config.ts
// SATU tempat untuk nama, kontak, dan alamat situs. Ganti di sini, semua halaman publik ikut berubah.
export const SITE = {
  name: 'Absenify', // GANTI setelah nama diputuskan
  tagline: 'Absensi dan izin siswa digital untuk sekolah di seluruh Indonesia',
  description:
    'Aplikasi absensi dan izin siswa online: guru mencatat kehadiran, orang tua mengajukan izin dengan bukti foto, kepala sekolah memantau ringkasan. Bisa dibuka dari HP, tanpa instal.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', // isi NEXT_PUBLIC_SITE_URL saat deploy
  whatsapp: '6282146331736', // GANTI: awalan 62, tanpa 0 di depan dan tanpa tanda +
  email: 'nama@gmail.com', // GANTI
  // Foto latar beranda (opsional). Taruh file di folder `public`, lalu tulis di sini, mis. ['/hero1.jpg', '/hero2.jpg', '/hero3.jpg'].
  // Lebih dari satu = bergantian otomatis. Kosong = ilustrasi bawaan.
  heroImages: ['/hero1.jpg', '/hero2.jpg', '/hero3.jpg', '/hero4.jpg', '/hero5.jpg'],
  heroIntervalMs: 5000, // jeda pergantian foto (milidetik); minimal 2500
  // Testimoni: GANTI dengan testimoni asli. Yang masih bertanda [ ] tampil sebagai kotak putus-putus supaya tidak terlupa.
  testimonials: [
    { name: '[Nama]', role: '[Jabatan, Nama Sekolah]', quote: '[Isi testimoni di sini setelah ada sekolah yang mencoba.]' },
    { name: '[Nama]', role: '[Jabatan, Nama Sekolah]', quote: '[Isi testimoni di sini.]' },
    { name: '[Nama]', role: '[Jabatan, Nama Sekolah]', quote: '[Isi testimoni di sini.]' },
  ],
  aboutImage: '/tentang.jpg', // opsional: foto untuk bagian "Tentang", mis. '/tentang.jpg' di folder public. Kosong = ilustrasi bawaan.
  waText: 'Halo, saya ingin tanya demo aplikasi absensi sekolah.',
};

export const waLink = (text?: string) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text ?? SITE.waText)}`;
export const mailLink = (subject = 'Tanya Demo') => `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}`;

export const FAQ: { q: string; a: string }[] = [
  { q: `Apa itu ${SITE.name}?`, a: 'Aplikasi absensi dan izin siswa yang bisa dibuka dari HP atau komputer, untuk guru, orang tua, kepala sekolah, dan admin sekolah.' },
  { q: 'Apa bedanya Mode 1, 2, dan 3?', a: 'Mode 1 untuk guru, orang tua, admin, dan kepala sekolah. Mode 2 menambah akun murid untuk melihat rekap kehadirannya. Mode 3 menambah QR absensi di HP murid yang dipindai petugas.' },
  { q: 'Apakah murid wajib membawa HP?', a: 'Tidak. Mode 1 dan 2 tidak membutuhkannya. Mode 3 untuk sekolah yang membolehkan murid membawa HP.' },
  { q: 'Bagaimana kalau HP murid mati atau hilang?', a: 'Guru mengabsen murid secara manual di dashboard guru.' },
  { q: 'Apakah data aman?', a: 'Password disimpan terenkripsi, percobaan login dibatasi, akses dibedakan per peran, dan data tiap sekolah dipisah.' },
  { q: 'Bisakah sekolah lain melihat data kami?', a: 'Tidak. Data setiap sekolah terpisah dan hanya bisa dibuka oleh pengguna sekolah itu.' },
  { q: 'Perlu memasang aplikasi?', a: 'Tidak. Cukup buka lewat browser, lalu boleh ditambahkan ke layar utama HP agar seperti aplikasi.' },
  { q: 'Bagaimana kalau internet sekolah mati?', a: 'Pencatatan membutuhkan koneksi internet. Siapkan cadangan pencatatan manual sampai koneksi pulih.' },
  { q: 'Berapa biayanya?', a: 'Biaya langganan per sekolah per bulan, tergantung mode. Hubungi kami untuk penawaran.' },
  { q: 'Bisakah dicoba dulu?', a: 'Bisa. Minta demo lewat WhatsApp atau formulir di halaman ini.' },
  { q: 'Berapa lama sampai bisa dipakai?', a: 'Setelah data kelas dan siswa diisi, sekolah bisa mulai memakai. Kami bantu proses awalnya.' },
  { q: 'Kalau berhenti berlangganan, bagaimana datanya?', a: 'Akun sekolah dinonaktifkan dan data tidak dihapus otomatis. Kebijakan penyimpanan dan penghapusan data disepakati secara tertulis.' },
];
