'use client';

import { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSearch, 
  FiRotateCcw, 
  FiArrowLeft, 
  FiUser, 
  FiLock, 
  FiBookOpen, 
  FiPhone 
} from 'react-icons/fi';

interface ClassRoom {
  id: string;
  name: string;
}

interface Student {
  id: string;
  userId?: string | null;
  name: string;
  nis?: string | null;
  nisn?: string | null;
  classRoomId?: string | null;
  classRoom?: ClassRoom | null;
  gender?: string | null;
  status?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  parentPhone?: string | null;
  address?: string | null;
  user?: {
    email?: string;
  } | null;
}

export default function MasterSiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Form State - Sesuai dengan body POST/PUT di API route
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    nis: '',
    nisn: '',
    classRoomId: '',
    gender: '',
    status: 'Aktif',
    birthPlace: '',
    birthDate: '',
    phone: '',
    parentPhone: '',
    address: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resStudents, resClasses] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/classes')
      ]);

      if (resStudents.ok) {
        const json = await resStudents.json();
        if (json.success) {
          setStudents(json.data || []);
        }
      }
      if (resClasses.ok) {
        const json = await resClasses.json();
        if (json.success) {
          setClasses(json.data || []);
        } else if (Array.isArray(json)) {
          setClasses(json);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingStudentId 
        ? `/api/admin/students/${editingStudentId}` 
        : '/api/admin/students';
      const method = editingStudentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        alert(editingStudentId ? 'Data siswa berhasil diperbarui!' : 'Siswa berhasil ditambahkan!');
        setIsFormOpen(false);
        resetForm();
        fetchData();
      } else {
        alert(json.message || 'Gagal menyimpan data siswa');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Terjadi kesalahan koneksi server');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setFormData({
      email: student.user?.email || '',
      password: '',
      name: student.name || '',
      nis: student.nis || '',
      nisn: student.nisn || '',
      classRoomId: student.classRoomId || '',
      gender: student.gender || '',
      status: student.status || 'Aktif',
      birthPlace: student.birthPlace || '',
      birthDate: student.birthDate ? String(student.birthDate).split('T')[0] : '',
      phone: student.phone || '',
      parentPhone: student.parentPhone || '',
      address: student.address || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        alert('Siswa berhasil dihapus');
        fetchData();
      } else {
        alert(json.message || 'Gagal menghapus siswa');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const resetForm = () => {
    setEditingStudentId(null);
    setFormData({
      email: '', 
      password: '', 
      name: '', 
      nis: '', 
      nisn: '',
      classRoomId: '', 
      gender: '', 
      status: 'Aktif', 
      birthPlace: '',
      birthDate: '', 
      phone: '', 
      parentPhone: '', 
      address: ''
    });
  };

  // Filter Data
  const filteredStudents = students.filter((s) => {
    const searchLower = search.toLowerCase();
    const matchSearch = 
      (s.name && s.name.toLowerCase().includes(searchLower)) || 
      (s.nis && String(s.nis).includes(search)) || 
      (s.nisn && String(s.nisn).includes(search));

    const matchClass = selectedClassFilter ? s.classRoomId === selectedClassFilter : true;
    const matchStatus = selectedStatusFilter ? s.status === selectedStatusFilter : true;

    return matchSearch && matchClass && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isFormOpen ? 'Tambah Siswa' : 'Data Siswa'}</h1>
          <p className="text-sm text-slate-400">
            {isFormOpen ? 'Tambahkan data siswa baru ke sistem' : 'Kelola data siswa'}
          </p>
        </div>
        <div className="bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-500/30">
          📅 Kamis, 1 Oktober 2026
        </div>
      </div>

      {/* --- FORM TAMBAH / EDIT SISWA --- */}
      {isFormOpen ? (
        <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-700 max-w-4xl mx-auto shadow-2xl">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FiUser className="text-blue-500" /> Form {editingStudentId ? 'Edit' : 'Tambah'} Siswa
            </h2>
            <button
              onClick={() => { setIsFormOpen(false); resetForm(); }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              <FiArrowLeft /> Kembali
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Akun Pengguna */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                <FiLock /> Akun Pengguna
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email (Opsional untuk buat akun login)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="siswa@gmail.com"
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editingStudentId ? 'Kosongkan jika tidak diganti' : 'Default: siswa123'}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Data Identitas Siswa */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                <FiBookOpen /> Data Identitas Siswa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-1">
                  <label className="text-xs text-slate-400 mb-1 block">Nama Lengkap *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nama lengkap siswa"
                    required
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">NIS</label>
                  <input
                    type="text"
                    name="nis"
                    value={formData.nis}
                    onChange={handleInputChange}
                    placeholder="Nomor Induk Siswa"
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">NISN</label>
                  <input
                    type="text"
                    name="nisn"
                    value={formData.nisn}
                    onChange={handleInputChange}
                    placeholder="Nomor Induk Siswa Nasional"
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Kelas</label>
                  <select
                    name="classRoomId"
                    value={formData.classRoomId}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Jenis Kelamin</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Status Siswa</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                    <option value="Lulus">Lulus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tempat Lahir</label>
                  <input
                    type="text"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleInputChange}
                    placeholder="Kota/Kabupaten"
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tanggal Lahir</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Kontak & Alamat */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                <FiPhone /> Kontak & Alamat
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">No. HP Siswa</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="08xxxxxxxxxx"
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">No. HP Orang Tua / Wali</label>
                  <input
                    type="text"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    placeholder="08xxxxxxxxxx"
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Alamat Lengkap</label>
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Alamat domisili siswa"
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); resetForm(); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition text-white"
              >
                Simpan Siswa
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* --- DAFTAR SISWA TABLE --- */
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              🎓 Daftar Siswa
            </h2>
            <button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <FiPlus /> Tambah Siswa
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
            <div className="md:col-span-5 relative">
              <input
                type="text"
                placeholder="Cari nama, NIS, NISN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 text-slate-400" />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
                <option value="Lulus">Lulus</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={() => { setSearch(''); setSelectedClassFilter(''); setSelectedStatusFilter(''); }}
                className="flex items-center justify-center gap-1 bg-slate-700 hover:bg-slate-600 w-full rounded-lg text-sm transition"
              >
                <FiRotateCcw /> Reset
              </button>
            </div>
          </div>

          {/* Tabel Siswa */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 bg-[#0f172a]/50">
                  <th className="p-3">NO</th>
                  <th className="p-3">NAMA SISWA</th>
                  <th className="p-3">NIS</th>
                  <th className="p-3">KELAS</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-slate-400">Memuat data...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-6 text-slate-500">Tidak ada data siswa.</td>
                  </tr>
                ) : (
                  filteredStudents.map((s, index) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-slate-400">{index + 1}</td>
                      <td className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                          {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.user?.email || '-'}</p>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">{s.nis || '-'}</td>
                      {/* Mengambil nama kelas langsung dari relasi include: { classRoom: true } */}
                      <td className="p-3 text-slate-300">{s.classRoom?.name || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.status === 'Aktif' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {s.status || 'Aktif'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition"
                            title="Edit"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 transition"
                            title="Hapus"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}