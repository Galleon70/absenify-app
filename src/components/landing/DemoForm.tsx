'use client';

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/site-config';

const input = 'w-full bg-white text-gray-900 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none';

// Tidak ada server: formulir menyusun pesan lalu membuka WhatsApp dengan isi yang sudah terisi.
export default function DemoForm() {
  const [f, setF] = useState({ sekolah: '', jenjang: 'SMP', kota: '', murid: '', hp: 'Ya', nama: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = [
      'Halo, saya ingin minta demo aplikasi absensi sekolah.',
      `Nama sekolah: ${f.sekolah}`,
      `Jenjang: ${f.jenjang}`,
      `Kota: ${f.kota}`,
      `Perkiraan jumlah murid: ${f.murid || '-'}`,
      `Murid boleh membawa HP: ${f.hp}`,
      `Nama saya: ${f.nama}`,
    ].join('\n');
    window.open(waLink(text), '_blank', 'noopener,noreferrer');
  };

  return (
    <form onSubmit={submit} className="space-y-3 text-left">
      <div className="grid sm:grid-cols-2 gap-3">
        <input required placeholder="Nama sekolah" value={f.sekolah} onChange={set('sekolah')} className={input} />
        <select value={f.jenjang} onChange={set('jenjang')} className={input} aria-label="Jenjang">
          {['SD / MI', 'SMP / MTs', 'SMA / MA', 'SMK', 'Lainnya'].map((j) => <option key={j}>{j}</option>)}
        </select>
        <input required placeholder="Kota / kabupaten" value={f.kota} onChange={set('kota')} className={input} />
        <input type="number" min={1} placeholder="Perkiraan jumlah murid" value={f.murid} onChange={set('murid')} className={input} />
        <select value={f.hp} onChange={set('hp')} className={input} aria-label="Murid boleh bawa HP">
          <option value="Ya">Murid boleh membawa HP</option>
          <option value="Tidak">Murid tidak boleh membawa HP</option>
          <option value="Sebagian">Sebagian boleh</option>
        </select>
        <input required placeholder="Nama Anda" value={f.nama} onChange={set('nama')} className={input} />
      </div>
      <button type="submit" className="w-full min-h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
        <MessageCircle className="w-5 h-5" /> Kirim lewat WhatsApp
      </button>
      <p className="text-xs text-gray-500 text-center">Pesan dibuka di WhatsApp dan baru terkirim setelah Anda menekan kirim.</p>
    </form>
  );
}
