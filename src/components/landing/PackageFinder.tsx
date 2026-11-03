'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

const sel = 'w-full bg-transparent text-sm font-semibold text-gray-900 focus:outline-none cursor-pointer';

// "Kotak pencarian" di bawah hero: memilih kebutuhan, lalu menyorot paket yang cocok dan menggulung ke bagian Paket.
export default function PackageFinder() {
  const [need, setNeed] = useState('basic');
  const [hp, setHp] = useState('tidak');
  const [size, setSize] = useState('mid');

  const find = (e: React.FormEvent) => {
    e.preventDefault();
    let mode = 1;
    let note = 'Mode 1 cocok: guru mengabsen, orang tua mengajukan izin, kepala sekolah memantau.';
    if (need === 'view') {
      mode = 2;
      note = 'Mode 2 cocok: seperti Mode 1, ditambah akun murid untuk melihat rekap kehadirannya.';
    } else if (need === 'qr') {
      if (hp === 'ya') {
        mode = 3;
        const scanners = size === 'small' ? 1 : size === 'mid' ? 2 : 3;
        note = `Mode 3 cocok: murid menunjukkan QR di HP, petugas memindai. Perkiraan kebutuhan: ${scanners} perangkat scanner di gerbang (perkiraan awal, disesuaikan saat demo).`;
      } else {
        mode = 2;
        note = 'QR membutuhkan HP murid. Karena murid tidak boleh membawa HP, kami sarankan Mode 2 (murid melihat rekap).';
      }
    }
    window.dispatchEvent(new CustomEvent('pick-mode', { detail: { mode, note } }));
    const el = document.getElementById('paket');
    if (el) el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <form onSubmit={find} className="grid sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] items-center gap-3 lg:gap-4 bg-white rounded-2xl sm:rounded-full shadow-xl border border-indigo-50 p-4 sm:px-8 sm:py-4">
      <label className="block">
        <span className="block text-[11px] font-semibold text-gray-400">Kebutuhan</span>
        <select value={need} onChange={(e) => setNeed(e.target.value)} className={sel}>
          <option value="basic">Absensi guru dan izin orang tua</option>
          <option value="view">Murid juga melihat rekap</option>
          <option value="qr">Absensi otomatis dengan QR</option>
        </select>
      </label>
      <label className="block">
        <span className="block text-[11px] font-semibold text-gray-400">Kebijakan HP</span>
        <select value={hp} onChange={(e) => setHp(e.target.value)} className={sel}>
          <option value="tidak">Murid tidak boleh bawa HP</option>
          <option value="ya">Murid boleh bawa HP</option>
        </select>
      </label>
      <label className="block">
        <span className="block text-[11px] font-semibold text-gray-400">Jumlah murid</span>
        <select value={size} onChange={(e) => setSize(e.target.value)} className={sel}>
          <option value="small">Kurang dari 300</option>
          <option value="mid">300 sampai 800</option>
          <option value="big">Lebih dari 800</option>
        </select>
      </label>
      <button type="submit" className="min-h-12 px-8 rounded-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition">
        <Search className="w-4 h-4" /> Cari Paket
      </button>
    </form>
  );
}
