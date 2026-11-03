'use client';

import React, { useEffect, useState } from 'react';
import { Check, GraduationCap, QrCode, Users } from 'lucide-react';

export interface ModeItem {
  id: 1 | 2 | 3;
  name: string;
  sub: string;
  badge: string;
  body: string;
  chips: string[];
  points: string[];
  href: string; // tautan WhatsApp (dihitung di server)
}

const ICON = { 1: GraduationCap, 2: Users, 3: QrCode } as const;
const TONE = { 1: 'from-indigo-500 to-indigo-700', 2: 'from-violet-500 to-fuchsia-600', 3: 'from-emerald-500 to-teal-600' } as const;

// Kartu paket. Menyorot paket yang direkomendasikan oleh kotak "Cari paket" di bagian atas halaman.
export default function ModeCards({ modes }: { modes: ModeItem[] }) {
  const [picked, setPicked] = useState<{ mode: number; note: string } | null>(null);

  useEffect(() => {
    const onPick = (e: Event) => setPicked((e as CustomEvent<{ mode: number; note: string }>).detail);
    window.addEventListener('pick-mode', onPick);
    return () => window.removeEventListener('pick-mode', onPick);
  }, []);

  return (
    <div>
      {picked && (
        <p className="mb-5 mx-auto max-w-2xl text-center text-sm bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl px-4 py-3">
          {picked.note}
        </p>
      )}
      <div className="grid md:grid-cols-3 gap-5">
        {modes.map((m) => {
          const Icon = ICON[m.id];
          const on = picked?.mode === m.id;
          return (
            <div key={m.id} className={`rounded-3xl bg-white overflow-hidden shadow-sm transition ${on ? 'ring-4 ring-indigo-400 shadow-xl -translate-y-1' : 'border border-gray-100'}`}>
              <div className={`relative h-36 bg-gradient-to-br ${TONE[m.id]} flex items-center justify-center`}>
                <Icon className="w-14 h-14 text-white/90" />
                <span className="absolute top-3 left-3 text-[11px] font-bold bg-white/90 text-indigo-700 rounded-full px-3 py-1">{m.badge}</span>
                {on && <span className="absolute top-3 right-3 text-[11px] font-bold bg-amber-300 text-amber-900 rounded-full px-3 py-1">Rekomendasi</span>}
              </div>
              <div className="p-5">
                <h3 className="font-black text-lg">{m.name} <span className="text-sm font-bold text-indigo-700">{m.sub}</span></h3>
                <p className="mt-1 text-sm text-gray-600">{m.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.chips.map((c) => <span key={c} className="text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-lg px-2.5 py-1">{c}</span>)}
                </div>
                <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
                  {m.points.map((p) => (<li key={p} className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{p}</li>))}
                </ul>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-gray-900">Hubungi kami</span>
                  <a href={m.href} target="_blank" rel="noopener noreferrer" className="px-4 min-h-10 leading-10 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold">Tanya harga</a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
