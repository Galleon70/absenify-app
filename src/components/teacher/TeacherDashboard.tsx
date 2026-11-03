'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, RefreshCw, Save } from 'lucide-react';

export type AttStatus = 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'ALPA';

export interface TStudent { id: string; name: string; nisn: string | null; classId: string | null }
export interface TClass { id: string; name: string; waliKelas: string | null }
export interface TAttendance { studentId: string; status: AttStatus; note: string | null }
export interface TLeave { id: string; studentId: string; type: 'SAKIT' | 'IZIN'; reason: string }

interface Props {
  todayDate: string; // YYYY-MM-DD menurut zona waktu sekolah (dari server)
  students: TStudent[];
  classes: TClass[];
  attendance: TAttendance[];
  leaves: TLeave[];
  defaultClassId?: string;
  onSave: (records: { studentId: string; status: AttStatus; note: string }[]) => Promise<{ ok: boolean; message: string }>;
  onRefresh: () => Promise<void> | void;
}

const STATUSES: AttStatus[] = ['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'];
const SHORT: Record<AttStatus, string> = { HADIR: 'HADIR', TERLAMBAT: 'TELAT', IZIN: 'IZIN', SAKIT: 'SAKIT', ALPA: 'ALPA' };
const LONG: Record<AttStatus, string> = { HADIR: 'Hadir', TERLAMBAT: 'Terlambat', IZIN: 'Izin', SAKIT: 'Sakit', ALPA: 'Alpa' };

const ACTIVE_STYLE: Record<AttStatus, string> = {
  HADIR: 'bg-emerald-600 text-white border-emerald-600',
  TERLAMBAT: 'bg-orange-500 text-white border-orange-500',
  IZIN: 'bg-blue-600 text-white border-blue-600',
  SAKIT: 'bg-amber-500 text-white border-amber-500',
  ALPA: 'bg-rose-600 text-white border-rose-600',
};
const SUMMARY_STYLE: Record<AttStatus | 'BELUM', string> = {
  HADIR: 'text-emerald-700 bg-emerald-50',
  TERLAMBAT: 'text-orange-700 bg-orange-50',
  IZIN: 'text-blue-700 bg-blue-50',
  SAKIT: 'text-amber-700 bg-amber-50',
  ALPA: 'text-rose-700 bg-rose-50',
  BELUM: 'text-gray-600 bg-gray-100',
};

type Row = { status: AttStatus | null; note: string; from: 'server' | 'leave' | 'manual' | 'none' };

