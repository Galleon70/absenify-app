// src/components/landing/StatScene.tsx
'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle2 } from 'lucide-react';

export function StatScene() {
  return (
    <div className="w-full h-full bg-slate-900 p-6 flex flex-col justify-between text-white select-none">
      {/* Header Widget */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Dashboard Kepala Sekolah</p>
            <h4 className="text-sm font-bold text-white">Rekap Kehadiran Minggu Ini</h4>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <TrendingUp className="w-3.5 h-3.5" /> 98.2% Hadir
        </span>
      </div>

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3">
          <p className="text-[11px] text-slate-400">Total Siswa</p>
          <p className="text-lg font-black text-white mt-0.5">720</p>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
            <CheckCircle2 className="w-3 h-3" /> Semua Absen
          </span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3">
          <p className="text-[11px] text-slate-400">Izin / Sakit</p>
          <p className="text-lg font-black text-amber-400 mt-0.5">12</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Dengan Bukti</span>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3">
          <p className="text-[11px] text-slate-400">Tanpa Keterangan</p>
          <p className="text-lg font-black text-rose-400 mt-0.5">1</p>
          <span className="text-[10px] text-rose-400 font-semibold mt-1 block">Perlu Perhatian</span>
        </div>
      </div>

      {/* Simulasi Bar Chart Tren 5 Hari */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300">Tren Kehadiran Harian</span>
          <span className="text-[11px] text-indigo-400 font-medium">Senin - Jumat</span>
        </div>
        <div className="flex items-end justify-between h-24 gap-3 pt-2">
          {[
            { day: 'Sen', val: '95%', h: '85%' },
            { day: 'Sel', val: '98%', h: '95%' },
            { day: 'Rab', val: '97%', h: '90%' },
            { day: 'Kam', val: '99%', h: '100%' },
            { day: 'Jum', val: '96%', h: '88%' },
          ].map((bar) => (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-400">{bar.val}</span>
              <div className="w-full bg-slate-700/50 rounded-t-lg overflow-hidden h-full flex items-end">
                <div 
                  className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-lg transition-all duration-500"
                  style={{ height: bar.h }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-300">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}