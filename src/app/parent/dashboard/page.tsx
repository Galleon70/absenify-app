// src/app/parent/dashboard/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import type { NotificationItem } from "@/types";
import { FiFileText, FiPlus } from "react-icons/fi";

interface StudentChild {
  id: string;
  name: string;
  nisn: string | null;
  className: string | null;
}

const READ_KEY = "hadirku:parent-notif-read";
const loadRead = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || "[]");
  } catch {
    return [];
  }
};

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<StudentChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

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
      setChildren(json.data || []);
      setError("");
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setReadIds(loadRead());
    loadData();
    fetchAnnouncements();
  }, [loadData, fetchAnnouncements]);

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
      if (file) formData.append("file", file);

      const res = await fetch("/api/leave", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("Permohonan izin berhasil dikirim!");
        setReason("");
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

  const activeStudent = children.length > 0 ? children[0] : null;

  // Notifikasi Lonceng 🔔 (Pengumuman)
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
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans antialiased">
      <Header
        currentRole="PARENT"
        notifications={notifications}
        onMarkNotificationRead={markRead}
        onMarkAllNotificationsRead={markAll}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* BANNER DITARUH DI SINI BISA MENAMPILKAN PENGUMUMAN DENGAN BEBAS TANPA TERHALANG DATA ANAK */}
        <AnnouncementBanner role="PARENT" targetRole="PARENT" />

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-20">Memuat data orang tua...</p>
        ) : error ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-600">
            {error}
          </div>
        ) : !activeStudent ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-600">
            Belum ada data anak yang terhubung dengan akun Anda.
          </div>
        ) : (
          <div>
            {/* Profil Ringkas Anak */}
            <div className="bg-indigo-700 text-white rounded-3xl p-6 shadow-lg mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold uppercase">
                  {activeStudent.name.charAt(0)}
                </div>
                <div>
                  <span className="text-xs text-indigo-200 font-semibold uppercase tracking-wider block">Wali Dari Siswa</span>
                  <h2 className="text-xl font-bold">{activeStudent.name}</h2>
                  <p className="text-xs text-indigo-200 mt-0.5">NISN: {activeStudent.nisn || "-"} • Kelas: {activeStudent.className || "-"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Pengajuan Izin / Sakit */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FiFileText className="text-indigo-600" /> Form Pengajuan Izin
                </h3>
                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Jenis Permohonan</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLeaveType("SAKIT")}
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          leaveType === "SAKIT" ? "bg-amber-500 text-white border-amber-500" : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        Sakit
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeaveType("IZIN")}
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          leaveType === "IZIN" ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        Izin
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Dari Tanggal</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Sampai Tanggal</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Alasan *</label>
                    <textarea
                      rows={3}
                      placeholder="Tuliskan alasan tidak hadir..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Lampiran Bukti (Foto Surat Dokter / Keterangan)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <FiPlus /> {isSubmitting ? "Kirimkan..." : "Kirim Permohonan Izin"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}