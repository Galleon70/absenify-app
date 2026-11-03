'use client';

import React, { useState } from 'react';
import { UserPlus, Shield, Trash2, Mail, Lock, User } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'HEADMASTER';
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([
    { id: '1', name: 'Siti Aminah', email: 'admin@sekolah.sch.id', role: 'ADMIN' },
    { id: '2', name: 'Budi Santoso', email: 'budi.guru@gmail.com', role: 'TEACHER' },
    { id: '3', name: 'Dr. H. Ahmad, M.Pd', email: 'kepsek@sekolah.sch.id', role: 'HEADMASTER' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TEACHER' as 'ADMIN' | 'TEACHER' | 'HEADMASTER',
  });

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const newUser: UserData = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };

    setUsers([...users, newUser]);
    setFormData({ name: '', email: '', password: '', role: 'TEACHER' });
    setIsModalOpen(false);
  };

  const getRoleBadge = (role: UserData['role']) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-lg">Admin</span>;
      case 'HEADMASTER':
        return <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-lg">Kepala Sekolah</span>;
      default:
        return <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg">Wali Kelas</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Menu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manajemen Pengguna</h2>
          <p className="text-xs text-gray-500">Kelola akun staf internal sekolah (Admin, Guru, & Kepala Sekolah)</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Email</th>
                <th className="p-4">Peran (Role)</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-bold text-gray-900">{u.name}</td>
                  <td className="p-4 text-gray-500 font-mono">{u.email}</td>
                  <td className="p-4">{getRoleBadge(u.role)}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setUsers(users.filter((item) => item.id !== u.id))}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                      title="Hapus Pengguna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah Pengguna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Tambah Akun Staf Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso, S.Pd"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Email Akun</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="budi@gmail.com atau budi@sekolah.sch.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Password Awal</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Peran / Hak Akses</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TEACHER">Wali Kelas</option>
                  <option value="HEADMASTER">Kepala Sekolah (Kepsek)</option>
                  <option value="ADMIN">Admin Sistem</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}