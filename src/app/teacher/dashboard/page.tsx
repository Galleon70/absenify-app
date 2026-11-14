// src/app/teacher/dashboard/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import { TeacherDashboard, type TAttendance, type TClass, type TLeave, type TStudent, type AttStatus } from "@/components/teacher/TeacherDashboard";
import type { NotificationItem } from "@/types";
import { FiClock, FiCheckCircle, FiLogIn, FiLogOut } from "react-icons/fi";
import { UserCheck, QrCode, Megaphone, User, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import AnnouncementBanner from "@/components/AnnouncementBanner";

interface TodayData {
  today: { date: string; time: string };
  me: { 
    name: string; 
    email?: string; 
    nip?: string | null; 
    waliKelasName?: string | null; 
  };
  classes: TClass[];
  students: TStudent[];
  attendance: TAttendance[];
  leaves: (TLeave & { studentName: string; className: string | null; startDate: string; endDate: string })[];
}

interface TeacherAttendanceToday {
  id: string;
  checkIn: string;
  checkOut?: string | null;
  status: string;
}

const READ_KEY = "hadirku:teacher-notif-read";
const loadRead = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || "[]");
  } catch {
    return [];
  }
};

export default function TeacherDashboardPage() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrEnabled, setQrEnabled] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"PRESENSI" | "SCANNER" | "ANNOUNCEMENT" | "ACCOUNT">("PRESENSI");

  // State Absensi Guru Sendiri
  const [myAttendance, setMyAttendance] = useState<TeacherAttendanceToday | null>(null);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);

  // State Pengumuman
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const fetchTeacherAttendance = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/attendance");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMyAttendance(json.data.today);
        }
      }
    } catch (err) {
      console.error("Gagal memuat absensi guru:", err);
    }
  }, []);

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

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/today", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.message || "Gagal memuat data");
      setData(json.data);
      setError("");
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setReadIds(loadRead());
    load();
    fetchTeacherAttendance();
    fetchAnnouncements();
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setQrEnabled(j?.data?.appVariant === "VARIANT_3"))
      .catch(() => {});
  }, [load, fetchTeacherAttendance, fetchAnnouncements]);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        load();
        fetchTeacherAttendance();
        fetchAnnouncements();
      }
    }, 30000);
    return () => window.clearInterval(t);
  }, [load, fetchTeacherAttendance, fetchAnnouncements]);

  const handleTeacherCheck = async (type: "CHECK_IN" | "CHECK_OUT") => {
    setIsSubmittingAttendance(true);
    try {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        alert(json.message);
        fetchTeacherAttendance();
      } else {
        alert(`Gagal: ${json.message || "Terjadi kesalahan"}`);
      }
    } catch {
      alert("Tidak bisa terhubung ke server");
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleSave = async (records: { studentId: string; status: AttStatus; note: string }[]) => {
    if (!data) return { ok: false, message: "Data belum siap" };
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: data.today.date, records }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) await load();
      return { ok: res.ok, message: json.message || "" };
    } catch {
      return { ok: false, message: "Tidak bisa terhubung ke server" };
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

  const notifications: NotificationItem[] = [
    ...announcements.map((a) => {
      const id = `anc-${a.id}`;
      return {
        id,
        title: `📢 ${a.title}`,
        message: `${a.content} (Oleh: ${a.author || 'Admin'})`,
        timestamp: a.createdAt,
        read: readIds.includes(id),
        type: 'SYSTEM' as const,
        targetRoles: ['TEACHER' as const],
      };
    }),
    ...(data?.leaves ?? []).map((l) => {
      const id = `leave-${l.id}`;
      return {
        id,
        title: l.type === "SAKIT" ? "Murid sakit hari ini" : "Murid izin hari ini",
        message: `${l.studentName}${l.className ? ` (${l.className})` : ""}: ${l.reason}`,
        timestamp: l.startDate,
        read: readIds.includes(id),
        type: "LEAVE" as const,
        targetRoles: ["TEACHER" as const],
      };
    }),
  ];

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

  const sortedClasses = data
    ? [...data.classes].sort((a, b) => {
        const mine = (c: TClass) => (c.waliKelas && c.waliKelas.trim().toLowerCase() === data.me.name.trim().toLowerCase() ? 0 : 1);
        return mine(a) - mine(b) || a.name.localeCompare(b.name);
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans antialiased pb-24">
      {/* Header Bersih tanpa tombol Kunci & Logout di Atas */}
      <Header
        currentRole="TEACHER"
        hideAccountActions={true}
        notifications={notifications}
        onMarkNotificationRead={markRead}
        onMarkAllNotificationsRead={markAll}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Banner Pengumuman Floating */}
        <AnnouncementBanner targetRole="TEACHER" />

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-20">Memuat data guru...</p>
        ) : error || !data ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-600">
            {error || "Data tidak tersedia"}
          </div>
        ) : (
          <>
            {/* TAB 1: PRESENSI KELAS & ABSEN MANDIRI GURU */}
            {activeTab === "PRESENSI" && (
              <div className="space-y-4">
                {/* Widget Presensi Mandiri Guru */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <FiClock className="text-indigo-600" /> Presensi Saya Hari Ini
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Absen harian guru (Masuk & Pulang)</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 font-medium block leading-none">Masuk</span>
                          <span className="text-xs font-bold text-slate-800">{myAttendance?.checkIn || "--:--"}</span>
                        </div>
                        {!myAttendance?.checkIn ? (
                          <button
                            onClick={() => handleTeacherCheck("CHECK_IN")}
                            disabled={isSubmittingAttendance}
                            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-2.5 py-1 rounded-lg transition"
                          >
                            <FiLogIn size={12} /> Masuk
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <FiCheckCircle size={11} /> OK
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 font-medium block leading-none">Pulang</span>
                          <span className="text-xs font-bold text-slate-800">{myAttendance?.checkOut || "--:--"}</span>
                        </div>
                        {!myAttendance?.checkOut ? (
                          <button
                            onClick={() => handleTeacherCheck("CHECK_OUT")}
                            disabled={isSubmittingAttendance || !myAttendance?.checkIn}
                            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold px-2.5 py-1 rounded-lg transition"
                          >
                            <FiLogOut size={12} /> Pulang
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <FiCheckCircle size={11} /> OK
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Komponen Presensi Kelas & Input Siswa */}
                <TeacherDashboard
                  todayDate={data.today.date}
                  students={data.students}
                  classes={sortedClasses}
                  attendance={data.attendance}
                  leaves={data.leaves}
                  defaultClassId={sortedClasses[0]?.id}
                  onSave={handleSave}
                  onRefresh={load}
                />
              </div>
            )}

            {/* TAB 2: SCANNER QR (Khusus Mode VARIANT_3) */}
            {activeTab === "SCANNER" && (
              <div className="space-y-4 max-w-md mx-auto py-6 text-center">
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-base text-gray-800">Scanner QR Presensi Siswa</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Gunakan kamera HP Anda untuk memindai QR code milik siswa di gerbang atau kelas.
                  </p>
                  <a
                    href="/scan"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md"
                  >
                    Buka Kamera Scanner
                  </a>
                </div>
              </div>
            )}

            {/* TAB 3: ARSIP PENGUMUMAN */}
            {activeTab === "ANNOUNCEMENT" && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <h3 className="font-bold text-sm text-gray-800 mb-2">Pengumuman Sekolah</h3>
                {announcements.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-xs text-gray-400">
                    Belum ada pengumuman resmi.
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600">📢 {a.title}</span>
                        <span className="text-[10px] text-gray-400">{a.createdAt?.slice(0, 10)}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{a.content}</p>
                      <p className="text-[10px] text-gray-400 pt-1">Oleh: {a.author || "Admin Sekolah"}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: AKUN GURU (Detail Lengkap) */}
            {activeTab === "ACCOUNT" && (
              <div className="space-y-4 max-w-md mx-auto">
                {/* Card Informasi Profil Guru */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg uppercase shrink-0">
                      {data.me.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-800">{data.me.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{data.me.email || "Tenaga Pendidik / Guru"}</p>
                    </div>
                  </div>

                  {/* Grid Rincian Data Guru */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-gray-400 text-[10px] block font-semibold">NIP / NUPTK</span>
                      <span className="font-bold text-gray-800 block mt-0.5">
                        {data.me.nip || "-"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-gray-400 text-[10px] block font-semibold">Status / Jabatan</span>
                      <span className="font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Guru & Wali Kelas
                      </span>
                    </div>

                    <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-gray-400 text-[10px] block font-semibold">Wali Kelas Dari</span>
                      <span className="font-bold text-gray-800 block mt-0.5">
                        {data.me.waliKelasName ? `Kelas ${data.me.waliKelasName}` : "Bukan Wali Kelas (Guru Mapel)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tombol Keamanan & Sesi */}
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

      {/* FIXED BOTTOM NAVIGATION BAR KHUSUS HP (GURU) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 py-2.5 px-4 z-40 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab("PRESENSI")}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
            activeTab === "PRESENSI" ? "text-indigo-600" : "text-gray-400"
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span>Presensi</span>
        </button>

        {qrEnabled && (
          <button
            onClick={() => setActiveTab("SCANNER")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition ${
              activeTab === "SCANNER" ? "text-indigo-600" : "text-gray-400"
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span>Scan QR</span>
          </button>
        )}

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