// src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load email tersimpan dari localStorage jika 'Ingat Saya' pernah dicentang
  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    const savedRemember = localStorage.getItem("remember_me") === "true";
    if (savedEmail && savedRemember) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal masuk, periksa kembali data Anda.");
        return;
      }

      // Kelola Fitur Ingat Saya (LocalStorage)
      if (rememberMe) {
        localStorage.setItem("remembered_email", email);
        localStorage.setItem("remember_me", "true");
      } else {
        localStorage.removeItem("remembered_email");
        localStorage.removeItem("remember_me");
      }

      // Password sementara -> wajib ganti dulu
      if (data.mustChangePassword) {
        try {
          sessionStorage.setItem("hk_temp_pw", password);
        } catch {
          /* penyimpanan tab tidak tersedia, abaikan */
        }
        router.push("/change-password");
        return;
      }

      // Redirect Murni Sesuai Role Akun dari Database
      switch (data.role) {
        case "OWNER":
          router.push("/owner/dashboard");
          break;
        case "ADMIN":
          router.push("/admin/dashboard");
          break;
        case "TEACHER":
          router.push("/teacher/dashboard");
          break;
        case "PARENT":
          router.push("/parent/dashboard");
          break;
        case "PRINCIPAL":
          router.push("/principal/dashboard");
          break;
        case "STUDENT":
          router.push("/student/dashboard");
          break;
        default:
          router.push("/");
      }
    } catch {
      setError("Terjadi kesalahan jaringan, silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
        {/* Banner Header dengan Logo Absenify Bulat */}
        <div className="flex flex-col items-center bg-indigo-600 px-6 py-8 text-center text-white">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow-md overflow-hidden shrink-0">
            <img
              src="/logo.jpg"
              alt="Absenify Logo"
              className="w-full h-full object-cover scale-[1.25]"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Absenify</h1>
          <p className="mt-1 text-xs text-indigo-100">
            Sistem Presensi & Manajemen Kehadiran Siswa
          </p>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-800">
            Masuk ke Akun Anda
          </h2>

          {error && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-center text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Field Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Email atau NISN
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email atau NISN (untuk murid)"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
            </div>

            {/* Field Kata Sandi */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-10 text-sm text-gray-800 outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Checkbox Ingat Saya */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-gray-600">
                  Ingat saya
                </span>
              </label>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 disabled:opacity-50"
            >
              {loading ? (
                "Memproses..."
              ) : (
                <>
                  Masuk <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}