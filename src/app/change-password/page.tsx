// src/app/change-password/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { KeyRound, Loader2, ArrowLeft, Eye, EyeOff, LogOut } from "lucide-react";

const HOME: Record<string, string> = {
  OWNER: "/owner/dashboard",
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
  PRINCIPAL: "/principal/dashboard",
};

// Kolom password dengan tombol mata (tampilkan / sembunyikan).
// Warna teks ditentukan eksplisit karena warna bawaan aplikasi putih (tema gelap global).
function PasswordInput({
  value,
  onChange,
  autoComplete,
  name,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  name?: string;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  // Fokus ke kolom ini begitu autoFocus menjadi true (mis. setelah password sementara terisi otomatis)
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        required
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white text-gray-900 border border-gray-200 rounded-xl p-2.5 pr-11 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none [&::-ms-reveal]:hidden"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        title={visible ? "Sembunyikan password" : "Tampilkan password"}
        className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-indigo-600"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function ChangePasswordPage() {
  const [role, setRole] = useState("");
  const [forced, setForced] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [meFailed, setMeFailed] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  // Password sementara dari halaman login terisi otomatis (hanya sekali, langsung dihapus)
  useEffect(() => {
    try {
      const t = sessionStorage.getItem("hk_temp_pw");
      if (t) {
        setCurrent(t);
        setPrefilled(true);
        sessionStorage.removeItem("hk_temp_pw");
      }
    } catch {
      /* abaikan */
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data) {
          setRole(j.data.role);
          setForced(j.data.mustChangePassword);
          setIdentifier(j.data.identifier || "");
        } else {
          setMeFailed(true);
        }
      })
      .catch(() => setMeFailed(true));
  }, []);

  const home = HOME[role] || "/";

  // Keluar dari akun: selalu tersedia, supaya tidak pernah terjebak di halaman ini
  const handleLogout = async () => {
    try {
      try {
        sessionStorage.removeItem("hk_temp_pw");
      } catch {
        /* abaikan */
      }
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) return setError("Konfirmasi password baru tidak sama.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || "Gagal mengganti password.");
        return;
      }
      window.location.href = HOME[json.role] || "/";
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Ganti Password</h1>
            <p className="text-xs text-gray-500">
              {forced
                ? "Password Anda masih sementara. Buat password baru untuk melanjutkan."
                : "Gunakan password yang sulit ditebak."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Nama pengguna (tersembunyi) agar pengelola password browser tahu akun mana yang diperbarui */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={identifier}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          <div>
            <label className="font-bold text-gray-700 block mb-1">
              {forced ? "Password sementara" : "Password saat ini"}
            </label>
            <PasswordInput name="current-password" value={current} onChange={setCurrent} autoComplete="current-password" />
            {prefilled && (
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold">Terisi otomatis dari login Anda. Tinggal buat password baru.</p>
            )}
          </div>
          <div>
            <label className="font-bold text-gray-700 block mb-1">Password baru</label>
            <PasswordInput name="new-password" autoFocus={prefilled} value={next} onChange={setNext} autoComplete="new-password" />
            <p className="text-[11px] text-gray-400 mt-1">Minimal 8 karakter, mengandung huruf dan angka.</p>
          </div>
          <div>
            <label className="font-bold text-gray-700 block mb-1">Ulangi password baru</label>
            <PasswordInput name="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </div>

          {meFailed && (
            <p className="rounded-xl bg-amber-50 text-amber-800 font-semibold px-3 py-2">
              Info akun gagal dimuat (sesi mungkin sudah tidak berlaku). Jika tombol simpan gagal, klik &quot;Keluar dari akun&quot; di bawah lalu login ulang.
            </p>
          )}
          {error && <p className="rounded-xl bg-rose-50 text-rose-700 font-semibold px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Password Baru
          </button>
        </form>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full min-h-11 flex items-center justify-center gap-2 border border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-600 hover:text-rose-600 font-bold rounded-xl text-sm transition"
        >
          <LogOut className="w-4 h-4" /> Keluar dari akun
        </button>

        {!forced && role && (
          <a href={home} className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke dashboard
          </a>
        )}
      </div>
    </div>
  );
}
