'use client';

import React from 'react';
import { Users, UserCheck, AlertTriangle, FileText, TrendingUp, Calendar } from 'lucide-react';

export function PrincipalDashboard() {
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Mock data statistik sekolah
  const stats = [
    { title: 'Total Siswa', value: '480', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Hadir Hari Ini', value: '96.2%', sub: '462 Siswa', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Izin / Sakit', value: '14', sub: '8 Izin, 6 Sakit', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Tanpa Keterangan', value: '4', sub: 'Alpa', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const classSummaries = [
    { name: 'X IPA 1', total: 36, hadir: 35, izin: 1, alpa: 0, percent: '97%' },
    { name: 'X IPA 2', total: 36, hadir: 34, izin: 2, alpa: 0, percent: '94%' },
    { name: 'XI IPS 1', total: 34, hadir: 32, izin: 1, alpa: 1, percent: '94%' },
    { name: 'XII MIPA 1', total: 35, hadir: 35, izin: 0, alpa: 0, percent: '100%' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4 text-gray-800">
      {/* Box Welcome Pimpinan */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Eksekutif Dashboard
          </span>
          <h2 className="text-lg font-black text-gray-900 mt-1">Laporan Kehadiran Sekolah</h2>
          <p className="text-xs text-gray-500">Pantau rekapitulasi presensi seluruh kelas secara *realtime*.</p>
        </div>

        <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200/80 px-3 py-1.5 rounded-xl text-gray-700 text-xs font-bold">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span>{todayStr}</span>
        </div>
      </div>

      {/* Grid Statistik Utama */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500">{item.title}</span>
                <div className={`p-2 rounded-xl ${item.bg}`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
              </div>
              <div>
                <p className="text-lg font-black text-gray-900 leading-none">{item.value}</p>
                {item.sub && <p className="text-[10px] text-gray-400 font-medium mt-1">{item.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rekap Per Kelas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-3.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-gray-800">Persentase Kehadiran Per Kelas</h3>
          </div>
          <span className="text-[10px] font-bold text-indigo-600">Hari Ini</span>
        </div>

        <div className="divide-y divide-gray-100">
          {classSummaries.map((cls, idx) => (
            <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900">{cls.name}</p>
                <p className="text-[10px] text-gray-400">
                  {cls.hadir} Hadir • {cls.izin} Izin/Sakit • {cls.alpa} Alpa
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {/* Progress Bar */}
                <div className="w-20 sm:w-32 bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: cls.percent }}
                  ></div>
                </div>
                <span className="text-xs font-black text-gray-800 w-8 text-right">{cls.percent}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}