// src/app/parent/dashboard/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import type { NotificationItem } from "@/types";
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Megaphone, 
  PlusCircle, 
  UserCheck, 
  User,
  KeyRound,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Users
} from "lucide-react";

interface StudentChild {
  id: string;
  name: string;
  nisn: string | null;
  className: string | null;
  attendance?: { id: string; date: string; status: "HADIR" | "IZIN" | "SAKIT" | "ALPA" | "TERLAMBAT"; note: string | null }[];
  leaves?: { id: string; type: "SAKIT" | "IZIN"; startDate: string; endDate: string; reason: string; status: "PENDING" | "APPROVED" | "REJECTED" }[];
}

interface ParentUser {
  name: string;
  email: string;
}

const READ_KEY = "hadirku:parent-notif-read";
const loadRead = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || "[]");
  } catch {
    return [];
  }
};

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${Number(day)} ${BULAN[Number(m) - 1] ?? m} ${y}`;
};
const todayLocal = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
};

const STATUS_STYLE = {
  HADIR: "bg-emerald-100 text-emerald-800 border-emerald-200",
  TERLAMBAT: "bg-orange-100 text-orange-800 border-orange-200",
  IZIN: "bg-blue-100 text-blue-800 border-blue-200",
  SAKIT: "bg-amber-100 text-amber-800 border-amber-200",
  ALPA: "bg-rose-100 text-rose-800 border-rose-200",
};

const LEAVE_LABEL = { PENDING: "Menunggu", APPROVED: "Disetujui", REJECTED: "Ditolak" } as const;

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [parentUser, setParentUser] = useState<ParentUser | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"ATTENDANCE" | "LEAVE" | "ANNOUNCEMENT" | "ACCOUNT">("ATTENDANCE");
  const [period, setPeriod] = useState<"MONTH" | "ALL">("MONTH");

  // Form Izin State
  const [leaveType, setLeaveType] = useState<"SAKIT" | "IZIN">("SAKIT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const json = await res.json();
        setAnnouncements(json.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat pengumuman:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/parent/children", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.message || "Gagal mengambil data anak");
      const list = json.data || [];
      setChildren(list);
      if (json.parent) setParentUser(json.parent);
      if (list.length > 0 && !selectedChildId) {
        setSelectedChildId(list[0].id);
      }
      setError("");
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    setReadIds(loadRead());
    loadData();
    fetchAnnouncements();
  }, [loadData, fetchAnnouncements]);

  const activeStudent = useMemo(() => {
    return children.find((c) => c.id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId]);

  const today = todayLocal();
  const todayRecord = activeStudent?.attendance?.find((a) => a.date === today);

  const counts = useMemo(() => {
    const monthPrefix = today.slice(0, 7);
    const rows = (activeStudent?.attendance ?? []).filter(
      (a) => period === "ALL" || a.date.startsWith(monthPrefix)
    );
    const c = { hadir: 0, terlambat: 0, izinSakit: 0, alpa: 0 };
    rows.forEach((a) => {
      if (a.status === "HADIR") c.hadir++;
      else if (a.status === "TERLAMBAT") c.terlambat++;
      else if (a.status === "IZIN" || a.status === "SAKIT") c.izinSakit++;
      else if (a.status === "ALPA") c.alpa++;
    });
    return c;
  }, [activeStudent, period, today]);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      return alert("Mohon lengkapi tanggal dan alasan!");
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("type", leaveType);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("reason", reason);
      if (activeStudent) formData.append("studentId", activeStudent.id);
      if (file) formData.append("file", file);

      const res = await fetch("/api/leave", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("Permohonan izin berhasil dikirim!");
        setReason("");
        setStartDate("");
        setEndDate("");
        setFile(null);
        loadData();
      } else {
        alert(`Gagal: ${json.message || "Gagal mengirim izin"}`);
      }
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.href = '/login';
    }
  };

  const notifications: NotificationItem[] = announcements.map((a) => {
    const id = `anc-${a.id}`;
    return {
      id,
      title: `📢 ${a.title}`,
      message: `${a.content} (Oleh: ${a.author || "Admin"})`,
      timestamp: a.createdAt,
      read: readIds.includes(id),
      type: "SYSTEM" as const,
      targetRoles: ["PARENT" as const],
    };
  });

  const markRead = (id: string) =>
    setReadIds((p) => {
      const n = p.includes(id) ? p : [...p, id];
      try { localStorage.setItem(READ_KEY, JSON.stringify(n)); } catch {}
      return n;
    });

  const markAll = () => {
    const n = Array.from(new Set([...readIds, ...notifications.map((x) => x.id)]));
    setReadIds(n);
    try { localStorage.setItem(READ_KEY, JSON.stringify(n)); } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans antialiased pb-24">
      {/* Header Utama (Notifikasi saja, Kunci & Logout disembunyikan) */}
      <Header
        currentRole="PARENT"
        hideAccountActions={true}
        notifications={notifications}
        onMarkNotificationRead={markRead}
        onMarkAllNotificationsRead={markAll}
      />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Banner Pengumuman Floating */}
        <AnnouncementBanner role="PARENT" targetRole="PARENT" />

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-20">Memuat data orang tua...</p>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-600">
            {error}
          </div>
        ) : !activeStudent ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-600">
            Belum ada data anak yang terhubung dengan akun Anda.
          </div>
        ) : (
          <>
            {/* Banner Profil Anak */}
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-xl font-bold uppercase shrink-0 border border-white/20">
                    {activeStudent.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider block">Wali Dari Siswa</span>
                    <h2 className="text-lg font-black leading-tight">{activeStudent.name}</h2>
                    <p className="text-xs text-indigo-100 mt-0.5">NISN: {activeStudent.nisn || "-"} • Kelas: {activeStudent.className || "-"}</p>
                  </div>
                </div>

                {children.length > 1 && (
                  <div className="relative">
                    <select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="appearance-none bg-white/20 border border-white/30 text-white text-xs font-bold rounded-xl pl-3 pr-7 py-1.5 outline-none cursor-pointer"
                    >
                      {children.map((c) => (
                        <option key={c.id} value={c.id} className="text-gray-800">{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-white absolute right-2 top-2.5 pointer-events-none" />
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-indigo-100 font-medium">Status Hari Ini:</span>
                {todayRecord ? (
                  <span className={`px-3 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5 ${STATUS_STYLE[todayRecord.status]}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {todayRecord.status}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full font-bold text-[11px] bg-white/20 text-white flex items-center gap-1.5 backdrop-blur">
                    <Clock className="w-3.5 h-3.5" /> Belum Presensi
                  </span>
                )}
              </div>
            </div>

            {/* TAB 1: PRESENSI */}
            {activeTab === "ATTENDANCE" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-sm text-gray-800">Rekap Kehadiran</h3>
                    <div className="flex bg-gray-100 rounded-xl p-1 text-xs font-bold">
                      {(["MONTH", "ALL"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-3 py-1 rounded-lg ${period === p ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}
                        >
                          {p === "MONTH" ? "Bulan ini" : "Semua"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <Stat label="Hadir" value={counts.hadir} cls="bg-emerald-50 text-emerald-700" />
                    <Stat label="Terlambat" value={counts.terlambat} cls="bg-orange-50 text-orange-700" />
                    <Stat label="Izin/Sakit" value={counts.izinSakit} cls="bg-amber-50 text-amber-700" />
                    <Stat label="Alpa" value={counts.alpa} cls="bg-rose-50 text-rose-700" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" /> Riwayat Kehadiran Harian
                  </h3>
                  {!activeStudent.attendance || activeStudent.attendance.length === 0 ? (
                    <p className="text-xs text-gray-400 py-8 text-center">Belum ada riwayat presensi tercatat.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {activeStudent.attendance.slice(0, 15).map((a) => (
                        <li key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">{fmtDate(a.date)}</p>
                            {a.note && <p className="text-[11px] text-gray-400 mt-0.5">{a.note}</p>}
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${STATUS_STYLE[a.status]}`}>
                            {a.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: AJUKAN IZIN */}
            {activeTab === "LEAVE" && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" /> Form Pengajuan Izin / Sakit
                  </h3>
                  <form onSubmit={handleLeaveSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="text-gray-700 font-semibold mb-1 block">Jenis Permohonan</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setLeaveType("SAKIT")}
                          className={`py-2 rounded-xl font-bold border transition ${
                            leaveType === "SAKIT" ? "bg-amber-500 text-white border-amber-500" : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          Sakit
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeaveType("IZIN")}
                          className={`py-2 rounded-xl font-bold border transition ${
                            leaveType === "IZIN" ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          Izin
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-gray-700 font-semibold mb-1 block">Dari Tanggal</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="text-gray-700 font-semibold mb-1 block">Sampai Tanggal</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          required
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-700 font-semibold mb-1 block">Alasan *</label>
                      <textarea
                        rows={3}
                        placeholder="Tuliskan alasan tidak hadir..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="text-gray-700 font-semibold mb-1 block">Lampiran Bukti (Foto Surat Dokter / Keterangan)</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" /> {isSubmitting ? "Mengirimkan..." : "Kirim Permohonan Izin"}
                    </button>
                  </form>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-gray-800">Status Permohonan Izin</h3>
                  {!activeStudent.leaves || activeStudent.leaves.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">Belum ada permohonan izin diajukan.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {activeStudent.leaves.map((l) => (
                        <li key={l.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {l.type === "SAKIT" ? "Sakit" : "Izin"} • {fmtDate(l.startDate)}
                              {l.startDate !== l.endDate ? ` s/d ${fmtDate(l.endDate)}` : ""}
                            </p>
                            <p className="text-gray-400 text-[11px] mt-0.5 truncate max-w-xs">{l.reason}</p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                              l.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : l.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {LEAVE_LABEL[l.status]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PENGUMUMAN (Arsip Histori) */}
            {activeTab === "ANNOUNCEMENT" && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-gray-800 mb-2">Pengumuman Sekolah</h3>
                {announcements.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-xs text-gray-400">
                    Belum ada pengumuman resmi dari sekolah.
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600">📢 {a.title}</span>
                        <span className="text-[10px] text-gray-400">{fmtDate(a.createdAt?.slice(0, 10) || today)}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{a.content}</p>
                      <p className="text-[10px] text-gray-400 pt-1">Oleh: {a.author || "Admin Sekolah"}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: AKUN WALI (Kartu Profil Wali + Opsi Pengaturan) */}
            {activeTab === "ACCOUNT" && (
              <div className="space-y-4">
                {/* Card Informasi Profil Wali */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg">
                      {parentUser?.name ? parentUser.name.charAt(0).toUpperCase() : "W"}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">{parentUser?.name || "Wali Murid"}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{parentUser?.email || "Akun Terverifikasi"}</p>
                    </div>
                  </div>

                  {/* Detail Info Ringkas Wali */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-gray-400 text-[10px] block font-semibold">Peran Akun</span>
                      <span className="font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Wali / Orang Tua
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-gray-400 text-[10px] block font-semibold">Anak Terhubung</span>
                      <span className="font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" /> {children.length} Siswa
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Pengaturan */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Keamanan & Sesi</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => window.location.href = '/change-password'}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-indigo-600" /> Ganti Kata Sandi
                      </span>
                      <span className="text-slate-400">&rarr;</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-rose-600" /> Keluar dari Akun
                      </span>
                      <span className="text-rose-400">&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR (4 TAB) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 py-2.5 px-4 z-40 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab("ATTENDANCE")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
            activeTab === "ATTENDANCE" ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span>Presensi</span>
        </button>
        <button
          onClick={() => setActiveTab("LEAVE")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
            activeTab === "LEAVE" ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Izin</span>
        </button>
        <button
          onClick={() => setActiveTab("ANNOUNCEMENT")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
            activeTab === "ANNOUNCEMENT" ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <Megaphone className="w-5 h-5" />
          <span>Pengumuman</span>
        </button>
        <button
          onClick={() => setActiveTab("ACCOUNT")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
            activeTab === "ACCOUNT" ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <User className="w-5 h-5" />
          <span>Akun</span>
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className={`rounded-xl py-2.5 ${cls}`}>
      <p className="text-xl font-black leading-none">{value}</p>
      <p className="text-[10px] font-bold mt-1">{label}</p>
    </div>
  );
}