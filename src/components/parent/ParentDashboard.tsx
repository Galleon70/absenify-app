'use client';

import React, { useRef, useState } from 'react';
import { FileText, Send, ChevronDown, Paperclip, X, Users } from 'lucide-react';

export interface Child {
  id: string;
  name: string;
  nisn: string | null;
  className: string | null;
}

export interface ParentLeave {
  id: string;
  type: 'SAKIT' | 'IZIN';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  hasAttachment: boolean;
  requestedBy?: string;
  attachmentName: string | null;
  studentId: string;
  student: { id: string; name: string };
}

export interface ParentAttendance {
  id: string;
  date: string;
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA' | 'TERLAMBAT';
  note: string | null;
  student: { id: string; name: string };
}

interface Props {
  loading: boolean;
  students: Child[];
  leaves: ParentLeave[];
  attendance: ParentAttendance[];
  onLeaveSubmitted: () => void;
}

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-');
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${Number(day)} ${bulan[Number(m) - 1] ?? m} ${y}`;
};

const STATUS_LABEL: Record<ParentLeave['status'], string> = {
  PENDING: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

function LinkChildForm({ onLinked }: { onLinked: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/parent/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({}));
      setMsg({ ok: res.ok, text: json.message || (res.ok ? 'Anak berhasil ditambahkan' : 'Gagal menambahkan') });
      if (res.ok) {
        setCode('');
        onLinked();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2 text-xs">
      <label className="font-bold text-gray-700 block">Tambah anak dengan kode dari sekolah</label>
      <div className="flex gap-2">
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          className="flex-1 min-w-0 border border-gray-200 rounded-xl p-2.5 text-center font-mono tracking-widest text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <button type="submit" disabled={busy} className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl">
          {busy ? '...' : 'Tambah'}
        </button>
      </div>
      {msg && <p className={`font-semibold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</p>}
    </form>
  );
}

