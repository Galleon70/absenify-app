'use client';

import React, { useState } from 'react';

export default function LeaveForm({ studentId }: { studentId: string }) {
  const [formData, setFormData] = useState({
    type: 'SAKIT',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, studentId })
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(result.error || 'Gagal mengirim pengajuan');
      return;
    }

    alert('Pengajuan izin berhasil dibuat!');
    setFormData({ type: 'SAKIT', startDate: '', endDate: '', reason: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 max-w-md mx-auto">
      <h3 className="font-bold text-lg text-slate-800">Form Pengajuan Izin / Sakit</h3>
      
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Izin</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full p-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="SAKIT">Sakit</option>
          <option value="IZIN">Izin</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tgl Mulai</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tgl Selesai</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Alasan</label>
        <textarea
          rows={3}
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Tuliskan alasan lengkap..."
          className="w-full p-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
      >
        {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
      </button>
    </form>
  );
}