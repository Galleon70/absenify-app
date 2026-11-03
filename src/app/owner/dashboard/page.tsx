// src/app/owner/dashboard/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  LogOut,
  Plus,
  Search,
  School as SchoolIcon,
  Users,
  GraduationCap,
  X,
  RotateCcw,
  Wallet,
  AlertTriangle,
  History,
  CheckCircle2,
} from "lucide-react";

type Variant = "VARIANT_1" | "VARIANT_2" | "VARIANT_3";
type BillingStatus = "NONE" | "OK" | "DUE_SOON" | "OVERDUE";

interface SchoolRow {
  id: string;
  name: string;
  appVariant: Variant;
  isActive: boolean;
  createdAt: string;
  contactName: string | null;
  contactPhone: string | null;
  pricePerMonth: number | null;
  paidUntil: string | null;
  notes: string | null;
  lateAfter: string | null;
  totalStudents: number;
  totalUsers: number;
  adminEmail: string | null;
  adminName: string | null;
  lastActivity: string | null;
  billingStatus: BillingStatus;
  daysLeft: number | null;
}

interface Payment {
  id: string;
  amount: number;
  months: number;
  paidAt: string;
  note: string | null;
}

interface ActivityRow {
  id: string;
  actorName: string | null;
  action: string;
  targetSchoolId: string | null;
  targetName: string | null;
  detail: string | null;
  createdAt: string;
}

const MODE_LABEL: Record<Variant, string> = {
  VARIANT_1: "Mode 1 (4 role)",
  VARIANT_2: "Mode 2 (+ murid lihat rekap)",
  VARIANT_3: "Mode 3 (+ murid absen/QR)",
};

const ACTION_LABEL: Record<string, string> = {
  SCHOOL_CREATED: "Sekolah dibuat",
  SCHOOL_UPDATED: "Data sekolah diubah",
  SCHOOL_ACTIVATED: "Sekolah diaktifkan",
  SCHOOL_DEACTIVATED: "Sekolah dinonaktifkan",
  ADMIN_PASSWORD_RESET: "Password admin direset",
  PAYMENT_RECORDED: "Pembayaran dicatat",
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

const todayIso = () => new Date().toISOString().split("T")[0];

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return fmtDate(iso);
}

function BillingBadge({ s }: { s: SchoolRow }) {
  const base = "px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap";
  if (s.billingStatus === "NONE") return <span className={`${base} bg-gray-100 text-gray-600`}>Langganan belum diatur</span>;
  if (s.billingStatus === "OVERDUE")
    return <span className={`${base} bg-rose-100 text-rose-800`}>Lewat {Math.abs(s.daysLeft ?? 0)} hari</span>;
  if (s.billingStatus === "DUE_SOON")
    return (
      <span className={`${base} bg-amber-100 text-amber-800`}>
        {s.daysLeft === 0 ? "Berakhir hari ini" : `Berakhir ${s.daysLeft} hari lagi`}
      </span>
    );
  return <span className={`${base} bg-emerald-100 text-emerald-800`}>Aktif s/d {fmtDate(s.paidUntil)}</span>;
}

const inputCls =
  "w-full bg-white text-gray-900 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-gray-400";
const labelCls = "font-bold text-gray-700 block mb-1 text-xs";

