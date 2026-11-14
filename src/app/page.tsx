// src/app/page.tsx  -- Halaman publik (boleh diindeks Google). Aplikasi ada di /login.
import type { Metadata } from 'next';
import { BarChart3, Check, ChevronDown, ClipboardCheck, Mail, MessageCircle, School, ShieldCheck, Smartphone, Star, Users, FileCheck2, Lock, Shield } from 'lucide-react';
import { FAQ, SITE, mailLink, waLink } from '@/lib/site-config';
import DemoForm from '@/components/landing/DemoForm';
import NavLinks from '@/components/landing/LandingNav';
import HeroCarousel, { PhotoSlide } from '@/components/landing/HeroCarousel';
import PackageFinder from '@/components/landing/PackageFinder';
import ModeCards, { type ModeItem } from '@/components/landing/ModeCards';
import { SCENES } from '@/components/landing/Scenes';
import { StatScene } from '@/components/landing/StatScene';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name}: Aplikasi Absensi dan Izin Siswa Online untuk Sekolah`,
  description: SITE.description,
  keywords: ['aplikasi absensi sekolah', 'absensi siswa online', 'izin siswa online', 'absensi QR siswa', 'presensi sekolah digital'],
  alternates: { canonical: '/' },
  openGraph: { title: `${SITE.name}: Absensi dan Izin Siswa Digital`, description: SITE.description, type: 'website', locale: 'id_ID', siteName: SITE.name },
  robots: { index: true, follow: true }, // menimpa pengaturan "tertutup" di layout, hanya untuk halaman ini
};

// Tebal lapisan gelap di atas gambar hero (0 sampai 0.9). Naikkan kalau teks sulit dibaca, turunkan untuk warna gambar lebih asli.
const SCRIM = 0.5;

const quick = [
  { icon: Smartphone, t: 'Absensi Cepat', d: 'Cukup beberapa ketukan dari HP.' },
  { icon: FileCheck2, t: 'Izin Online', d: 'Orang tua mengajukan izin lengkap dengan bukti.' },
  { icon: Lock, t: 'Data Aman', d: 'Terpisah per sekolah, akses sesuai peran.' },
  { icon: ShieldCheck, t: 'Tanpa Instal', d: 'Dibuka dari browser, bisa ke layar utama.' },
];

const why = [
  'Guru mengabsen satu kelas lebih cepat',
  'Orang tua langsung tahu kehadiran dan status izin anak',
  'Kepala sekolah melihat tren dan murid yang perlu perhatian',
  'Pilihan paket sesuai kebijakan HP di sekolah',
];

const roles = [
  { icon: ClipboardCheck, title: 'Guru', items: ['Presensi harian per kelas dari HP', 'Status Hadir, Terlambat, Izin, Sakit, Alpa', 'Hasil scan QR dan izin disetujui terisi otomatis'] },
  { icon: Users, title: 'Orang tua', items: ['Lihat rekap kehadiran anak', 'Ajukan izin sakit atau izin, lengkap dengan foto atau PDF', 'Daftar sendiri dengan kode dari sekolah'] },
  { icon: BarChart3, title: 'Kepala sekolah', items: ['Kehadiran hari ini dan tren 7 hari', 'Persentase kehadiran per kelas', 'Peringatan murid yang sering Alpa'] },
  { icon: School, title: 'Admin sekolah', items: ['Kelola guru, murid, dan kelas', 'Setujui atau tolak izin', 'Buat akun dan kode pendaftaran, nonaktifkan akun'] },
];

const modes: ModeItem[] = [
  {
    id: 1,
    name: 'Mode 1',
    sub: 'Dasar (SD / MI)',
    badge: 'Dasar',
    body: 'Cocok untuk SD / MI atau sekolah yang fokus pada absensi oleh guru & pantauan penuh orang tua (murid tidak perlu akun login).',
    chips: ['4 peran', 'Tanpa akun murid'],
    points: ['Presensi harian oleh guru', 'Izin orang tua dengan bukti', 'Dashboard kepala sekolah'],
    href: waLink('Halo, saya tertarik dengan Mode 1 (Dasar). Boleh minta penawaran?'),
  },
  {
    id: 2,
    name: 'Mode 2',
    sub: 'Menengah (SMP / SMA / Pesantren)',
    badge: 'Menengah',
    body: 'Cocok untuk sekolah yang melarang HP di kelas, tapi murid tetap bisa cek rekap kehadiran & ajukan izin dari rumah.',
    chips: ['5 peran', 'Akun murid'],
    points: ['Semua fitur Mode 1', 'Login murid memakai NISN', 'Murid melihat rekap kehadirannya'],
    href: waLink('Halo, saya tertarik dengan Mode 2 (Murid melihat rekap). Boleh minta penawaran?'),
  },
  {
    id: 3,
    name: 'Mode 3',
    sub: 'Lengkap (SMA / SMK Modern)',
    badge: 'Lengkap',
    body: 'Cocok untuk sekolah yang membolehkan HP. Murid memindai QR dinamis saat datang dan terlambat tercatat otomatis.',
    chips: ['5 peran', 'QR + scanner'],
    points: ['Semua fitur Mode 2', 'QR berganti otomatis (anti titip absen)', 'Terlambat tercatat otomatis'],
    href: waLink('Halo, saya tertarik dengan Mode 3 (Absen QR). Boleh minta penawaran?'),
  },
];

const steps = [
  { icon: School, n: '01', t: 'Sekolah didaftarkan', d: 'Kami membuat akun sekolah dan admin. Admin mengisi kelas, guru, dan siswa.' },
  { icon: Users, n: '02', t: 'Pengguna masuk', d: 'Guru, orang tua, dan murid login dari HP. Orang tua daftar dengan kode dari sekolah.' },
  { icon: BarChart3, n: '03', t: 'Pantau dan setujui', d: 'Guru mengabsen, orang tua mengajukan izin, admin menyetujui, kepala sekolah memantau.' },
];

const security = [
  'Password disimpan terenkripsi dan wajib diganti saat login pertama',
  'Percobaan login dibatasi untuk mencegah tebak password',
  'Hak akses dibedakan per peran',
  'Data setiap sekolah terpisah',
  'QR murid berubah otomatis dan tidak bisa dipakai ulang dari screenshot',
  'Pencadangan data harian otomatis untuk mencegah kehilangan rekap absensi',
];

const jsonLd = [
  { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: SITE.name, applicationCategory: 'EducationalApplication', operatingSystem: 'Web', description: SITE.description, inLanguage: 'id' },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
];

export default function LandingPage() {
  const slides =
    SITE.heroImages.length > 0
      ? SITE.heroImages.map((src, k) => {
          const Fallback = SCENES[k % SCENES.length];
          return <PhotoSlide key={src} src={src} fallback={<Fallback />} />;
        })
      : SCENES.map((S, k) => <S key={k} />);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/50 text-gray-900 font-sans antialiased">
      {jsonLd.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}

      {/* Floating Island Header Transparan Tunggal */}
      <div className="fixed top-4 inset-x-0 z-30 px-3 pointer-events-none flex justify-center">
        <header className="pointer-events-auto w-full max-w-4xl rounded-3xl bg-slate-950/45 backdrop-blur-xl shadow-2xl border border-white/20 px-5 py-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-4">
            <a href="/" className="btn-animate flex items-center gap-2 font-black text-sm sm:text-base text-white shrink-0">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center p-1 overflow-hidden shadow-inner">
                <img
                  src="/logo.jpg"
                  alt="Absenify Logo"
                  className="w-full h-full object-cover scale-[1.33]"
                />
              </span>
              <span>{SITE.name}</span>
            </a>
            
            <div className="hidden md:block">
              <NavLinks variant="desktop" />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <a href="/login" className="btn-animate px-3.5 py-1.5 rounded-full border border-white/25 text-white text-xs sm:text-sm font-bold hover:bg-white/15 transition">
                Masuk
              </a>
            </div>
          </div>
          
          <div className="md:hidden pt-1 border-t border-white/10 flex justify-center overflow-x-auto scrollbar-none">
            <NavLinks variant="mobile" />
          </div>
        </header>
      </div>

      <main>
        {/* Hero Section */}
        <section className="relative w-full min-h-[700px] sm:min-h-[760px] flex flex-col overflow-hidden bg-slate-800">
          <HeroCarousel slides={slides} intervalMs={SITE.heroIntervalMs} />
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none sm:hidden" style={{ background: `linear-gradient(to bottom, rgba(15,23,42,${SCRIM}), rgba(15,23,42,${SCRIM * 0.55}))` }} />
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none hidden sm:block" style={{ background: `linear-gradient(to right, rgba(15,23,42,${SCRIM}), rgba(15,23,42,${SCRIM * 0.5}) 55%, rgba(15,23,42,${SCRIM * 0.12}))` }} />

          <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-40 sm:pt-36">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/15 backdrop-blur border border-white/30 rounded-full px-3 py-1.5">
                <School className="w-3.5 h-3.5" /> Absensi &bull; Izin &bull; Rekap
              </span>
              <h1 className="mt-5 text-3xl sm:text-5xl font-black leading-tight text-white drop-shadow">
                Absensi dan Izin Siswa Online yang{' '}
                <span className="text-amber-300 underline decoration-amber-300/70 decoration-4 underline-offset-8">Terasa Mudah</span>
              </h1>
              <p className="mt-4 text-sm sm:text-base text-white/90 max-w-lg drop-shadow">
                Guru mencatat kehadiran, orang tua mengajukan izin lengkap dengan bukti, kepala sekolah memantau ringkasan. Cukup dari HP.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a href={waLink()} target="_blank" rel="noopener noreferrer" className="btn-animate min-h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20">
                  <MessageCircle className="w-4 h-4" /> Minta Demo via WhatsApp
                </a>
              </div>
            </div>
          </div>

          <span className="absolute z-10 top-[136px] right-4 sm:top-[100px] sm:right-8 text-[11px] sm:text-xs font-bold bg-white/90 text-indigo-800 rounded-full px-3 py-1.5 shadow-sm">Untuk SD sampai SMA</span>

          <div className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-8 pt-10 pb-5 sm:pb-8">
            <PackageFinder />
          </div>
        </section>

        {/* Keunggulan singkat */}
        <section className="max-w-6xl mx-auto px-3 sm:px-4 mt-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quick.map((q) => (
              <div key={q.t} className="card-animate bg-white/80 rounded-2xl border border-indigo-50 shadow-sm p-4 flex items-start gap-3">
                <span className="w-11 h-11 shrink-0 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center"><q.icon className="w-5 h-5" /></span>
                <div>
                  <p className="text-sm font-bold">{q.t}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{q.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tentang (Menggunakan Grafik Statistik Kepala Sekolah di sisi kanan) */}
        <section id="tentang" className="scroll-mt-28 max-w-6xl mx-auto px-3 sm:px-4 mt-16 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <p className="text-xs font-bold tracking-widest text-indigo-600 uppercase">Kenapa {SITE.name}</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black leading-tight">Lebih dari Sekadar Absensi</h2>
            <p className="mt-3 text-gray-600">Kami menyatukan absensi, izin, dan pemantauan dalam satu aplikasi yang bisa dipakai guru, orang tua, kepala sekolah, dan admin.</p>
            <ul className="mt-5 space-y-3">
              {why.map((w) => (<li key={w} className="flex gap-3 text-sm text-gray-800"><span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3 h-3" /></span>{w}</li>))}
            </ul>
          </div>
          <div className="card-animate relative rounded-3xl overflow-hidden aspect-[4/3] shadow-lg border border-slate-800">
            <StatScene />
          </div>
        </section>

        {/* Fitur per peran */}
        <section id="fitur" className="scroll-mt-28 max-w-6xl mx-auto px-3 sm:px-4 mt-20">
          <h2 className="text-2xl sm:text-3xl font-black text-center">Satu aplikasi, empat peran</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r) => (
              <div key={r.title} className="card-animate bg-white rounded-3xl border border-indigo-50 p-6 shadow-sm">
                <span className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center"><r.icon className="w-5 h-5" /></span>
                <h3 className="mt-3 font-bold">{r.title}</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                  {r.items.map((i) => (<li key={i} className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{i}</li>))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Paket */}
        <section id="paket" className="scroll-mt-28 max-w-6xl mx-auto px-3 sm:px-4 mt-20">
          <p className="text-center text-xs font-bold tracking-widest text-indigo-600 uppercase">Paket</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black text-center">Pilih sesuai kebijakan HP di sekolah Anda</h2>
          <div className="mt-8"><ModeCards modes={modes} /></div>
          <p className="mt-4 text-center text-xs text-gray-500">Harga berlangganan per sekolah per bulan. Hubungi kami untuk penawaran.</p>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className="scroll-mt-28 max-w-6xl mx-auto px-3 sm:px-4 mt-20">
          <p className="text-center text-xs font-bold tracking-widest text-indigo-600 uppercase">Cara kerja</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black text-center">Mulai dalam 3 langkah mudah</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {steps.map((s) => (
              <div key={s.n} className="card-animate bg-white rounded-3xl border border-indigo-50 shadow-sm p-6 flex items-start gap-4">
                <span className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center"><s.icon className="w-6 h-6" /></span>
                <div>
                  <p className="text-xs font-black text-indigo-500">{s.n}</p>
                  <h3 className="font-bold">{s.t}</h3>
                  <p className="mt-1 text-sm text-gray-600">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Keamanan */}
        <section id="keamanan" className="scroll-mt-28 max-w-4xl mx-auto px-3 sm:px-4 mt-20">
          <div className="flex items-center justify-center gap-2"><ShieldCheck className="w-6 h-6 text-indigo-600" /><h2 className="text-2xl sm:text-3xl font-black">Data siswa dijaga</h2></div>
          <ul className="mt-6 grid sm:grid-cols-2 gap-3">
            {security.map((s) => (<li key={s} className="card-animate flex gap-2 rounded-2xl bg-white border border-indigo-50 p-4 text-sm text-gray-700"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{s}</li>))}
          </ul>
        </section>

        {/* Testimoni (Otomatis disembunyikan jika belum ada testimoni asli) */}
        {SITE.testimonials.some((t) => !t.quote.startsWith('[')) && (
          <section className="max-w-6xl mx-auto px-3 sm:px-4 mt-20">
            <h2 className="text-2xl sm:text-3xl font-black text-center">Kata mereka</h2>
            <div className="mt-8 grid md:grid-cols-3 gap-5">
              {SITE.testimonials
                .filter((t) => !t.quote.startsWith('['))
                .map((t, k) => (
                  <figure key={k} className="card-animate rounded-3xl bg-white p-6 shadow-sm border border-indigo-50">
                    <div className="flex gap-0.5 text-amber-400">{[0, 1, 2, 3, 4].map((x) => <Star key={x} className="w-4 h-4 fill-current" />)}</div>
                    <blockquote className="mt-3 text-sm text-gray-700">&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption className="mt-4 text-sm"><span className="font-bold">{t.name}</span><span className="block text-xs text-gray-500">{t.role}</span></figcaption>
                  </figure>
                ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section id="tanya-jawab" className="scroll-mt-28 max-w-3xl mx-auto px-3 sm:px-4 mt-20">
          <h2 className="text-2xl sm:text-3xl font-black text-center">Pertanyaan yang sering diajukan (FAQ)</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="card-animate group bg-white rounded-2xl border border-indigo-50 p-4">
                <summary className="flex items-center justify-between gap-3 cursor-pointer font-bold text-sm list-none">
                  {f.q}
                  <ChevronDown className="w-4 h-4 text-gray-400 transition group-open:rotate-180 shrink-0" />
                </summary>
                <p className="mt-2 text-sm text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Banner ajakan + formulir demo */}
        <section id="demo" className="scroll-mt-28 max-w-6xl mx-auto px-3 sm:px-4 mt-20 mb-16">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-900 to-indigo-600 text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0"><School className="w-7 h-7" /></span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black">Siap mencoba untuk sekolah Anda?</h2>
                <p className="mt-1 text-sm text-indigo-100">Isi data singkat di bawah, lalu kirim lewat WhatsApp. Kami akan menghubungi Anda.</p>
              </div>
            </div>
            <a href={waLink()} target="_blank" rel="noopener noreferrer" className="btn-animate min-h-12 px-6 rounded-xl bg-white text-indigo-800 font-bold text-sm flex items-center justify-center gap-2 shrink-0 hover:bg-indigo-50">
              <MessageCircle className="w-4 h-4" /> Chat WhatsApp
            </a>
          </div>
          <div className="mt-6 max-w-2xl mx-auto bg-white rounded-3xl border border-indigo-50 shadow-sm p-6"><DemoForm /></div>
        </section>
      </main>

      <footer className="border-t border-indigo-100 bg-white/70">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} {SITE.name}. {SITE.tagline}.</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <a href="/privacy" className="flex items-center gap-1.5 font-semibold hover:text-indigo-700 transition">
              <Shield className="w-4 h-4" />Privacy Policy
            </a>
            <a href={waLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-semibold hover:text-indigo-700 transition">
              <MessageCircle className="w-4 h-4" />WhatsApp
            </a>
            <a href={mailLink()} className="flex items-center gap-1.5 font-semibold hover:text-indigo-700 transition">
              <Mail className="w-4 h-4" />Email
            </a>
            <a href="/login" className="font-semibold hover:text-indigo-700 transition">
              Masuk ke aplikasi
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}