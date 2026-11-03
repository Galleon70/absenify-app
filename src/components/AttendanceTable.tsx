'use client';

import React, { useState } from 'react';

interface Student {
  id: string;
  name: string;
}

export default function AttendanceTable({ students }: { students: Student[] }) {
  const [date, setDate] = useState('2026-09-24');
  const [records, setRecords] = useState<Record<string, string>>({});

  const handleStatusChange = (studentId: string, status: string) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    const payload = students.map((s) => ({
      studentId: s.id,
      status: records[s.id] || 'HADIR'
    }));

    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, records: payload })
    });

    if (res.ok) {
      alert('Absensi kelas berhasil disimpan!');
    } else {
      alert('Gagal menyimpan absensi');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Tanggal Absensi</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-2 border rounded-lg text-sm font-semibold"
          />
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
        >
          Simpan Absensi
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="p-3">Siswa</th>
              <th className="p-3">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((student) => {
              const currentStatus = records[student.id] || 'HADIR';
              return (
                <tr key={student.id}>
                  <td className="p-3 font-semibold text-slate-800">{student.name}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {['HADIR', 'IZIN', 'SAKIT', 'ALPA', 'TERLAMBAT'].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(student.id, st)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                            currentStatus === st
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}