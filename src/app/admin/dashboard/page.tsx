'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FiUsers, 
  FiBook, 
  FiUserCheck, 
  FiFileText, 
  FiShield, 
  FiSearch, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiRotateCcw, 
  FiArrowLeft, 
  FiUser, 
  FiLock, 
  FiKey,
  FiBookOpen, 
  FiPhone,
  FiBell,
  FiLogOut,
  FiCheck,
  FiX,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiMapPin,
  FiCamera,
  FiDownload,
  FiPrinter,
  FiUserPlus,
  FiSettings,
  FiVolume2,
  FiSend
} from 'react-icons/fi';

interface ClassItem {
  id: string;
  name: string;
  grade: string;
  waliKelas: string;
  totalStudents?: number;
}

interface Student {
  id: string;
  name: string;
  nis?: string;
  nisn?: string;
  classRoomId?: string;
  classRoom?: ClassItem;
  gender?: string;
  status: string;
  birthPlace?: string;
  birthDate?: string;
  phone?: string;
  parentPhone?: string;
  address?: string;
  parentName?: string;
  user?: {
    email?: string | null;
    username?: string | null;
  } | null;
  parent?: {
    email?: string;
    name?: string;
  };
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status: string;
}

interface LeaveRequest {
  id: string;
  studentName: string;
  className: string;
  type: 'Sakit' | 'Izin';
  reason: string;
  date: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  hasAttachment: boolean;
  requestedBy?: string;
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  time: string;
  ip: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  target: string;
  author: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Filter Ekspor Excel
  const [exportMonth, setExportMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [exportClassId, setExportClassId] = useState<string>('');

  // State Pengumuman
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancTarget, setAncTarget] = useState('ALL');
  const [isPostingAnc, setIsPostingAnc] = useState(false);

