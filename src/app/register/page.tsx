// src/app/register/page.tsx
"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";

const inputCls =
  "w-full bg-white text-gray-900 border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-gray-400";

export default function RegisterParentPage() {
  const [code, setCode] = useState("");
  const [child, setChild] = useState<{ studentName: string; className: string | null; schoolName: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-parent/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.message || "Kode tidak valid");
      setChild(json.data);
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Konfirmasi password tidak sama.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError(json.message || "Gagal mendaftar");
      window.location.href = "/parent/dashboard";
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-base font-bold">Daftar Akun Orang Tua</h1>
            <p className="text-xs text-gray-500">Gunakan kode pendaftaran dari sekolah.</p>
          </div>
        </div>

        {!child ? (
          <form onSubmit={checkCode} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Kode pendaftaran</label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                className={`${inputCls} text-center tracking-widest font-mono text-base`}
              />
              <p className="text-[11px] text-gray-400 mt-1">Kode diberikan oleh sekolah, berlaku sekali pakai.</p>
            </div>
            {error && <p className="rounded-xl bg-rose-50 text-rose-700 font-semibold px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full min-h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Lanjut
            </button>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-3.5 text-xs">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-emerald-800">
              <p className="font-bold">{child.studentName}</p>
              <p>
                {child.className ? `Kelas ${child.className} • ` : ""}
                {child.schoolName}
              </p>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Nama Anda</label>
              <input required name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Email</label>
              <input required type="email" name="username" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="email@contoh.com" />
              <p className="text-[11px] text-gray-400 mt-1">Dipakai untuk login berikutnya.</p>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Password</label>
              <div className="relative">
                <input
                  required
                  name="new-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-11 [&::-ms-reveal]:hidden`}
                />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label="Tampilkan atau sembunyikan password" className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-indigo-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Minimal 8 karakter, mengandung huruf dan angka.</p>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Ulangi password</label>
              <input required name="confirm-password" type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${inputCls} [&::-ms-reveal]:hidden`} />
            </div>
            {error && <p className="rounded-xl bg-rose-50 text-rose-700 font-semibold px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading} className="w-full min-h-11 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Daftar dan Masuk
            </button>
            <button type="button" onClick={() => { setChild(null); setError(""); }} className="w-full text-xs font-semibold text-gray-500 hover:text-indigo-600">
              Ganti kode
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-500">
          Sudah punya akun? <a href="/login" className="font-bold text-indigo-600 hover:underline">Masuk</a>
        </p>
      </div>
    </div>
  );
}
