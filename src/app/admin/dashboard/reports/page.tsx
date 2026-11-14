'use client';

import { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiCalendar, 
  FiRotateCcw, 
  FiFileText, 
  FiUsers,
  FiUserCheck
} from 'react-icons/fi';

interface ClassRoom {
  id: string;
  name: string;
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // Default bulan ini, misal: "2026-11"
  );
  const [selectedClass, setSelectedClass] = useState<string>('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setClasses(json.data || []);
        else if (Array.isArray(json)) setClasses(json);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  // --- FUNGSIONALITAS EKSPOR EXCEL ---
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (selectedMonth) params.append('month', selectedMonth);
    params.append('type', activeTab);
    
    if (activeTab === 'STUDENT' && selectedClass) {
      params.append('classRoomId', selectedClass);
    }

    // Panggil route API ekspor excel
    window.open(`/api/admin/reports/export?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Utama */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan & Rekapitulasi Absensi</h1>
          <p className="text-sm text-gray-500">
            Unduh rekapitulasi kehadiran bulanan siswa & jam kerja guru dalam format Excel (.xlsx) resmi.
          </p>
        </div>

        <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200/60 w-fit">
          📊 Format .xlsx Resmi
        </div>
      </div>

      {/* Main Card Tema Putih (Satu Halaman untuk Siswa & Guru) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-4xl space-y-6">
        
        {/* Tombol Tab Switcher Siswa / Guru */}
        <div className="flex bg-gray-100/80 p-1.5 rounded-xl w-fit gap-1 border border-gray-200/50">
          <button
            type="button"
            onClick={() => setActiveTab('STUDENT')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'STUDENT'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <FiUsers /> Rekap Siswa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TEACHER')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'TEACHER'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <FiUserCheck /> Rekap Jam & Kehadiran Guru
          </button>
        </div>

        <h2 className="text-sm font-bold flex items-center gap-2 text-gray-800">
          <FiFileText className="text-indigo-600" /> Filter Parameter Ekspor ({activeTab === 'STUDENT' ? 'Siswa' : 'Guru'})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filter Bulan */}
          <div>
            <label className="text-xs text-gray-600 mb-1.5 flex items-center gap-1 font-medium">
              <FiCalendar /> Pilih Bulan & Tahun
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Filter Kelas (Khusus Siswa) */}
          {activeTab === 'STUDENT' && (
            <div>
              <label className="text-xs text-gray-600 mb-1.5 flex items-center gap-1 font-medium">
                <FiUsers /> Pilih Kelas (Opsional)
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Ringkasan Parameter */}
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 text-xs space-y-1">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">RINGKASAN EKSPOR:</p>
          <p className="text-gray-600">• Target Data: <span className="font-semibold text-emerald-600">{activeTab === 'STUDENT' ? 'Absensi Siswa (Laporan Rapor)' : 'Absensi & Jam Kerja Guru'}</span></p>
          <p className="text-gray-600">• Periode: <span className="font-semibold text-indigo-600">{selectedMonth || 'Semua Bulan'}</span></p>
          {activeTab === 'STUDENT' && (
            <p className="text-gray-600">• Filter Kelas: <span className="font-semibold text-indigo-400">{classes.find(c => c.id === selectedClass)?.name || 'Semua Kelas'}</span></p>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(new Date().toISOString().slice(0, 7));
              setSelectedClass('');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-600"
          >
            <FiRotateCcw /> Reset Filter
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
          >
            <FiDownload size={16} /> Ekspor File Excel (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
}