'use client';

import { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiCalendar, 
  FiFilter, 
  FiRotateCcw, 
  FiFileText, 
  FiUsers 
} from 'react-icons/fi';

interface ClassRoom {
  id: string;
  name: string;
}

export default function AdminReportsPage() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // Default bulan ini, misal: "2026-10"
  );
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const res = await fetch('/api/admin/classes');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setClasses(json.data || []);
        else if (Array.isArray(json)) setClasses(json);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // --- FUNGSIONALITAS EKSPOR EXCEL ---
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (selectedMonth) params.append('month', selectedMonth);
    if (selectedClass) params.append('classRoomId', selectedClass);

    // Membuka route API ekspor excel di tab baru untuk memicu download otomatis
    window.open(`/api/admin/reports/export?${params.toString()}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Laporan & Rekapitulasi Absensi</h1>
          <p className="text-sm text-slate-400">
            Unduh rekap kehadiran bulanan siswa dalam format Excel (.xlsx) untuk laporan ke Dinas Pendidikan
          </p>
        </div>
        <div className="bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-500/30">
          📊 Laporan & Ekspor
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 shadow-xl max-w-3xl">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-100">
          <FiFileText className="text-indigo-400" /> Filter Data Ekspor
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Filter Pilih Bulan */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1 font-medium">
              <FiCalendar /> Pilih Bulan & Tahun
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Pilih Kelas */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1 font-medium">
              <FiUsers /> Pilih Kelas (Opsional)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ringkasan Parameter */}
        <div className="bg-[#0f172a]/60 border border-slate-800 rounded-lg p-4 mb-6 text-sm text-slate-300 space-y-1">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Preview Ekspor:</p>
          <p>• Periode: <span className="font-semibold text-indigo-400">{selectedMonth || 'Semua Bulan'}</span></p>
          <p>• Filter Kelas: <span className="font-semibold text-indigo-400">{classes.find(c => c.id === selectedClass)?.name || 'Semua Kelas'}</span></p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(new Date().toISOString().slice(0, 7));
              setSelectedClass('');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition text-slate-400"
          >
            <FiRotateCcw /> Reset Filter
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-lg shadow-emerald-950/50"
          >
            <FiDownload size={18} /> Ekspor File Excel (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
}