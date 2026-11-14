"use client";

import { useState, useEffect } from "react";

interface TeacherAttendance {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string; // HADIR, IZIN, SAKIT, ALPHA
  teacher: {
    name: string;
    nip: string | null;
  };
}

export default function TeacherReportsPage() {
  const [reports, setReports] = useState<TeacherAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/reports/teachers";
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setReports(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rekapan Absensi Guru</h1>
          <p className="text-sm text-gray-500">
            Pantau jam masuk, jam pulang, dan status kehadiran pengajar.
          </p>
        </div>
      </div>

      {/* Filter Tanggal */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Dari:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sampai:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Filter
        </button>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Belum ada data absensi guru pada periode ini.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
              <tr>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Nama Guru</th>
                <th className="p-4">NIP</th>
                <th className="p-4">Jam Masuk</th>
                <th className="p-4">Jam Pulang</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">
                    {new Date(item.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-4">{item.teacher.name}</td>
                  <td className="p-4">{item.teacher.nip || "-"}</td>
                  <td className="p-4 text-emerald-600 font-medium">
                    {item.checkInTime ? item.checkInTime : "-"}
                  </td>
                  <td className="p-4 text-blue-600 font-medium">
                    {item.checkOutTime ? item.checkOutTime : "-"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === "HADIR"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "IZIN"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}