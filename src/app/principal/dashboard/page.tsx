// src/app/principal/dashboard/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import type { NotificationItem } from "@/types";
import { Users, UserCheck, FileText, TrendingUp, Calendar, AlertTriangle } from "lucide-react";

interface Overview {
  today: { date: string; time: string };
  totals: { students: number; classes: number };
  todayCounts: { HADIR: number; TERLAMBAT: number; IZIN: number; SAKIT: number; ALPA: number; belum: number; recorded: number };
  byClass: { id: string; name: string; total: number; present: number; recorded: number }[];
  trend: { date: string; recorded: number; percent: number | null }[];
  attention: { studentId: string; name: string; className: string | null; alpaCount: number }[];
  alpaThreshold: number;
  pendingLeaves: number;
}

const READ_KEY = "hadirku:principal-notif-read";
const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const dayName = (d: string) => HARI[new Date(`${d}T12:00:00`).getDay()];

export default function PrincipalDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readIds, setReadIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/principal/overview", { cache: "no-store" });
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
    try {
      setReadIds(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
    } catch { /* abaikan */ }
    load();
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 60000);
    return () => window.clearInterval(t);
  }, [load]);

  // Notifikasi kepala sekolah: murid yang sering Alpa dan izin yang menunggu persetujuan
  const notifications: NotificationItem[] = [];
  data?.attention.forEach((a) => {
    const id = `alpa-${a.studentId}-${a.alpaCount}`;
    notifications.push({
      id,
      title: "Murid perlu perhatian",
      message: `${a.name}${a.className ? ` (${a.className})` : ""} Alpa ${a.alpaCount} kali dalam 30 hari terakhir.`,
      timestamp: data.today.date,
      read: readIds.includes(id),
      type: "ATTENDANCE" as const,
      targetRoles: ["PRINCIPAL" as const],
    });
  });
  if (data && data.pendingLeaves > 0) {
    const id = `pending-${data.pendingLeaves}`;
    notifications.push({
      id,
      title: "Izin menunggu persetujuan",
      message: `${data.pendingLeaves} pengajuan izin belum diproses admin.`,
      timestamp: data.today.date,
      read: readIds.includes(id),
      type: "LEAVE" as const,
      targetRoles: ["PRINCIPAL" as const],
    });
  }
  const save = (n: string[]) => {
    setReadIds(n);
    try { localStorage.setItem(READ_KEY, JSON.stringify(n)); } catch { /* abaikan */ }
  };
  const markRead = (id: string) => save(readIds.includes(id) ? readIds : [...readIds, id]);
  const markAll = () => save(Array.from(new Set([...readIds, ...notifications.map((n) => n.id)])));

  const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const present = data ? data.todayCounts.HADIR + data.todayCounts.TERLAMBAT : 0;
  const total = data?.totals.students ?? 0;
  const pct = data && total > 0 && data.todayCounts.recorded > 0 ? Math.min(100, Math.round((present / total) * 100)) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans antialiased">
      <Header currentRole="PRINCIPAL" notifications={notifications} onMarkNotificationRead={markRead} onMarkAllNotificationsRead={markAll} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">Dashboard Kepsek</span>
              <h2 className="text-lg font-black text-gray-900 mt-1">Ringkasan Presensi Sekolah</h2>
              <p className="text-xs text-gray-500">Pantau statistik kehadiran dan perizinan sekolah. Diperbarui otomatis.</p>
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200/80 px-3 py-1.5 rounded-xl text-gray-700 text-xs font-bold transition-all duration-200 hover:bg-gray-100">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{todayStr}</span>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-20">Memuat...</p>
          ) : error || !data ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-600 shadow-sm">{error || "Data tidak tersedia"}</div>
          ) : data.totals.students === 0 && data.totals.classes === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center space-y-1 shadow-sm">
              <p className="font-bold text-gray-900">Belum ada data</p>
              <p className="text-xs text-gray-500">Admin sekolah perlu menambahkan kelas dan siswa. Ringkasan akan muncul otomatis.</p>
            </div>
          ) : (
            <>
              {/* Statistik */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card icon={<Users className="w-4 h-4 text-blue-600" />} label="Total Siswa" value={`${total} Siswa`} sub="Siswa aktif" />
                <Card
                  icon={<UserCheck className="w-4 h-4 text-emerald-600" />}
                  label="Kehadiran Hari Ini"
                  value={pct === null ? "-" : `${pct}%`}
                  valueCls="text-emerald-600"
                  sub={pct === null ? "Belum ada absensi hari ini" : `${present} dari ${total} siswa hadir`}
                />
                <Card
                  icon={<FileText className="w-4 h-4 text-amber-600" />}
                  label="Izin & Sakit"
                  value={String(data.todayCounts.IZIN + data.todayCounts.SAKIT)}
                  valueCls="text-amber-600"
                  sub={data.pendingLeaves > 0 ? `${data.pendingLeaves} pengajuan menunggu` : "Hari ini"}
                />
                <Card icon={<TrendingUp className="w-4 h-4 text-purple-600" />} label="Total Kelas" value={`${data.totals.classes} Kelas`} sub="Terdaftar" />
              </div>

              {/* Rincian hari ini */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  ["Hadir", data.todayCounts.HADIR, "bg-emerald-50 text-emerald-700"],
                  ["Terlambat", data.todayCounts.TERLAMBAT, "bg-orange-50 text-orange-700"],
                  ["Izin", data.todayCounts.IZIN, "bg-blue-50 text-blue-700"],
                  ["Sakit", data.todayCounts.SAKIT, "bg-amber-50 text-amber-700"],
                  ["Alpa", data.todayCounts.ALPA, "bg-rose-50 text-rose-700"],
                  ["Belum tercatat", data.todayCounts.belum, "bg-gray-100 text-gray-600"],
                ].map(([label, n, cls]) => (
                  <div key={label as string} className={`rounded-xl py-2 text-center transition-all duration-200 hover:opacity-90 hover:scale-[1.02] shadow-sm ${cls}`}>
                    <p className="text-lg font-black leading-none">{n as number}</p>
                    <p className="text-[10px] font-bold mt-1">{label as string}</p>
                  </div>
                ))}
              </div>

              {/* Perlu perhatian */}
              {data.attention.length > 0 && (
                <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                  <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-bold text-rose-800">
                      Murid perlu perhatian (Alpa {data.alpaThreshold} kali atau lebih, 30 hari terakhir)
                    </h3>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {data.attention.map((a) => (
                      <li key={a.studentId} className="p-3 px-4 flex items-center justify-between text-xs transition-colors duration-150 hover:bg-rose-50/40">
                        <span className="font-bold text-gray-900">
                          {a.name} <span className="font-normal text-gray-400">{a.className ? `• ${a.className}` : ""}</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">{a.alpaCount}x Alpa</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tren 7 hari */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 transition-all duration-200 hover:shadow-md">
                <h3 className="text-xs font-bold text-gray-800 mb-3">Tren Kehadiran 7 Hari Terakhir</h3>
                <div className="flex items-end justify-between gap-2 h-28">
                  {data.trend.map((t) => (
                    <div key={t.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                      <span className="text-[10px] font-bold text-gray-700">{t.percent === null ? "-" : `${t.percent}%`}</span>
                      <div className="w-full bg-gray-100 rounded-md flex-1 flex items-end overflow-hidden transition-all duration-200 hover:bg-gray-200">
                        <div className="w-full bg-indigo-600 rounded-md transition-all duration-300" style={{ height: `${t.percent ?? 0}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400">{dayName(t.date)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Tanda - berarti tidak ada absensi pada hari itu.</p>
              </div>

              {/* Per kelas */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-800">Persentase Kehadiran Per Kelas</h3>
                  <span className="text-[10px] font-bold text-indigo-600">Hari Ini</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {data.byClass.length === 0 ? (
                    <p className="p-6 text-center text-xs text-gray-400">Belum ada kelas.</p>
                  ) : (
                    data.byClass.map((c) => {
                      const p = c.total > 0 && c.recorded > 0 ? Math.min(100, Math.round((c.present / c.total) * 100)) : null;
                      return (
                        <div key={c.id} className="p-4 flex items-center justify-between gap-3 transition-colors duration-150 hover:bg-slate-50/70">
                          <div>
                            <p className="text-xs font-bold text-gray-900">{c.name}</p>
                            <p className="text-[10px] text-gray-400">{c.total} siswa{p === null ? " • belum ada absensi" : ` • ${c.present} hadir`}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 sm:w-36 bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${p ?? 0}%` }} />
                            </div>
                            <span className="text-xs font-black text-gray-800 w-10 text-right">{p === null ? "-" : `${p}%`}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Card({ icon, label, value, sub, valueCls = "text-gray-900" }: { icon: React.ReactNode; label: string; value: string; sub: string; valueCls?: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1 transition-all duration-200 hover:shadow-md hover:border-indigo-100">
      <div className="flex items-center justify-between text-gray-500">
        <span className="text-xs font-semibold">{label}</span>
        {icon}
      </div>
      <p className={`text-xl font-black ${valueCls}`}>{value}</p>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </div>
  );
}