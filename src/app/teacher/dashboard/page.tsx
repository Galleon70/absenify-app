// src/app/teacher/dashboard/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import { TeacherDashboard, type TAttendance, type TClass, type TLeave, type TStudent, type AttStatus } from "@/components/teacher/TeacherDashboard";
import type { NotificationItem } from "@/types";
import { FiClock, FiCheckCircle, FiLogIn, FiLogOut, FiVolume2 } from "react-icons/fi";
import AnnouncementBanner from "@/components/AnnouncementBanner";

interface TodayData {
  today: { date: string; time: string };
  me: { name: string };
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

  // Muat ulang berkala tiap 30 detik
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

  // Handler Absen Masuk & Pulang Guru
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

  // HYBRID NOTIFIKASI: Pengumuman Admin + Notifikasi Izin Murid
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
      try { localStorage.setItem(READ_KEY, JSON.stringify(n)); } catch { /* abaikan */ }
      return n;
    });

  const markAll = () => {
    const n = Array.from(new Set([...readIds, ...notifications.map((x) => x.id)]));
    setReadIds(n);
    try { localStorage.setItem(READ_KEY, JSON.stringify(n)); } catch { /* abaikan */ }
  };

  const sortedClasses = data
    ? [...data.classes].sort((a, b) => {
        const mine = (c: TClass) => (c.waliKelas && c.waliKelas.trim().toLowerCase() === data.me.name.trim().toLowerCase() ? 0 : 1);
        return mine(a) - mine(b) || a.name.localeCompare(b.name);
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans antialiased">
      <Header
        currentRole="TEACHER"
        notifications={notifications}
        onMarkNotificationRead={markRead}
        onMarkAllNotificationsRead={markAll}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* HYBRID BANNER: Pengumuman Terbaru */}
        <AnnouncementBanner targetRole="TEACHER" />
        {/* Widget Presensi Mandiri Guru */}
        <div className="max-w-4xl mx-auto mb-6 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FiClock className="text-indigo-600" /> Presensi Guru Hari Ini
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Catat kehadiran masuk dan pulang harian Anda</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Absen Masuk */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-medium block leading-none">Masuk</span>
                  <span className="text-xs font-bold text-slate-800">{myAttendance?.checkIn || "--:--"}</span>
                </div>
                {!myAttendance?.checkIn ? (
                  <button
                    onClick={() => handleTeacherCheck("CHECK_IN")}
                    disabled={isSubmittingAttendance}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    <FiLogIn size={13} /> Masuk
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <FiCheckCircle size={12} /> Terdeteksi
                  </span>
                )}
              </div>

              {/* Absen Pulang */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-medium block leading-none">Pulang</span>
                  <span className="text-xs font-bold text-slate-800">{myAttendance?.checkOut || "--:--"}</span>
                </div>
                {!myAttendance?.checkOut ? (
                  <button
                    onClick={() => handleTeacherCheck("CHECK_OUT")}
                    disabled={isSubmittingAttendance || !myAttendance?.checkIn}
                    className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    <FiLogOut size={13} /> Pulang
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <FiCheckCircle size={12} /> Terdeteksi
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {qrEnabled && (
          <a
            href="/scan"
            className="max-w-4xl mx-auto mb-4 flex items-center justify-center gap-2 min-h-12 bg-white border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 font-bold rounded-2xl text-sm transition"
          >
            Buka Scanner QR Absensi
          </a>
        )}

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-20">Memuat...</p>
        ) : error || !data ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-600">
            {error || "Data tidak tersedia"}
          </div>
        ) : (
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
        )}
      </main>
    </div>
  );
}