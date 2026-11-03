'use client';

import React, { useState } from 'react';
import { School, User, Lock, ArrowRight } from 'lucide-react';
import { Role } from '../types';

interface LoginProps {
  onLogin: (user: { name: string; role: Role | string; email: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<string>('TEACHER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let name = 'Pengguna';
    if (selectedRole === 'TEACHER') name = 'Bpk. Ahmad S.Pd';
    if (selectedRole === 'ADMIN') name = 'Admin Utama';
    if (selectedRole === 'PARENT') name = 'Orang Tua Budi';
    if (selectedRole === 'HEADMASTER') name = 'Dr. H. Hendra, M.Pd';

    onLogin({
      name,
      role: selectedRole,
      email: email || `${selectedRole.toLowerCase()}@smartschool.id`,
    });
  };

  const quickLogin = (role: string, name: string) => {
    onLogin({
      name,
      role,
      email: `${role.toLowerCase()}@smartschool.id`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        
        {/* Header Brand */}
        <div className="bg-indigo-600 rounded-3xl p-6 text-white text-center shadow-xl space-y-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mx-auto text-white">
            <School className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">SmartSchool</h1>
          <p className="text-xs text-indigo-100 font-medium">Sistem Presensi & Manajemen Kehadiran Siswa</p>
        </div>

        {/* Form Login */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-gray-900">Masuk ke Akun Anda</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Email / NIP</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan NIP / Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2"
            >
              <span>Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Akses Cepat Demo */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider block text-center">
              Login Cepat (Mode Demo)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('TEACHER', 'Bpk. Ahmad S.Pd')}
                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-xl transition text-left"
              >
                🏫 Wali Kelas
              </button>
              <button
                type="button"
                onClick={() => quickLogin('ADMIN', 'Admin Utama')}
                className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold rounded-xl transition text-left"
              >
                ⚙️ Admin
              </button>
              <button
                type="button"
                onClick={() => quickLogin('PARENT', 'Orang Tua Budi')}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-xl transition text-left"
              >
                👨‍👩‍👦 Orang Tua
              </button>
              <button
                type="button"
                onClick={() => quickLogin('HEADMASTER', 'Dr. Hendra, M.Pd')}
                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold rounded-xl transition text-left"
              >
                🎓 Kepsek
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;