export default function OwnerDashboardPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "ATTENTION">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [rs, ra] = await Promise.all([fetch("/api/owner/schools"), fetch("/api/owner/activity?limit=10")]);
      if (rs.ok) setSchools((await rs.json()).data ?? []);
      if (ra.ok) setActivity((await ra.json()).data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  const stats = useMemo(() => {
    const active = schools.filter((s) => s.isActive);
    const attention = active.filter((s) => s.billingStatus === "OVERDUE" || s.billingStatus === "DUE_SOON");
    return {
      total: schools.length,
      active: active.length,
      inactive: schools.length - active.length,
      students: schools.reduce((a, s) => a + s.totalStudents, 0),
      users: schools.reduce((a, s) => a + s.totalUsers, 0),
      mrr: active.reduce((a, s) => a + (s.pricePerMonth ?? 0), 0),
      priced: active.filter((s) => s.pricePerMonth).length,
      attention: attention.length,
    };
  }, [schools]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schools.filter((s) => {
      if (filter === "ACTIVE" && !s.isActive) return false;
      if (filter === "INACTIVE" && s.isActive) return false;
      if (filter === "ATTENTION" && !(s.isActive && (s.billingStatus === "OVERDUE" || s.billingStatus === "DUE_SOON")))
        return false;
      if (!q) return true;
      return [s.name, s.adminEmail, s.adminName, s.contactName].some((v) => v?.toLowerCase().includes(q));
    });
  }, [schools, search, filter]);

  const selected = schools.find((s) => s.id === selectedId) || null;

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: "ALL", label: "Semua" },
    { key: "ACTIVE", label: "Aktif" },
    { key: "INACTIVE", label: "Nonaktif" },
    { key: "ATTENTION", label: "Perlu perhatian" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      <header className="bg-[#4F46E5] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-base font-black leading-tight">Panel Owner</h1>
            <p className="text-xs text-indigo-200">Kelola sekolah klien dan langganan</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => (window.location.href = "/change-password")} title="Ganti Password" className="p-2 hover:bg-white/10 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} title="Keluar" className="p-2 hover:bg-white/10 rounded-xl">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {notice && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 relative">
            <button onClick={() => setNotice("")} className="absolute top-3 right-3 text-emerald-700" title="Tutup">
              <X className="w-4 h-4" />
            </button>
            <pre className="whitespace-pre-wrap text-sm text-emerald-900 font-sans pr-6">{notice}</pre>
          </div>
        )}

        {/* Ringkasan */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<SchoolIcon className="w-5 h-5" />} label="Sekolah" value={String(stats.total)} sub={`${stats.active} aktif • ${stats.inactive} nonaktif`} />
          <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Siswa terkelola" value={stats.students.toLocaleString("id-ID")} sub={`${stats.users.toLocaleString("id-ID")} pengguna`} />
          <StatCard
            icon={<Wallet className="w-5 h-5" />}
            label="Perkiraan pendapatan / bulan"
            value={rupiah(stats.mrr)}
            sub={stats.priced > 0 ? `dari ${stats.priced} sekolah aktif berharga` : "isi harga di tiap sekolah"}
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Perlu perhatian"
            value={String(stats.attention)}
            sub="jatuh tempo / segera berakhir"
            tone={stats.attention > 0 ? "warn" : "default"}
            onClick={() => setFilter("ATTENTION")}
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari sekolah, admin, kontak..."
              className={`${inputCls} pl-9`}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-white border border-gray-200 rounded-xl p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    filter === f.key ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-indigo-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="min-h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4" /> Tambah Sekolah
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 items-start">
          {/* Daftar sekolah */}
          <div className="lg:col-span-2 space-y-3">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-16">Memuat...</p>
            ) : visible.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center space-y-2">
                <SchoolIcon className="w-10 h-10 text-indigo-300 mx-auto" />
                <p className="font-bold">{schools.length === 0 ? "Belum ada sekolah" : "Tidak ada sekolah yang cocok"}</p>
                <p className="text-xs text-gray-500">
                  {schools.length === 0 ? 'Klik "Tambah Sekolah" untuk membuat sekolah klien pertama.' : "Ubah kata pencarian atau filter."}
                </p>
              </div>
            ) : (
              visible.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 leading-tight truncate">{s.name}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {MODE_LABEL[s.appVariant]}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {!s.isActive && <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800">Nonaktif</span>}
                      <BillingBadge s={s} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <Metric label="Siswa" value={String(s.totalStudents)} />
                    <Metric label="Pengguna" value={String(s.totalUsers)} />
                    <Metric label="Harga / bulan" value={s.pricePerMonth ? rupiah(s.pricePerMonth) : "-"} />
                    <Metric label="Absensi terakhir" value={s.lastActivity ? fmtDate(s.lastActivity) : "belum ada"} />
                  </div>

                  <p className="text-xs text-gray-500 truncate">
                    Admin: {s.adminName || "-"} ({s.adminEmail || "-"})
                    {s.contactName ? ` • Kontak: ${s.contactName}${s.contactPhone ? ` ${s.contactPhone}` : ""}` : ""}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Aktivitas terbaru */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-indigo-600" /> Aktivitas terbaru
            </h3>
            <ActivityList items={activity} showSchool />
          </div>
        </div>
      </main>

      {showForm && (
        <AddSchoolModal
          onClose={() => setShowForm(false)}
          onCreated={(msg) => {
            setNotice(msg);
            setShowForm(false);
            load();
          }}
        />
      )}

      {selected && (
        <SchoolDrawer
          key={selected.id}
          school={selected}
          onClose={() => setSelectedId(null)}
          onChanged={load}
          setNotice={setNotice}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "default",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "warn";
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`text-left bg-white rounded-2xl border shadow-sm p-4 ${
        tone === "warn" ? "border-amber-300 bg-amber-50/40" : "border-gray-100"
      } ${onClick ? "hover:border-indigo-300 transition" : ""}`}
    >
      <div className={`flex items-center gap-2 text-xs font-bold ${tone === "warn" ? "text-amber-700" : "text-indigo-600"}`}>
        {icon} {label}
      </div>
      <p className="text-xl font-black mt-2 leading-tight break-words">{value}</p>
      <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
    </Tag>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2">
      <p className="text-[10px] text-gray-500 font-semibold">{label}</p>
      <p className="font-bold text-gray-900 truncate">{value}</p>
    </div>
  );
}