export default function ParentDashboard({ loading, students, leaves, attendance, onLeaveSubmitted }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [type, setType] = useState<'SAKIT' | 'IZIN'>('SAKIT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const child = students.find((s) => s.id === selectedStudentId) || students[0];
  const childLeaves = leaves.filter((l) => l.studentId === child?.id);
  const childAttendance = attendance.filter((a) => a.student.id === child?.id);

  const countOf = (...st: ParentAttendance['status'][]) =>
    childAttendance.filter((a) => st.includes(a.status)).length;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFeedback(null);
    if (!f) return setFile(null);
    if (f.size > MAX_FILE_BYTES) {
      setFeedback({ ok: false, text: 'Ukuran bukti maksimal 3 MB.' });
      e.target.value = '';
      return setFile(null);
    }
    setFile(f);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!child) return setFeedback({ ok: false, text: 'Data siswa tidak ditemukan.' });
    if (!startDate || !endDate || !reason.trim()) {
      return setFeedback({ ok: false, text: 'Harap lengkapi tanggal dan alasan.' });
    }
    if (endDate < startDate) {
      return setFeedback({ ok: false, text: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' });
    }

    const fd = new FormData();
    fd.append('studentId', child.id);
    fd.append('type', type);
    fd.append('startDate', startDate);
    fd.append('endDate', endDate);
    fd.append('reason', reason.trim());
    if (file) fd.append('attachment', file);

    setSubmitting(true);
    try {
      const res = await fetch('/api/leave', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ ok: false, text: json.message || 'Gagal mengirim pengajuan.' });
        return;
      }
      setFeedback({ ok: true, text: 'Pengajuan terkirim. Menunggu persetujuan admin.' });
      setReason('');
      setStartDate('');
      setEndDate('');
      clearFile();
      onLeaveSubmitted();
    } catch {
      setFeedback({ ok: false, text: 'Tidak bisa terhubung ke server.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-400 text-center py-20">Memuat data...</p>;
  }

  if (students.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center space-y-2">
        <Users className="w-10 h-10 text-indigo-300 mx-auto" />
        <h2 className="text-base font-bold text-gray-900">Belum ada anak yang terhubung</h2>
        <p className="text-xs text-gray-500 pb-2">
          Masukkan kode pendaftaran dari sekolah untuk menghubungkan akun ini dengan anak Anda.
        </p>
        <LinkChildForm onLinked={onLeaveSubmitted} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info Anak */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-black text-xl border border-white/20">
            {child?.name ? child.name.charAt(0) : 'S'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Wali dari Siswa</span>

              {students.length > 1 && (
                <div className="relative inline-block">
                  <select
                    value={child?.id}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold py-0.5 pl-2 pr-6 rounded-lg border border-white/20 appearance-none cursor-pointer focus:outline-none"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id} className="text-gray-900 font-medium">
                        {s.name}
                        {s.className ? ` (${s.className})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-white absolute right-1.5 top-1.5 pointer-events-none" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-black">{child?.name}</h2>
            <p className="text-xs text-indigo-100 font-medium">
              NISN: {child?.nisn || '-'} • Kelas: {child?.className || '-'}
            </p>
          </div>
        </div>

        <div className="flex space-x-3 text-center">
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-indigo-200 block uppercase font-bold">Hadir</span>
            <span className="text-base font-black text-emerald-300">{countOf('HADIR', 'TERLAMBAT')} Hari</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-indigo-200 block uppercase font-bold">Sakit/Izin</span>
            <span className="text-base font-black text-amber-300">{countOf('SAKIT', 'IZIN')} Hari</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-indigo-200 block uppercase font-bold">Alpa</span>
            <span className="text-base font-black text-rose-300">{countOf('ALPA')} Hari</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Pengajuan Izin */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4 self-start">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900">Form Pengajuan Izin</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Jenis</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('SAKIT')}
                  className={`py-2 rounded-xl font-bold transition border ${
                    type === 'SAKIT' ? 'bg-amber-50 border-amber-400 text-amber-700' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  Sakit
                </button>
                <button
                  type="button"
                  onClick={() => setType('IZIN')}
                  className={`py-2 rounded-xl font-bold transition border ${
                    type === 'IZIN' ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'border-gray-200 text-gray-500'
                  }`}
                >
                  Izin
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Dari Tanggal</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Sampai Tanggal</label>
              <input
                type="date"
                required
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Alasan Keterangan</label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Demam tinggi, butuh istirahat dokter."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Bukti <span className="font-normal text-gray-400">(foto atau PDF, opsional, maks 3 MB)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFile}
                className="hidden"
                id="bukti-izin"
              />
              {file ? (
                <div className="flex items-center justify-between gap-2 border border-indigo-200 bg-indigo-50 rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-2 text-indigo-700 font-semibold min-w-0">
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </span>
                  <button type="button" onClick={clearFile} title="Hapus bukti" className="text-gray-400 hover:text-rose-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="bukti-izin"
                  className="flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-xl py-3 text-gray-500 font-semibold cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition"
                >
                  <Paperclip className="w-4 h-4" />
                  Pilih foto / PDF
                </label>
              )}
            </div>

            {feedback && (
              <p
                className={`rounded-xl px-3 py-2 font-semibold ${
                  feedback.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {feedback.text}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition shadow-md shadow-indigo-200 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Mengirim...' : 'Kirim Surat Izin'}</span>
            </button>
          </form>
          <div className="pt-4 border-t border-gray-100">
            <LinkChildForm onLinked={onLeaveSubmitted} />
          </div>
        </div>

        {/* Status Pengajuan & Riwayat Presensi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Status Permohonan Izin</h3>
            {childLeaves.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Belum ada pengajuan izin.</p>
            ) : (
              <div className="space-y-3">
                {childLeaves.map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex justify-between items-center gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            l.type === 'SAKIT' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {l.type === 'SAKIT' ? 'Sakit' : 'Izin'}
                        </span>
                        {l.requestedBy === 'STUDENT' && <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-violet-100 text-violet-800">diajukan anak</span>}
                        <span className="font-bold text-gray-800">
                          {fmtDate(l.startDate)}
                          {l.startDate !== l.endDate ? ` s/d ${fmtDate(l.endDate)}` : ''}
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1">{l.reason}</p>
                      {l.hasAttachment && (
                        <a
                          href={`/api/leave/${l.id}/attachment`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1.5 text-indigo-600 font-semibold hover:underline"
                        >
                          <Paperclip className="w-3 h-3" />
                          Lihat bukti
                        </a>
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {STATUS_LABEL[l.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Catatan Presensi Harian Terbaru</h3>
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-left">
                  <th className="pb-2 font-bold">TANGGAL</th>
                  <th className="pb-2 font-bold">STATUS</th>
                  <th className="pb-2 font-bold">CATATAN GURU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {childAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-400">
                      Belum ada data presensi tersimpan.
                    </td>
                  </tr>
                ) : (
                  childAttendance.slice(0, 15).map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 font-medium text-gray-800">{fmtDate(a.date)}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            a.status === 'HADIR' || a.status === 'TERLAMBAT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.status === 'SAKIT' || a.status === 'IZIN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500">{a.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