export function TeacherDashboard({ todayDate, students, classes, attendance, leaves, defaultClassId, onSave, onRefresh }: Props) {
  const todayStr = new Date(`${todayDate}T12:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId || classes[0]?.id || '');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const touched = useRef<Set<string>>(new Set()); // murid yang sudah diubah guru di layar (tidak ditimpa data server)

  useEffect(() => {
    if (!selectedClassId && classes[0]) setSelectedClassId(defaultClassId || classes[0].id);
  }, [classes, defaultClassId, selectedClassId]);

  // Susun status awal dari data server: absensi tercatat (termasuk scan QR) > izin disetujui > belum tercatat.
  // Murid yang sudah diubah guru di layar tidak ditimpa saat data dimuat ulang.
  useEffect(() => {
    setRows((prev) => {
      const next: Record<string, Row> = {};
      for (const s of students) {
        if (touched.current.has(s.id) && prev[s.id]) {
          next[s.id] = prev[s.id];
          continue;
        }
        const rec = attendance.find((a) => a.studentId === s.id);
        const lv = leaves.find((l) => l.studentId === s.id);
        if (rec) next[s.id] = { status: rec.status, note: rec.note || '', from: 'server' };
        else if (lv) next[s.id] = { status: lv.type, note: lv.reason, from: 'leave' };
        else next[s.id] = { status: null, note: '', from: 'none' };
      }
      return next;
    });
  }, [students, attendance, leaves]);

  const filtered = useMemo(
    () => (selectedClassId ? students.filter((s) => s.classId === selectedClassId) : students),
    [students, selectedClassId]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 4000);
  };

  const summary = useMemo(() => {
    const c: Record<AttStatus | 'BELUM', number> = { HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, ALPA: 0, BELUM: 0 };
    filtered.forEach((s) => {
      const st = rows[s.id]?.status;
      c[st ?? 'BELUM']++;
    });
    return c;
  }, [filtered, rows]);

  const setStatus = (id: string, status: AttStatus) => {
    touched.current.add(id);
    setRows((p) => ({ ...p, [id]: { status, note: status === 'HADIR' ? '' : p[id]?.note || '', from: 'manual' } }));
  };
  const setNote = (id: string, note: string) => {
    touched.current.add(id);
    setRows((p) => ({ ...p, [id]: { ...(p[id] || { status: null, from: 'manual' }), note, from: 'manual' } as Row }));
  };

  // "Semua Hadir" hanya mengisi murid yang BELUM tercatat (tidak menimpa scan QR atau izin)
  const setAllHadir = () => {
    setRows((p) => {
      const next = { ...p };
      filtered.forEach((s) => {
        if (!next[s.id] || next[s.id].status === null) {
          touched.current.add(s.id);
          next[s.id] = { status: 'HADIR', note: '', from: 'manual' };
        }
      });
      return next;
    });
  };

  const handleSave = async () => {
    const records = filtered
      .filter((s) => rows[s.id]?.status)
      .map((s) => ({ studentId: s.id, status: rows[s.id].status as AttStatus, note: rows[s.id].note || '' }));
    if (records.length === 0) return showToast('Belum ada status yang dipilih.');
    setSaving(true);
    try {
      const r = await onSave(records);
      if (r.ok) {
        records.forEach((x) => touched.current.delete(x.studentId)); // setelah tersimpan, ikuti data server lagi
        const belum = filtered.length - records.length;
        showToast(belum > 0 ? `Tersimpan ${records.length} murid. ${belum} murid belum tercatat.` : 'Presensi berhasil disimpan!');
      } else {
        showToast(r.message || 'Gagal menyimpan presensi.');
      }
    } finally {
      setSaving(false);
    }
  };

  const noData = classes.length === 0 || students.length === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-3 pb-32 sm:pb-28 text-gray-800">
      {/* Info kelas & tanggal */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div>
          <h2 className="text-lg font-black text-gray-900 leading-tight">Presensi Kelas Harian</h2>
          <p className="text-sm font-semibold text-indigo-700 mt-0.5">{todayStr}</p>
        </div>
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <label htmlFor="kelas" className="text-sm font-semibold text-gray-500">Kelas</label>
          {classes.length > 0 ? (
            <select
              id="kelas"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="flex-1 max-w-[12rem] min-h-11 px-3 bg-gray-100 text-gray-800 rounded-xl font-bold text-sm border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          ) : (
            <span className="px-3 py-2 bg-gray-100 text-gray-800 rounded-xl font-bold text-sm">Belum ada kelas</span>
          )}
        </div>
      </div>

      {noData ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          {classes.length === 0
            ? 'Belum ada kelas. Admin sekolah perlu menambahkan kelas dan siswa terlebih dahulu.'
            : 'Belum ada siswa. Admin sekolah perlu menambahkan data siswa terlebih dahulu.'}
        </div>
      ) : (
        <>
          {/* Ringkasan hitung */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {([...STATUSES, 'BELUM'] as const).map((st) => (
              <div key={st} className={`rounded-xl py-2 text-center ${SUMMARY_STYLE[st]}`}>
                <p className="text-lg font-black leading-none">{summary[st]}</p>
                <p className="text-[10px] font-bold mt-1 tracking-wide">{st === 'BELUM' ? 'Belum' : LONG[st]}</p>
              </div>
            ))}
          </div>

          {/* Muat ulang */}
          <button
            type="button"
            onClick={async () => {
              await onRefresh();
              showToast('Data dimuat ulang (termasuk hasil scan QR).');
            }}
            className="w-full min-h-11 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Muat ulang data
          </button>

          {/* Daftar siswa */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 tracking-wider uppercase">
              Daftar Siswa ({filtered.length})
            </div>
            <div className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">Tidak ada siswa di kelas ini.</div>
              ) : (
                filtered.map((s) => {
                  const row = rows[s.id];
                  const status = row?.status ?? null;
                  return (
                    <div key={s.id} className="p-4 space-y-3 md:space-y-0 md:flex md:items-start md:gap-4">
                      <div className="md:w-1/3 md:pt-2">
                        <p className="text-sm font-bold text-gray-900 leading-tight">{s.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          NISN: {s.nisn || '-'}
                          {status === null && <span className="ml-2 text-amber-600 font-semibold">Belum tercatat</span>}
                          {row?.from === 'leave' && <span className="ml-2 text-blue-600 font-semibold">dari izin disetujui</span>}
                          {row?.from === 'server' && row.note === 'Scan QR' && <span className="ml-2 text-emerald-600 font-semibold">scan QR</span>}
                        </p>
                      </div>
                      <div className="md:flex-1 space-y-2">
                        <div className="grid grid-cols-5 gap-1.5" role="group" aria-label={`Status ${s.name}`}>
                          {STATUSES.map((st) => {
                            const active = status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setStatus(s.id, st)}
                                className={`min-h-11 text-[11px] font-bold rounded-xl transition border active:scale-95 ${
                                  active ? ACTIVE_STYLE[st] : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {SHORT[st]}
                              </button>
                            );
                          })}
                        </div>
                        {status !== null && status !== 'HADIR' && (
                          <input
                            type="text"
                            placeholder="Catatan (opsional)"
                            value={row?.note || ''}
                            onChange={(e) => setNote(s.id, e.target.value)}
                            className="w-full min-h-11 text-sm border border-gray-200 rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50/50 focus:bg-white transition"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div role="status" className="fixed left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-96 bottom-28 z-50 bg-gray-900 text-white text-sm font-semibold text-center rounded-xl px-4 py-3 shadow-lg">
          {toast}
        </div>
      )}

      {/* Bar aksi menempel di bawah layar */}
      {!noData && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={setAllHadir}
              className="col-span-1 min-h-12 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs transition flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 leading-tight"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Sisanya Hadir</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="col-span-2 min-h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Presensi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