function ActivityList({ items, showSchool }: { items: ActivityRow[]; showSchool?: boolean }) {
  if (items.length === 0) return <p className="text-xs text-gray-400 py-4 text-center">Belum ada aktivitas.</p>;
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id} className="text-xs border-l-2 border-indigo-200 pl-3">
          <p className="font-bold text-gray-800">{ACTION_LABEL[a.action] || a.action}</p>
          {(showSchool && a.targetName) || a.detail ? (
            <p className="text-gray-500">
              {showSchool && a.targetName ? a.targetName : ""}
              {showSchool && a.targetName && a.detail ? " • " : ""}
              {a.detail || ""}
            </p>
          ) : null}
          <p className="text-[10px] text-gray-400 mt-0.5">
            {timeAgo(a.createdAt)}
            {a.actorName ? ` • ${a.actorName}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Tambah sekolah ------------------------------ */

function AddSchoolModal({ onClose, onCreated }: { onClose: () => void; onCreated: (msg: string) => void }) {
  const [form, setForm] = useState({
    name: "",
    adminName: "",
    adminEmail: "",
    contactName: "",
    contactPhone: "",
    pricePerMonth: "",
    appVariant: "VARIANT_1" as Variant,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/owner/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.message || "Gagal membuat sekolah");
      onCreated(json.message);
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form onSubmit={submit} className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto text-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Tambah Sekolah Baru</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={labelCls}>Nama sekolah</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="SMA Negeri 1 Contoh" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nama admin sekolah</label>
              <input required value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email admin sekolah</label>
              <input required type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className={inputCls} placeholder="admin@sekolah.sch.id" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 -mt-1">Email dipakai untuk login dan harus belum terdaftar di sekolah lain.</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kontak klien (opsional)</label>
              <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} placeholder="Nama" />
            </div>
            <div>
              <label className={labelCls}>No. HP kontak</label>
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Harga langganan per bulan (Rp, opsional)</label>
            <input type="number" min={0} step={1000} value={form.pricePerMonth} onChange={(e) => setForm({ ...form, pricePerMonth: e.target.value })} className={inputCls} placeholder="300000" />
          </div>
          <div>
            <label className={labelCls}>Mode</label>
            <select value={form.appVariant} onChange={(e) => setForm({ ...form, appVariant: e.target.value as Variant })} className={inputCls}>
              <option value="VARIANT_1">Mode 1: 4 role (guru, orang tua, admin, kepala sekolah)</option>
              <option value="VARIANT_2">Mode 2: + murid lihat rekap (sekolah tanpa HP)</option>
              <option value="VARIANT_3">Mode 3: + murid absen lewat QR (sekolah boleh bawa HP)</option>
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Bisa diubah kapan saja dari panel sekolah.</p>
          </div>
        </div>

        {error && <p className="rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold px-3 py-2">{error}</p>}

        <button type="submit" disabled={saving} className="w-full min-h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm">
          {saving ? "Menyimpan..." : "Buat Sekolah"}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------ Detail sekolah ------------------------------ */

function SchoolDrawer({
  school,
  onClose,
  onChanged,
  setNotice,
}: {
  school: SchoolRow;
  onClose: () => void;
  onChanged: () => void;
  setNotice: (m: string) => void;
}) {
  const [tab, setTab] = useState<"info" | "pay" | "log">("info");

  const [form, setForm] = useState({
    name: school.name,
    contactName: school.contactName ?? "",
    contactPhone: school.contactPhone ?? "",
    pricePerMonth: school.pricePerMonth?.toString() ?? "",
    appVariant: school.appVariant,
    notes: school.notes ?? "",
    lateAfter: school.lateAfter ?? "07:15",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [pay, setPay] = useState({ amount: school.pricePerMonth?.toString() ?? "", months: "1", paidAt: todayIso(), note: "" });
  const [paying, setPaying] = useState(false);
  const [manualDate, setManualDate] = useState(school.paidUntil ? school.paidUntil.split("T")[0] : "");

  const [logs, setLogs] = useState<ActivityRow[]>([]);

  useEffect(() => {
    if (tab === "pay") {
      fetch(`/api/owner/schools/${school.id}/payments`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setPayments(j.data ?? []))
        .catch(() => {});
    }
    if (tab === "log") {
      fetch(`/api/owner/activity?schoolId=${school.id}&limit=30`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setLogs(j.data ?? []))
        .catch(() => {});
    }
  }, [tab, school.id, school.paidUntil]);

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/owner/schools/${school.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    return { ok: res.ok, message: (j.message as string) || "" };
  };

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    const body: Record<string, unknown> = {
      name: form.name,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      pricePerMonth: form.pricePerMonth === "" ? null : Number(form.pricePerMonth),
      notes: form.notes,
    };
    if (form.appVariant !== school.appVariant) body.appVariant = form.appVariant;
    if (form.appVariant === "VARIANT_3" && form.lateAfter !== (school.lateAfter ?? "07:15")) body.lateAfter = form.lateAfter;
    const r = await patch(body);
    setSaving(false);
    setMsg({ ok: r.ok, text: r.ok ? "Tersimpan." : r.message || "Gagal menyimpan" });
    if (r.ok) onChanged();
  };

  const toggleActive = async () => {
    const next = !school.isActive;
    const ok = window.confirm(
      next
        ? `Aktifkan kembali "${school.name}"?`
        : `Nonaktifkan "${school.name}"?\n\nSemua pengguna sekolah ini langsung tidak bisa login atau memakai aplikasi sampai diaktifkan lagi. Data tidak dihapus.`
    );
    if (!ok) return;
    const r = await patch({ isActive: next });
    if (!r.ok) return alert(r.message || "Gagal mengubah status");
    onChanged();
  };

  const resetAdmin = async () => {
    if (!window.confirm(`Buat password sementara baru untuk admin "${school.name}"?`)) return;
    const res = await fetch(`/api/owner/schools/${school.id}/reset-admin`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return alert(j.message || "Gagal mereset password admin");
    setNotice(j.message);
    onClose();
    onChanged();
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setPaying(true);
    try {
      const res = await fetch(`/api/owner/schools/${school.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(pay.amount),
          months: Number(pay.months),
          paidAt: pay.paidAt,
          note: pay.note,
        }),
      });
      const j = await res.json().catch(() => ({}));
      setMsg({ ok: res.ok, text: j.message || (res.ok ? "Tercatat." : "Gagal mencatat pembayaran") });
      if (res.ok) {
        setPay({ ...pay, note: "" });
        onChanged();
        const r = await fetch(`/api/owner/schools/${school.id}/payments`);
        if (r.ok) setPayments((await r.json()).data ?? []);
      }
    } finally {
      setPaying(false);
    }
  };

  const saveManualDate = async () => {
    setMsg(null);
    const r = await patch({ paidUntil: manualDate || null });
    setMsg({ ok: r.ok, text: r.ok ? "Masa berlaku disimpan." : r.message || "Gagal menyimpan" });
    if (r.ok) onChanged();
  };

  const TABS: { key: typeof tab; label: string }[] = [
    { key: "info", label: "Ringkasan" },
    { key: "pay", label: "Pembayaran" },
    { key: "log", label: "Aktivitas" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative w-full sm:max-w-lg bg-white shadow-2xl h-full overflow-y-auto text-gray-900">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-black text-lg leading-tight truncate">{school.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    school.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {school.isActive ? "Aktif" : "Nonaktif"}
                </span>
                <BillingBadge s={school} />
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex gap-1 mt-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setMsg(null);
                }}
                className={`px-3 py-2 text-xs font-bold border-b-2 -mb-px ${
                  tab === t.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {msg && (
            <p className={`rounded-xl px-3 py-2 text-xs font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {msg.text}
            </p>
          )}

          {tab === "info" && (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Metric label="Siswa" value={String(school.totalStudents)} />
                <Metric label="Pengguna" value={String(school.totalUsers)} />
                <Metric label="Dibuat" value={fmtDate(school.createdAt)} />
                <Metric label="Absensi terakhir" value={school.lastActivity ? fmtDate(school.lastActivity) : "belum ada"} />
              </div>
              <p className="text-xs text-gray-500">
                Admin: <span className="font-semibold text-gray-800">{school.adminName || "-"}</span> ({school.adminEmail || "-"})
              </p>

              <form onSubmit={saveInfo} className="space-y-3">
                <div>
                  <label className={labelCls}>Nama sekolah</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Kontak klien</label>
                    <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>No. HP</label>
                    <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Harga langganan per bulan (Rp)</label>
                  <input type="number" min={0} step={1000} value={form.pricePerMonth} onChange={(e) => setForm({ ...form, pricePerMonth: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Mode</label>
                  <select value={form.appVariant} onChange={(e) => setForm({ ...form, appVariant: e.target.value as Variant })} className={inputCls}>
                    <option value="VARIANT_1">Mode 1: 4 role</option>
                    <option value="VARIANT_2">Mode 2: + murid lihat rekap</option>
                    <option value="VARIANT_3">Mode 3: + murid absen lewat QR</option>
                  </select>
                  {form.appVariant !== school.appVariant && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      Mengubah mode langsung berlaku untuk semua pengguna sekolah ini. Jika naik ke Mode 2/3, admin sekolah perlu menekan &quot;Buat Akun Murid&quot; di menu Siswa.
                    </p>
                  )}
                </div>
                {form.appVariant === "VARIANT_3" && (
                  <div>
                    <label className={labelCls}>Jam batas terlambat (scan QR)</label>
                    <input type="time" value={form.lateAfter} onChange={(e) => setForm({ ...form, lateAfter: e.target.value })} className={inputCls} />
                    <p className="text-[11px] text-gray-400 mt-1">Scan setelah jam ini dicatat TERLAMBAT. Zona waktu mengikuti pengaturan server (WIB).</p>
                  </div>
                )}
                <div>
                  <label className={labelCls}>Catatan</label>
                  <textarea rows={3} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} placeholder="Mis. kesepakatan harga, jadwal pelatihan..." />
                </div>
                <button type="submit" disabled={saving} className="w-full min-h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm">
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </form>

              <div className="pt-4 border-t border-gray-100 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tindakan</p>
                <button onClick={resetAdmin} className="w-full min-h-10 text-xs font-bold border border-gray-200 hover:bg-gray-50 rounded-xl flex items-center justify-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset password admin
                </button>
                <button
                  onClick={toggleActive}
                  className={`w-full min-h-10 text-xs font-bold rounded-xl border ${
                    school.isActive ? "border-rose-200 text-rose-700 hover:bg-rose-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {school.isActive ? "Nonaktifkan sekolah" : "Aktifkan sekolah"}
                </button>
                {school.isActive && school.billingStatus === "OVERDUE" && (
                  <p className="text-[11px] text-rose-600">Langganan sudah lewat jatuh tempo. Sekolah tidak dinonaktifkan otomatis, putuskan sendiri kapan menonaktifkan.</p>
                )}
              </div>
            </>
          )}

          {tab === "pay" && (
            <>
              <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-1">
                <p className="text-gray-500">Langganan berlaku sampai</p>
                <p className="text-base font-black">{school.paidUntil ? fmtDate(school.paidUntil) : "Belum diatur"}</p>
                <p className="text-gray-500">
                  Harga: {school.pricePerMonth ? `${rupiah(school.pricePerMonth)} / bulan` : "belum diisi"}
                </p>
              </div>

              <form onSubmit={submitPayment} className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Catat pembayaran</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Jumlah dibayar (Rp)</label>
                    <input required type="number" min={0} step={1000} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Untuk berapa bulan</label>
                    <select value={pay.months} onChange={(e) => setPay({ ...pay, months: e.target.value })} className={inputCls}>
                      {[1, 2, 3, 6, 12].map((m) => (
                        <option key={m} value={m}>{m} bulan</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tanggal bayar</label>
                    <input type="date" value={pay.paidAt} onChange={(e) => setPay({ ...pay, paidAt: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Catatan</label>
                    <input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} className={inputCls} placeholder="Transfer BCA" />
                  </div>
                </div>
                <button type="submit" disabled={paying} className="w-full min-h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {paying ? "Menyimpan..." : "Catat & Perpanjang Langganan"}
                </button>
                <p className="text-[11px] text-gray-400">Masa berlaku bertambah sesuai jumlah bulan, dihitung dari tanggal berlaku saat ini (atau dari hari ini kalau sudah lewat).</p>
              </form>

              <details className="pt-4 border-t border-gray-100 group">
                <summary className="text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer select-none">
                  Lanjutan: percobaan gratis / koreksi tanggal
                </summary>
                <div className="space-y-2 mt-3">
                  <p className="text-xs font-bold text-gray-700">Atur tanggal berlaku manual</p>
                  <div className="flex gap-2">
                    <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className={inputCls} />
                    <button type="button" onClick={saveManualDate} className="px-4 text-xs font-bold border border-gray-200 hover:bg-gray-50 rounded-xl whitespace-nowrap">Simpan</button>
                  </div>
                  <p className="text-[11px] text-gray-400">Untuk masa percobaan gratis atau koreksi. Kosongkan lalu simpan untuk menghapus tanggal.</p>
                </div>
              </details>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Riwayat pembayaran</p>
                {payments.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3">Belum ada pembayaran tercatat.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {payments.map((p) => (
                      <li key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800">{rupiah(p.amount)} <span className="font-normal text-gray-500">• {p.months} bulan</span></p>
                          <p className="text-gray-400 truncate">{p.note || "-"}</p>
                        </div>
                        <span className="text-gray-500 shrink-0">{fmtDate(p.paidAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {tab === "log" && <ActivityList items={logs} />}
        </div>
      </aside>
    </div>
  );
}
