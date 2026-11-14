'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiShield, FiArrowLeft } from 'react-icons/fi';

interface PrivacyPolicySection {
  id: string;
  title: string;
  description: string;
}

export default function PublicPrivacyPolicyPage() {
  const [sections, setSections] = useState<PrivacyPolicySection[]>([
    {
      id: '1',
      title: 'Pengumpulan Informasi',
      description: 'Platform Absenify mengumpulkan data pribadi yang diperlukan untuk operasional absensi sekolah, seperti nama lengkap, NIS/NISN, NIP guru, email, nomor HP orang tua, serta data rekapan kehadiran harian.',
    },
    {
      id: '2',
      title: 'Penggunaan Data',
      description: 'Data yang dikumpulkan hanya digunakan untuk kepentingan administrasi absensi sekolah, laporan kehadiran bulanan, serta penyampaian pengumuman resmi sekolah.',
    },
    {
      id: '3',
      title: 'Keamanan & Isolasi Data',
      description: 'Kami menerapkan isolasi data ketat antar-sekolah (multi-tenant), enkripsi sesi login, serta pembatasan hak akses sesuai peran (Admin, Guru, Orang Tua, Siswa).',
    },
    {
      id: '4',
      title: 'Hak Pengguna & Kontak',
      description: 'Pengguna memiliki hak mengajukan perbaikan data melalui pengelola sekolah masing-masing. Untuk informasi lebih lanjut, hubungi tim dukungan Absenify.',
    },
  ]);

  const [isLoading, setIsLoading] = useState(true);

  // Ambil data kebijakan privasi terbaru yang disimpan Admin
  useEffect(() => {
    async function fetchPrivacyPolicy() {
      try {
        const res = await fetch('/api/admin/privacy-policy');
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.sections && json.data.sections.length > 0) {
            setSections(json.data.sections);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil data privacy policy:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPrivacyPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 md:p-8 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-3xl p-6 md:p-10 space-y-8 relative">
        
        {/* Header Section */}
        <div className="flex justify-between items-start pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <FiShield size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Kebijakan Privasi (Privacy Policy)</h1>
              <p className="text-xs text-slate-400 mt-1">Terakhir diperbarui: 7 November 2026</p>
            </div>
          </div>
          
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-xl"
          >
            <FiArrowLeft size={14} /> Kembali
          </Link>
        </div>

        {/* Content List */}
        <div className="space-y-6">
          {isLoading ? (
            <p className="text-center text-xs text-slate-400 py-6">Memuat kebijakan privasi...</p>
          ) : (
            sections.map((sec, index) => (
              <div key={sec.id || index} className="space-y-2">
                <h2 className="font-bold text-slate-900 text-base md:text-lg">
                  {index + 1}. {sec.title}
                </h2>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  {sec.description}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer Watermark */}
        <div className="pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            © 2026 Absenify Platform. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}