  // Modal User
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'TEACHER' as 'ADMIN' | 'TEACHER' | 'PARENT' | 'PRINCIPAL' | 'STUDENT',
    status: 'Aktif',
    password: ''
  });

  // Modal Kelas
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('X');
  const [newClassWali, setNewClassWali] = useState('');

  // Siswa Form & Filter
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    nis: '',
    nisn: '',
    classRoomId: '',
    gender: '',
    status: 'Aktif',
    birthDate: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [auditLogs] = useState<AuditLog[]>([
    { id: '1', user: 'Admin Utama', action: 'Login ke dalam sistem', time: '2026-10-03 08:00 WIB', ip: '127.0.0.1' },
  ]);

  // Logout: hapus cookie di server, lalu kembali ke halaman login
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Gagal logout:', err);
    } finally {
      window.location.href = '/login';
    }
  };

  // Fetch Pengumuman
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const json = await res.json();
        setAnnouncements(json.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat pengumuman:', err);
    }
  }, []);

  // Submit Pengumuman Baru
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim()) return;

    setIsPostingAnc(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: ancTitle, content: ancContent, target: ancTarget }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        alert('Pengumuman berhasil diterbitkan!');
        setAncTitle('');
        setAncContent('');
        setAncTarget('ALL');
        fetchAnnouncements();
      } else {
        alert(`Gagal: ${json.message || 'Gagal menerbitkan pengumuman'}`);
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setIsPostingAnc(false);
    }
  };

  // Fetch Data dari API Backend
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resUsers, resClasses, resStudents, resLeaves] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/classes'),
        fetch('/api/admin/students'),
        fetch('/api/leave')
      ]);

      if (resUsers.ok) {
        const json = await resUsers.json();
        setUsers(json.data || []);
      }
      if (resClasses.ok) {
        const json = await resClasses.json();
        setClasses(json.data || []);
      }
      if (resStudents.ok) {
        const json = await resStudents.json();
        setStudents(json.data || []);
      }
      if (resLeaves.ok) {
        const json = await resLeaves.json();
        const statusMap = { PENDING: 'Menunggu', APPROVED: 'Disetujui', REJECTED: 'Ditolak' } as const;
        type ApiLeave = {
          id: string; type: 'SAKIT' | 'IZIN'; startDate: string; endDate: string; reason: string;
          status: keyof typeof statusMap; hasAttachment: boolean; requestedBy?: string;
          student: { name: string; classRoom?: { name: string } | null };
        };
        setLeaveRequests(
          (json.data || []).map((l: ApiLeave): LeaveRequest => ({
            id: l.id,
            studentName: l.student.name,
            className: l.student.classRoom?.name || '-',
            type: l.type === 'SAKIT' ? 'Sakit' : 'Izin',
            reason: l.reason,
            date: l.startDate === l.endDate ? l.startDate : `${l.startDate} s/d ${l.endDate}`,
            status: statusMap[l.status],
            hasAttachment: l.hasAttachment,
            requestedBy: l.requestedBy,
          }))
        );
      }
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAnnouncements();
  }, [fetchData, fetchAnnouncements]);

  /* ================= MODE SEKOLAH & AKUN MURID ================= */
  type CredRow = { name: string; className: string | null; username: string | null; password: string };
  const [appVariant, setAppVariant] = useState<string>('VARIANT_1');
  const [credModal, setCredModal] = useState<{ title: string; rows: CredRow[]; skipped: { name: string; reason: string }[] } | null>(null);
  const [credBusy, setCredBusy] = useState(false);
  const [credKind, setCredKind] = useState<'account' | 'invite'>('account');
  const [inviteBusy, setInviteBusy] = useState(false);
  const studentAccountsEnabled = appVariant === 'VARIANT_2' || appVariant === 'VARIANT_3';

  // Pengaturan sekolah (Mode 3): jam batas terlambat untuk scan QR
  const [showSettings, setShowSettings] = useState(false);
  const [lateAfter, setLateAfter] = useState('07:15');
  const [settingsMsg, setSettingsMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const openSettings = async () => {
    setSettingsMsg(null);
    setShowSettings(true);
    try {
      const r = await fetch('/api/admin/school-settings');
      const j = await r.json();
      if (r.ok) setLateAfter(j.data.lateAfter);
    } catch { /* abaikan */ }
  };
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch('/api/admin/school-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lateAfter }) });
    const j = await r.json().catch(() => ({}));
    setSettingsMsg({ ok: r.ok, text: j.message || (r.ok ? 'Tersimpan' : 'Gagal menyimpan') });
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data?.appVariant) setAppVariant(j.data.appVariant); })
      .catch(() => {});
  }, []);

  const handleBulkCreateAccounts = async () => {
    if (!window.confirm('Buatkan akun login untuk semua murid yang belum punya akun?\n\nUsername = NISN. Password sementara acak ditampilkan SEKALI setelah ini.')) return;
    setCredBusy(true);
    try {
      const res = await fetch('/api/admin/students/accounts', { method: 'POST' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json.message || 'Gagal membuat akun murid');
      setCredKind('account');
      setCredModal({
        title: 'Akun murid dibuat',
        rows: json.data.created.map((c: { name: string; className: string | null; username: string; password: string }) => c),
        skipped: json.data.skipped,
      });
      fetchData();
    } finally {
      setCredBusy(false);
    }
  };

  const handleResetStudentAccount = async (st: Student) => {
    if (!window.confirm(`Buat password sementara baru untuk ${st.name}?`)) return;
    const res = await fetch(`/api/admin/students/${st.id}/reset-account`, { method: 'POST' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return alert(json.message || 'Gagal mereset akun murid');
    setCredKind('account');
    setCredModal({
      title: 'Password sementara murid',
      rows: [{ name: st.name, className: st.classRoom?.name ?? null, username: json.data.username, password: json.data.password }],
      skipped: [],
    });
    fetchData();
  };

  // Kode pendaftaran orang tua (orang tua mendaftar sendiri di halaman /register)
  type InviteRes = { created: { name: string; className: string | null; nisn: string | null; code: string }[]; skipped: { name: string; reason: string }[]; validDays: number };
  const showInvites = (d: InviteRes) => {
    setCredKind('invite');
    setCredModal({
      title: `Kode pendaftaran orang tua (berlaku ${d.validDays} hari)`,
      rows: d.created.map((c) => ({ name: c.name, className: c.className, username: c.nisn, password: c.code })),
      skipped: d.skipped,
    });
  };
  const handleBulkInvites = async () => {
    if (!window.confirm('Buat kode pendaftaran untuk semua murid yang belum terhubung ke orang tua?\n\nKode lama untuk murid yang sama akan diganti. Kode tampil SEKALI setelah ini.')) return;
    setInviteBusy(true);
    try {
      const res = await fetch('/api/admin/students/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return alert(json.message || 'Gagal membuat kode');
      showInvites(json.data);
    } finally {
      setInviteBusy(false);
    }
  };
  const handleStudentInvite = async (st: Student) => {
    const res = await fetch('/api/admin/students/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentIds: [st.id] }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return alert(json.message || 'Gagal membuat kode');
    showInvites(json.data);
  };

  const downloadCredCsv = () => {
    if (!credModal) return;
    const esc = (v: string | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [(credKind === 'invite' ? ['Nama', 'Kelas', 'NISN', 'Kode Pendaftaran'] : ['Nama', 'Kelas', 'Username (NISN)', 'Password Sementara']).map(esc).join(',')]
      .concat(credModal.rows.map((r) => [r.name, r.className, r.username, r.password].map(esc).join(',')));
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = credKind === 'invite' ? 'kode-orang-tua.csv' : 'akun-murid.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printCred = () => {
    if (!credModal) return;
    const w = window.open('', '_blank');
    if (!w) return alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak.');
    const doc = w.document;
    doc.title = 'Akun Murid';
    const style = doc.createElement('style');
    style.textContent = 'body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px 8px;font-size:13px;text-align:left}th{background:#eee}h2{margin:0 0 4px}p{margin:0 0 12px;font-size:12px;color:#555}';
    doc.head.appendChild(style);
    const h = doc.createElement('h2'); h.textContent = credKind === 'invite' ? 'Kode Pendaftaran Orang Tua' : 'Akun Login Murid'; doc.body.appendChild(h);
    const p = doc.createElement('p'); p.textContent = credKind === 'invite' ? 'Orang tua membuka halaman Daftar dan memasukkan kode ini. Kode berlaku sekali pakai dan ada batas waktunya. Simpan dokumen ini dengan aman.' : 'Password bersifat sementara dan wajib diganti saat login pertama. Simpan dokumen ini dengan aman.'; doc.body.appendChild(p);
    const table = doc.createElement('table');
    const head = doc.createElement('tr');
    (credKind === 'invite' ? ['Nama', 'Kelas', 'NISN', 'Kode Pendaftaran'] : ['Nama', 'Kelas', 'Username (NISN)', 'Password Sementara']).forEach((t) => { const th = doc.createElement('th'); th.textContent = t; head.appendChild(th); });
    table.appendChild(head);
    credModal.rows.forEach((r) => {
      const tr = doc.createElement('tr');
      [r.name, r.className ?? '-', r.username ?? '-', r.password].forEach((t) => { const td = doc.createElement('td'); td.textContent = t; tr.appendChild(td); });
      table.appendChild(tr);
    });
    doc.body.appendChild(table);
    w.focus();
    w.print();
  };

  /* ================= HANDLER USER CRUD ================= */
  const handleOpenAddUserModal = () => {
    setEditingUserId(null);
    setUserFormData({ name: '', email: '', role: 'TEACHER', status: 'Aktif', password: '' });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (u: UserItem) => {
    setEditingUserId(u.id);
    setUserFormData({ name: u.name, email: u.email ?? '', role: u.role, status: u.status, password: '' });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || (!userFormData.email.trim() && userFormData.role !== 'STUDENT')) return;

    try {
      const url = editingUserId ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
      const method = editingUserId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(editingUserId ? 'User berhasil diperbarui!' : json.message || 'User baru berhasil ditambahkan!');
        fetchData();
        setIsUserModalOpen(false);
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.message || 'Terjadi kesalahan'}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('User berhasil dihapus!');
        fetchData();
      }
    } catch (err) {
      alert('Gagal menghapus user');
    }
  };

  /* ================= HANDLER KELAS CRUD ================= */
  const getClassStudentCount = (classObj: ClassItem) => {
    const count = students.filter((s) => String(s.classRoomId) === String(classObj.id)).length;
    return count || classObj.totalStudents || 0;
  };

  const handleOpenAddClassModal = () => {
    setEditingClassId(null);
    setNewClassName('');
    setNewClassGrade('X');
    setNewClassWali('');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClassModal = (c: ClassItem) => {
    setEditingClassId(c.id);
    setNewClassName(c.name);
    setNewClassGrade(c.grade || 'X');
    setNewClassWali(c.waliKelas !== 'Belum Ditentukan' ? c.waliKelas : '');
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const url = editingClassId ? `/api/admin/classes/${editingClassId}` : '/api/admin/classes';
      const method = editingClassId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName, grade: newClassGrade, waliKelas: newClassWali }),
      });

      if (res.ok) {
        alert('Data kelas berhasil disimpan!');
        fetchData();
        setIsClassModalOpen(false);
      }
    } catch (err) {
      alert('Gagal menyimpan kelas');
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/classes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Kelas berhasil dihapus!');
        fetchData();
      }
    } catch (err) {
      alert('Gagal menghapus kelas');
    }
  };

  /* ================= HANDLER SISWA CRUD ================= */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingStudentId ? `/api/admin/students/${editingStudentId}` : '/api/admin/students';
      const method = editingStudentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(editingStudentId ? 'Data siswa berhasil diperbarui!' : json.message || 'Siswa berhasil ditambahkan!');
        fetchData();
        setIsFormOpen(false);
        resetForm();
      } else {
        const json = await res.json();
        alert(`Gagal: ${json.message || 'Gagal menyimpan data'}`);
      }
    } catch (err) {
      alert('Gagal memperbarui data siswa');
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudentId(student.id);
    setFormData({
      name: student.name || '',
      nis: student.nis || '',
      nisn: student.nisn || '',
      classRoomId: student.classRoomId || '',
      gender: student.gender || '',
      status: student.status || 'Aktif',
      birthDate: student.birthDate ? String(student.birthDate).split('T')[0] : '',
      parentName: student.parentName || student.parent?.name || '',
      parentEmail: student.parent?.email || '',
      parentPhone: student.parentPhone || '',
    });
    setIsFormOpen(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return;
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Siswa berhasil dihapus');
        fetchData();
      }
    } catch (err) {
      alert('Gagal menghapus siswa');
    }
  };

  const handleLeaveStatus = async (id: string, newStatus: 'Disetujui' | 'Ditolak') => {
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus === 'Disetujui' ? 'APPROVED' : 'REJECTED' }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(`Gagal: ${json.message || 'Gagal memperbarui status izin'}`);
        return;
      }
      fetchData();
    } catch {
      alert('Gagal memperbarui status izin');
    }
  };

  const resetForm = () => {
    setEditingStudentId(null);
    setFormData({
      name: '', nis: '', nisn: '', classRoomId: '', gender: '', status: 'Aktif',
      birthDate: '', parentName: '', parentEmail: '', parentPhone: '',
    });
  };

  // Handler Pemicu Download Excel
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (exportMonth) params.append('month', exportMonth);
    if (exportClassId) params.append('classRoomId', exportClassId);

    window.open(`/api/admin/reports/export?${params.toString()}`, '_blank');
  };

  const filteredStudents = students.filter((s) => {
    const searchLower = search.toLowerCase();
    const matchSearch = 
      (s.name && s.name.toLowerCase().includes(searchLower)) || 
      (s.nis && String(s.nis).includes(search)) || 
      (s.nisn && String(s.nisn).includes(search));
      
    const matchClass = selectedClassFilter ? String(s.classRoomId) === String(selectedClassFilter) : true;
    const matchStatus = selectedStatusFilter ? s.status === selectedStatusFilter : true;
    
    return matchSearch && matchClass && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-[#4F46E5] text-white px-6 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white text-indigo-600 font-bold px-2 py-1 rounded text-lg">HK</div>
          <div>
            <h1 className="font-bold leading-none text-base">HadirKu</h1>
            <p className="text-xs text-indigo-200">Management Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-white hover:text-indigo-200 p-1 transition"><FiBell size={20} /></button>
          {appVariant === 'VARIANT_3' && (
            <button onClick={() => { window.location.href = '/scan'; }} title="Scanner QR Absensi" className="text-white hover:text-indigo-200 p-1 transition"><FiCamera size={20} /></button>
          )}
          {appVariant === 'VARIANT_3' && (
            <button onClick={openSettings} title="Pengaturan jam terlambat" className="text-white hover:text-indigo-200 p-1 transition"><FiSettings size={20} /></button>
          )}
          {showSettings && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <form onSubmit={saveSettings} className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 text-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold">Pengaturan Absensi QR</h3>
                  <button type="button" onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-700"><FiX size={20} /></button>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Jam batas terlambat</label>
                  <input type="time" required value={lateAfter} onChange={(e) => setLateAfter(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                  <p className="text-[11px] text-slate-400 mt-1">Murid yang dipindai setelah jam ini dicatat Terlambat. Contoh: 07:30 untuk &quot;setengah 8&quot;. Memakai zona waktu sekolah.</p>
                </div>
                {settingsMsg && <p className={`text-xs font-semibold ${settingsMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{settingsMsg.text}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowSettings(false)} className="px-4 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50">Tutup</button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500">Simpan</button>
                </div>
              </form>
            </div>
          )}
          <button onClick={() => { window.location.href = '/change-password'; }} title="Ganti Password" className="text-white hover:text-indigo-200 p-1 transition"><FiKey size={20} /></button>
          <button onClick={handleLogout} title="Keluar" className="text-white hover:text-indigo-200 p-1 transition"><FiLogOut size={20} /></button>
        </div>
      </header>

      <div className="flex flex-1 p-6 gap-6 bg-slate-50">
        {/* Sidebar Left */}
        <aside className="w-64 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 shadow-xl shrink-0">
          <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white">A</div>
            <div>
              <p className="font-semibold text-sm leading-tight text-slate-900">Admin Sekolah</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 mt-2">
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <FiUsers size={18} /> User Management
            </button>

            <button 
              onClick={() => setActiveTab('kelas')}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition ${activeTab === 'kelas' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <FiBook size={18} /> Master Kelas
            </button>

            <button 
              onClick={() => setActiveTab('siswa')}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition ${activeTab === 'siswa' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <FiUserCheck size={18} /> Master Siswa
            </button>

            <button 
              onClick={() => setActiveTab('izin')}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition ${activeTab === 'izin' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <FiFileText size={18} /> Persetujuan Izin
            </button>

            <button 
              onClick={() => setActiveTab('laporan')}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition ${activeTab === 'laporan' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <FiDownload size={18} /> Laporan & Ekspor
            </button>

            <button 
              onClick={() => setActiveTab('pengumuman')}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition ${activeTab === 'pengumuman' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <FiVolume2 size={18} /> Pengumuman
            </button>

            <button 
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition ${activeTab === 'audit' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <FiShield size={18} /> Audit Trail
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl overflow-hidden">
          
          {/* TAB 1: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">User Management</h2>
                  <p className="text-xs text-slate-500 mt-1">Kelola akun dan hak akses pengguna terisolasi tenant sekolah</p>
                </div>
                <button
                  onClick={handleOpenAddUserModal}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30"
                >
                  <FiPlus /> Tambah User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="p-3">NAMA</th>
                      <th className="p-3">EMAIL</th>
                      <th className="p-3">ROLE</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan={5} className="p-4 text-center text-slate-400">Memuat data user...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={5} className="p-4 text-center text-slate-400">Tidak ada user terdaftar.</td></tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-semibold text-slate-800">{u.name}</td>
                          <td className="p-3 text-slate-500">{u.email || u.username || "-"}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                              u.role === 'TEACHER' ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20' :
                              'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              u.status === 'Aktif'
                                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEditUserModal(u)}
                                className="p-1.5 bg-amber-500/10 text-amber-700 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition"
                              >
                                <FiEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 transition"
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

          {/* TAB 2: MASTER KELAS */}
          {activeTab === 'kelas' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Master Data Kelas</h2>
                  <p className="text-xs text-slate-500 mt-1">Daftar kelas dan wali kelas terdaftar</p>
                </div>
                <button
                  onClick={handleOpenAddClassModal}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30"
                >
                  <FiPlus /> Tambah Kelas
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="p-3">NAMA KELAS</th>
                      <th className="p-3">TINGKAT</th>
                      <th className="p-3">WALI KELAS</th>
                      <th className="p-3">JUMLAH SISWA</th>
                      <th className="p-3 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-semibold text-slate-800">{c.name}</td>
                        <td className="p-3 text-slate-500">{c.grade}</td>
                        <td className="p-3 text-slate-700">{c.waliKelas || 'Belum Ditentukan'}</td>
                        <td className="p-3 text-slate-500 font-medium">
                          {getClassStudentCount(c)} Siswa
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditClassModal(c)}
                              className="p-1.5 bg-amber-500/10 text-amber-700 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(c.id, c.name)}
                              className="p-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 transition"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MASTER SISWA */}
          {activeTab === 'siswa' && (
            <div>
              {isFormOpen ? (
                <div>
                  <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                      <FiUser className="text-indigo-600" /> Form {editingStudentId ? 'Edit' : 'Tambah'} Siswa
                    </h2>
                    <button
                      onClick={() => { setIsFormOpen(false); resetForm(); }}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition text-slate-700"
                    >
                      <FiArrowLeft /> Kembali
                    </button>
                  </div>

                  <form onSubmit={handleSubmitStudent} className="space-y-6">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FiBookOpen /> Data Identitas Siswa
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Nama Lengkap *</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">NIS</label>
                          <input
                            type="text"
                            name="nis"
                            value={formData.nis}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">NISN</label>
                          <input
                            type="text"
                            name="nisn"
                            value={formData.nisn}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                            <FiCalendar size={12} /> Tanggal Lahir
                          </label>
                          <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Kelas *</label>
                          <select
                            name="classRoomId"
                            value={formData.classRoomId}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">-- Pilih Kelas --</option>
                            {classes.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Jenis Kelamin</label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">-- Pilih --</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Status</label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Aktif">Aktif</option>
                            <option value="Non-Aktif">Non-Aktif</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FiUser /> Data Orang Tua / Wali
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Nama Orang Tua</label>
                          <input type="text" name="parentName" value={formData.parentName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Email Orang Tua</label>
                          <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleInputChange} placeholder="ortu@gmail.com" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">No. HP Orang Tua</label>
                          <input type="text" name="parentPhone" value={formData.parentPhone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Boleh dikosongkan: orang tua bisa mendaftar sendiri dengan kode dari tombol Kode Orang Tua. Jika email diisi, akun dibuat otomatis dengan password sementara acak (tampil sekali).
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => { setIsFormOpen(false); resetForm(); }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-600/30"
                      >
                        Simpan Siswa
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Master Data Siswa</h2>
                      <p className="text-xs text-slate-500 mt-1">Daftar siswa terdaftar dan filter status</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                      onClick={handleBulkInvites}
                      disabled={inviteBusy}
                      className="flex items-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-60 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-medium transition"
                    >
                      <FiUserPlus /> {inviteBusy ? 'Membuat...' : 'Kode Orang Tua'}
                    </button>
                    {studentAccountsEnabled && (
                      <button
                        onClick={handleBulkCreateAccounts}
                        disabled={credBusy}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-60 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-medium transition"
                      >
                        <FiKey /> {credBusy ? 'Membuat...' : 'Buat Akun Murid'}
                      </button>
                    )}
                    <button
                      onClick={() => { resetForm(); setIsFormOpen(true); }}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30"
                    >
                      <FiPlus /> Tambah Siswa
                    </button>
                    </div>
                  </div>

                  {credModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{credModal.title}</h3>
                            <p className="text-xs text-rose-600 font-semibold mt-1">{credKind === 'invite' ? 'Kode hanya tampil sekali. Unduh atau cetak sekarang, lalu bagikan ke orang tua (misalnya lewat wali kelas). Orang tua mendaftar di halaman Daftar.' : 'Password hanya tampil sekali. Unduh atau cetak sekarang, lalu bagikan ke murid. Wajib diganti saat login pertama.'}</p>
                          </div>
                          <button onClick={() => setCredModal(null)} className="text-slate-400 hover:text-slate-700"><FiX size={20} /></button>
                        </div>
                        {credModal.rows.length === 0 ? (
                          <p className="text-sm text-slate-500">Tidak ada akun baru yang dibuat.</p>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-sm text-left">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs">
                                  <th className="p-2">NAMA</th><th className="p-2">KELAS</th><th className="p-2">{credKind === 'invite' ? 'NISN' : 'USERNAME (NISN)'}</th><th className="p-2">{credKind === 'invite' ? 'KODE' : 'PASSWORD'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {credModal.rows.map((r, i) => (
                                  <tr key={i}>
                                    <td className="p-2 font-semibold text-slate-800">{r.name}</td>
                                    <td className="p-2 text-slate-500">{r.className || '-'}</td>
                                    <td className="p-2 text-slate-700">{r.username}</td>
                                    <td className="p-2 font-mono font-bold text-indigo-700">{r.password}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {credModal.skipped.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                            <p className="font-bold mb-1">Dilewati ({credModal.skipped.length}):</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {credModal.skipped.map((s, i) => (<li key={i}>{s.name}: {s.reason}</li>))}
                            </ul>
                          </div>
                        )}
                        <div className="flex gap-2 justify-end flex-wrap">
                          <button onClick={downloadCredCsv} disabled={credModal.rows.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 disabled:opacity-50"><FiDownload /> Unduh CSV</button>
                          <button onClick={printCred} disabled={credModal.rows.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 disabled:opacity-50"><FiPrinter /> Cetak</button>
                          <button onClick={() => setCredModal(null)} className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500">Selesai</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
                    <div className="md:col-span-5 relative">
                      <input
                        type="text"
                        placeholder="Cari nama, NIS, NISN..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                      <FiSearch className="absolute left-3 top-3 text-slate-400" />
                    </div>

                    <div className="md:col-span-3">
                      <select
                        value={selectedClassFilter}
                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Semua Status</option>
                        <option value="Aktif">Aktif</option>
                        <option value="Non-Aktif">Non-Aktif</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <button
                        onClick={() => { setSearch(''); setSelectedClassFilter(''); setSelectedStatusFilter(''); }}
                        className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 w-full py-2 rounded-xl text-sm transition text-slate-700"
                      >
                        <FiRotateCcw size={14} /> Reset
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                          <th className="p-3">NISN</th>
                          <th className="p-3">NAMA SISWA</th>
                          <th className="p-3">KELAS</th>
                          <th className="p-3">STATUS</th>
                          {studentAccountsEnabled && <th className="p-3">AKUN LOGIN</th>}
                          <th className="p-3 text-center">AKSI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                          <tr><td colSpan={6} className="text-center p-6 text-slate-400">Memuat data...</td></tr>
                        ) : filteredStudents.length === 0 ? (
                          <tr><td colSpan={6} className="text-center p-6 text-slate-400">Tidak ada data siswa.</td></tr>
                        ) : (
                          filteredStudents.map((s) => {
                            const studentClassName = s.classRoom?.name || classes.find(c => String(c.id) === String(s.classRoomId))?.name || '-';
                            return (
                              <tr key={s.id} className="hover:bg-slate-50 transition">
                                <td className="p-3 text-slate-500">{s.nisn || s.nis || '-'}</td>
                                <td className="p-3 font-semibold text-slate-800">{s.name}</td>
                                <td className="p-3 text-slate-500">{studentClassName}</td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    s.status === 'Aktif' 
                                      ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' 
                                      : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                  }`}>
                                    {s.status || 'Aktif'}
                                  </span>
                                </td>
                                {studentAccountsEnabled && (
                                  <td className="p-3 text-xs">
                                    {s.user?.username ? (
                                      <span className="text-emerald-700 font-semibold">Ada ({s.user.username})</span>
                                    ) : (
                                      <span className="text-slate-400">Belum ada</span>
                                    )}
                                  </td>
                                )}
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {!s.parent && (
                                      <button
                                        onClick={() => handleStudentInvite(s)}
                                        title="Buat kode pendaftaran orang tua"
                                        className="p-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition"
                                      >
                                        <FiUserPlus size={16} />
                                      </button>
                                    )}
                                    {studentAccountsEnabled && (
                                      <button
                                        onClick={() => handleResetStudentAccount(s)}
                                        title={s.user?.username ? 'Reset password murid' : 'Buat akun murid'}
                                        className="p-1.5 bg-indigo-500/10 text-indigo-700 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/20 transition"
                                      >
                                        <FiKey size={16} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleEditStudent(s)}
                                      className="p-1.5 bg-amber-500/10 text-amber-700 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition"
                                    >
                                      <FiEdit size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudent(s.id)}
                                      className="p-1.5 bg-rose-500/10 text-rose-600 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 transition"
                                    >
                                      <FiTrash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PERSETUJUAN IZIN */}
          {activeTab === 'izin' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Persetujuan Izin & Sakit</h2>
                  <p className="text-xs text-slate-500 mt-1">Daftar permohonan izin/sakit siswa</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="p-3">NAMA SISWA</th>
                      <th className="p-3">KELAS</th>
                      <th className="p-3">JENIS</th>
                      <th className="p-3">ALASAN</th>
                      <th className="p-3">TANGGAL</th>
                      <th className="p-3">BUKTI</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaveRequests.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 text-sm">Belum ada pengajuan izin.</td>
                      </tr>
                    )}
                    {leaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-semibold text-slate-800">
                          {req.studentName}
                          {req.requestedBy === 'STUDENT' && <span className="ml-2 text-[10px] font-bold bg-violet-100 text-violet-700 rounded px-1.5 py-0.5">diajukan murid</span>}
                        </td>
                        <td className="p-3 text-slate-500">{req.className}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            req.type === 'Sakit' ? 'bg-amber-500/20 text-amber-700' : 'bg-blue-500/20 text-blue-700'
                          }`}>
                            {req.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 max-w-xs truncate">{req.reason}</td>
                        <td className="p-3 text-slate-500">{req.date}</td>
                        <td className="p-3">
                          {req.hasAttachment ? (
                            <a
                              href={`/api/leave/${req.id}/attachment`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-indigo-600 hover:underline"
                            >
                              Lihat bukti
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${
                            req.status === 'Disetujui' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                            req.status === 'Ditolak' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                          }`}>
                            {req.status === 'Disetujui' && <FiCheckCircle size={12} />}
                            {req.status === 'Ditolak' && <FiXCircle size={12} />}
                            {req.status === 'Menunggu' && <FiClock size={12} />}
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {req.status === 'Menunggu' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleLeaveStatus(req.id, 'Disetujui')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition"
                              >
                                <FiCheck /> Setujui
                              </button>
                              <button 
                                onClick={() => handleLeaveStatus(req.id, 'Ditolak')}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition"
                              >
                                <FiX /> Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: LAPORAN & EKSPOR EXCEL */}
          {activeTab === 'laporan' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Laporan & Rekapitulasi Absensi</h2>
                  <p className="text-xs text-slate-500 mt-1">Unduh rekapitulasi kehadiran bulanan siswa dalam format Excel (.xlsx) resmi</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-200">
                  📊 Format .xlsx Resmi
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 max-w-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <FiFileText className="text-indigo-600" /> Filter Parameter Ekspor
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block font-medium flex items-center gap-1">
                      <FiCalendar size={13} /> Pilih Bulan & Tahun
                    </label>
                    <input
                      type="month"
                      value={exportMonth}
                      onChange={(e) => setExportMonth(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block font-medium flex items-center gap-1">
                      <FiUsers size={13} /> Pilih Kelas (Opsional)
                    </label>
                    <select
                      value={exportClassId}
                      onChange={(e) => setExportClassId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Semua Kelas</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800 uppercase tracking-wider mb-1">Ringkasan Ekspor:</p>
                  <p>• Periode: <span className="font-semibold text-indigo-600">{exportMonth || 'Semua Bulan'}</span></p>
                  <p>• Filter Kelas: <span className="font-semibold text-indigo-600">{classes.find(c => String(c.id) === String(exportClassId))?.name || 'Semua Kelas'}</span></p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setExportMonth(new Date().toISOString().slice(0, 7));
                      setExportClassId('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
                  >
                    <FiRotateCcw size={12} /> Reset Filter
                  </button>

                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-600/30"
                  >
                    <FiDownload size={18} /> Ekspor File Excel (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PENGUMUMAN SEKOLAH */}
          {activeTab === 'pengumuman' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Pengumuman & Broadcast Sekolah</h2>
                  <p className="text-xs text-slate-500 mt-1">Terbitkan informasi penting ke Guru, Orang Tua, dan Murid</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Buat Pengumuman */}
                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 p-5 rounded-2xl h-fit">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FiVolume2 className="text-indigo-600" /> Buat Pengumuman Baru
                  </h3>
                  <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block font-medium">Judul Pengumuman *</label>
                      <input
                        type="text"
                        placeholder="Contoh: Libur Nasional & Kegiatan Belajar"
                        value={ancTitle}
                        onChange={(e) => setAncTitle(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 mb-1 block font-medium">Target Penerima</label>
                      <select
                        value={ancTarget}
                        onChange={(e) => setAncTarget(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ALL">Semua (Guru, Orang Tua & Murid)</option>
                        <option value="TEACHER">Hanya Guru</option>
                        <option value="PARENT">Hanya Orang Tua</option>
                        <option value="STUDENT">Hanya Murid</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 mb-1 block font-medium">Isi Pengumuman *</label>
                      <textarea
                        rows={4}
                        placeholder="Tulis detail pengumuman secara jelas di sini..."
                        value={ancContent}
                        onChange={(e) => setAncContent(e.target.value)}
                        required
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isPostingAnc}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/30"
                    >
                      <FiSend size={16} /> {isPostingAnc ? 'Menerbitkan...' : 'Terbitkan Pengumuman'}
                    </button>
                  </form>
                </div>

                {/* Daftar Pengumuman Terbit */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Riwayat Pengumuman Diterbitkan</h3>
                  {announcements.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm">
                      Belum ada pengumuman yang diterbitkan.
                    </div>
                  ) : (
                    announcements.map((item) => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-bold text-slate-800 text-base">{item.title}</h4>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            item.target === 'ALL' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            item.target === 'TEACHER' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            item.target === 'PARENT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.target === 'ALL' ? 'SEMUA' : item.target}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mb-3">{item.content}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                          <span>Oleh: <strong className="text-slate-600">{item.author || 'Admin'}</strong></span>
                          <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Audit Trail System</h2>
                  <p className="text-xs text-slate-500 mt-1">Rekam riwayat aktivitas pengguna demi keamanan sistem</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="p-3">PENGGUNA</th>
                      <th className="p-3">AKTIVITAS</th>
                      <th className="p-3">WAKTU</th>
                      <th className="p-3">IP ADDRESS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-semibold text-slate-800">{log.user}</td>
                        <td className="p-3 text-slate-700">{log.action}</td>
                        <td className="p-3 text-slate-500 text-xs">{log.time}</td>
                        <td className="p-3 font-mono text-xs text-indigo-600">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL USER */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FiUser className="text-indigo-600" />
              {editingUserId ? 'Edit Data User' : 'Tambah User Baru'}
            </h3>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Nama Lengkap *</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso, S.Pd"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Email *</label>
                <input
                  type="email"
                  placeholder="user@smartschool.id"
                  value={userFormData.email ?? ''}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  required={userFormData.role !== 'STUDENT'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Role Hak Akses *</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'ADMIN' | 'TEACHER' | 'STUDENT' })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="TEACHER">TEACHER (Guru)</option>
                  <option value="PRINCIPAL">PRINCIPAL (Kepala Sekolah)</option>
                  <option value="PARENT">PARENT (Orang Tua)</option>
                  {userFormData.role === 'STUDENT' && <option value="STUDENT">STUDENT (Murid)</option>}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Status Akun</label>
                <select
                  value={userFormData.status}
                  onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Password</label>
                <input
                  type="password"
                  placeholder={editingUserId ? 'Kosongkan jika tidak ingin mengubah' : 'Kosongkan = dibuatkan password acak'}
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KELAS */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingClassId ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
            </h3>
            
            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Nama Kelas *</label>
                <input
                  type="text"
                  placeholder="Contoh: XII IPA 3"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Tingkat</label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="X">Tingkat X</option>
                  <option value="XI">Tingkat XI</option>
                  <option value="XII">Tingkat XII</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Wali Kelas (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad, S.Pd"
                  value={newClassWali}
                  onChange={(e) => setNewClassWali(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30"
                >
                  {editingClassId ? 'Simpan Perubahan' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}