// src/app/student/dashboard/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { CheckCircle2, Clock, Paperclip, QrCode, RefreshCw, X } from "lucide-react";
import Header from "@/components/Header";
import type { NotificationItem } from "@/types";

type Status = "HADIR" | "IZIN" | "SAKIT" | "ALPA" | "TERLAMBAT";

interface MeData {
  student: { name: string; nisn: string | null; className: string | null };
  qrEnabled: boolean;
  attendance: { id: string; date: string; status: Status; note: string | null }[];
  leaves: { id: string; type: "SAKIT" | "IZIN"; startDate: string; endDate: string; reason: string; status: "PENDING" | "APPROVED" | "REJECTED"; requestedBy?: string }[];
}

const READ_KEY = "hadirku:student-notif-read";
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

const STATUS_STYLE: Record<Status, string> = {
  HADIR: "bg-emerald-100 text-emerald-800",
  TERLAMBAT: "bg-orange-100 text-orange-800",
  IZIN: "bg-blue-100 text-blue-800",
  SAKIT: "bg-amber-100 text-amber-800",
  ALPA: "bg-rose-100 text-rose-800",
};

const LEAVE_LABEL = { PENDING: "Menunggu", APPROVED: "Disetujui", REJECTED: "Ditolak" } as const;

export default function StudentDashboardPage() {
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<"MONTH" | "ALL">("MONTH");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

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
      const res = await fetch("/api/student/me");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || "Gagal memuat data");
        return;
      }
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
    fetchAnnouncements();
  }, [load, fetchAnnouncements]);

  // Perbarui data berkala (mis. setelah QR dipindai) selama halaman terlihat
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        load();
        fetchAnnouncements();
      }
    }, 15000);
    return () => window.clearInterval(t);
  }, [load, fetchAnnouncements]);

  const today = todayLocal();
  const todayRecord = data?.attendance.find((a) => a.date === today);

  const counts = useMemo(() => {
    const monthPrefix = today.slice(0, 7);
    const rows = (data?.attendance ?? []).filter((a) => period === "ALL" || a.date.startsWith(monthPrefix));
    const c = { hadir: 0, terlambat: 0, izinSakit: 0, alpa: 0 };
    rows.forEach((a) => {
      if (a.status === "HADIR") c.hadir++;
      else if (a.status === "TERLAMBAT") c.terlambat++;
      else if (a.status === "IZIN" || a.status === "SAKIT") c.izinSakit++;
      else if (a.status === "ALPA") c.alpa++;
    });
    return c;
  }, [data, period, today]);

  // Notifikasi Lonceng 🔔 untuk Murid
  const notifications: NotificationItem[] = [
    ...announcements.map((a) => {
      const id = `anc-${a.id}`;
      return {
        id,
        title: `📢 ${a.title}`,
        message: `${a.content} (Oleh: ${a.author || "Admin"})`,
        timestamp: a.createdAt,
        read: readIds.includes(id),
        type: "SYSTEM" as const,
        targetRoles: ["STUDENT" as const],
      };
    }),
    ...(data?.leaves ?? []).map((l) => {
      const id = `leave-${l.id}`;
      return {
        id,
        title: l.type === "SAKIT" ? "Pengajuan Sakit" : "Pengajuan Izin",
        message: `Status: ${LEAVE_LABEL[l.status]}`,
        timestamp: l.startDate,
        read: readIds.includes(id),
        type: "LEAVE" as const,
        targetRoles: ["STUDENT" as const],
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

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans antialiased">
      {/* Header Murid dengan Lonceng Notifikasi 🔔 */}
      <Header
        currentRole="STUDENT"
        notifications={notifications}
        onMarkNotificationRead={markRead}
        onMarkAllNotificationsRead={markAll}
      />
      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4 pb-10">
        {/* Banner Pengumuman Hybrid */}
        <AnnouncementBanner role="STUDENT" targetRole="STUDENT" />

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-20">Memuat...</p>
        ) : error || !data ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-600">
            {error || "Data tidak tersedia"}
          </div>
        ) : (
          <>
            {/* Identitas */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-5 text-white shadow-md">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">Murid</p>
              <h2 className="text-xl font-black leading-tight">{data.student.name}</h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                NISN: {data.student.nisn || "-"} • Kelas: {data.student.className || "-"}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold">
                {todayRecord ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Hari ini: {todayRecord.status}
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-indigo-200" />
                    Hari ini: belum tercatat
                  </>
                )}
              </div>
            </div>

            {/* QR (Mode 3) */}
            {data.qrEnabled && <QrCard alreadyRecorded={!!todayRecord && (todayRecord.status === "HADIR" || todayRecord.status === "TERLAMBAT")} />}

            {/* Rekap */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-sm">Rekap Kehadiran</h3>
                <div className="flex bg-gray-100 rounded-xl p-1 text-xs font-bold">
                  {(["MONTH", "ALL"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg ${period === p ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}
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

            {/* Riwayat */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-bold text-sm mb-2">Riwayat Terbaru</h3>
              {data.attendance.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Belum ada data kehadiran.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.attendance.slice(0, 20).map((a) => (
                    <li key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800">{fmtDate(a.date)}</p>
                        {a.note && <p className="text-gray-400 truncate">{a.note}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Izin */}
            <LeaveSection leaves={data.leaves} onSubmitted={load} />
          </>
        )}
      </main>
    </div>
  );
}

const MAX_FILE = 3 * 1024 * 1024;

function LeaveSection({ leaves, onSubmitted }: { leaves: MeData["leaves"]; onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"SAKIT" | "IZIN">("SAKIT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!startDate || !endDate || !reason.trim()) return setMsg({ ok: false, text: "Lengkapi tanggal dan alasan." });
    if (endDate < startDate) return setMsg({ ok: false, text: "Tanggal selesai tidak boleh sebelum tanggal mulai." });
    if (file && file.size > MAX_FILE) return setMsg({ ok: false, text: "Ukuran bukti maksimal 3 MB." });
    const fd = new FormData();
    fd.append("type", type);
    fd.append("startDate", startDate);
    fd.append("endDate", endDate);
    fd.append("reason", reason.trim());
    if (file) fd.append("attachment", file);
    setBusy(true);
    try {
      const res = await fetch("/api/leave", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ ok: false, text: json.message || "Gagal mengirim pengajuan." });
      setMsg({ ok: true, text: "Pengajuan terkirim. Menunggu persetujuan admin." });
      setReason(""); setStartDate(""); setEndDate(""); setFile(null);
      onSubmitted();
    } catch {
      setMsg({ ok: false, text: "Tidak bisa terhubung ke server." });
    } finally {
      setBusy(false);
    }
  };

  const inp = "w-full bg-white text-gray-900 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-sm">Izin</h3>
        <button onClick={() => setOpen((v) => !v)} className="px-4 min-h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
          {open ? "Tutup" : "Ajukan Izin"}
        </button>
      </div>
      <p className="text-[11px] text-gray-500">
        Izin bisa diajukan oleh kamu atau orang tua. Pengajuanmu diperiksa admin sekolah dan bisa dilihat orang tua.
      </p>

      {open && (
        <form onSubmit={submit} className="space-y-3 text-xs border border-gray-100 rounded-xl p-3 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-2">
            {(["SAKIT", "IZIN"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} className={`py-2 rounded-xl font-bold border ${type === t ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "border-gray-200 text-gray-500 bg-white"}`}>
                {t === "SAKIT" ? "Sakit" : "Izin"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="font-bold text-gray-700 block mb-1">Dari</label><input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inp} /></div>
            <div><label className="font-bold text-gray-700 block mb-1">Sampai</label><input type="date" required min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inp} /></div>
          </div>
          <div><label className="font-bold text-gray-700 block mb-1">Alasan</label><textarea required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={inp} placeholder="Contoh: Demam, ada surat dokter." /></div>
          <div>
            <label className="font-bold text-gray-700 block mb-1">Bukti <span className="font-normal text-gray-400">(foto atau PDF, opsional)</span></label>
            {file ? (
              <div className="flex items-center justify-between gap-2 border border-indigo-200 bg-indigo-50 rounded-xl px-3 py-2.5">
                <span className="flex items-center gap-2 text-indigo-700 font-semibold min-w-0"><Paperclip className="w-4 h-4 shrink-0" /><span className="truncate">{file.name}</span></span>
                <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
            )}
          </div>
          {msg && <p className={`rounded-xl px-3 py-2 font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{msg.text}</p>}
          <button type="submit" disabled={busy} className="w-full min-h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl">{busy ? "Mengirim..." : "Kirim Pengajuan"}</button>
        </form>
      )}

      {!open && msg?.ok && <p className="rounded-xl px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700">{msg.text}</p>}

      {leaves.length === 0 ? (
        <p className="text-xs text-gray-400 py-3 text-center">Belum ada pengajuan izin.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {leaves.map((l) => (
            <li key={l.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800">
                  {l.type === "SAKIT" ? "Sakit" : "Izin"} • {fmtDate(l.startDate)}
                  {l.startDate !== l.endDate ? ` s/d ${fmtDate(l.endDate)}` : ""}
                </p>
                <p className="text-gray-400 truncate">
                  {l.requestedBy === "STUDENT" ? "Diajukan olehmu" : "Diajukan orang tua"} • {l.reason}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${l.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : l.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                {LEAVE_LABEL[l.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
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

/* QR pribadi yang berganti otomatis (anti titip absen). Dipindai oleh petugas. */
function QrCard({ alreadyRecorded }: { alreadyRecorded: boolean }) {
  const [img, setImg] = useState("");
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [left, setLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/student/qr", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.message || "Gagal memuat QR");
        return 45;
      }
      setToken(json.data.token);
      setImg(await QRCode.toDataURL(json.data.token, { margin: 1, width: 320, errorCorrectionLevel: "M" }));
      setErr("");
      setLeft(json.data.refreshInSeconds);
      return json.data.refreshInSeconds as number;
    } catch {
      setErr("Tidak bisa terhubung ke server");
      return 45;
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = window.setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          refresh();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [refresh]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center space-y-3">
      <div className="flex items-center justify-center gap-2 text-sm font-bold">
        <QrCode className="w-4 h-4 text-indigo-600" /> QR Absensi Saya
      </div>
      <p className="text-xs text-gray-500">Tunjukkan layar ini ke petugas di gerbang atau kelas.</p>

      {err ? (
        <div className="py-10 text-xs text-rose-600 font-semibold">{err}</div>
      ) : img ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="QR absensi" className={`w-64 h-64 max-w-full rounded-xl border border-gray-100 ${alreadyRecorded ? "opacity-30" : ""}`} />
          {alreadyRecorded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-emerald-700 font-black">
              <CheckCircle2 className="w-12 h-12" />
              <span>Sudah tercatat</span>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-xs text-gray-400">Membuat QR...</div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <RefreshCw className="w-3 h-3" /> QR berganti otomatis ({left} dtk). Screenshot tidak akan berlaku.
      </p>

      {process.env.NODE_ENV !== "production" && token && (
        <button
          onClick={async () => {
            await navigator.clipboard?.writeText(token).catch(() => {});
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          className="text-[11px] font-semibold text-indigo-600 underline"
        >
          {copied ? "Tersalin" : "Salin kode (khusus uji coba)"}
        </button>
      )}
    </div>
  );
}