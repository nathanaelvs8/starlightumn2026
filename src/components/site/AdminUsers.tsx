"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string;
  role: string;
  created_at: string;
};

export function AdminUsers() {
  const [users, setUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else setUsers(d.users);
      })
      .catch(() => setErr("Gagal ambil data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-center font-alice text-white/60">Memuat…</p>;
  if (err)
    return <p className="text-center font-alice text-red-300">{err}</p>;

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-cyan-300/25 bg-white/5 backdrop-blur">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-alice text-sm text-white/85">
          <thead className="border-b border-white/15 text-xs uppercase tracking-wide text-cyan-200/70">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">No HP</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/5"
              >
                <td className="px-4 py-3">{u.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-white/70">{u.email}</td>
                <td className="px-4 py-3 text-white/70">{u.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      u.role === "admin"
                        ? "rounded-pill bg-cyan-400/90 px-2.5 py-0.5 text-xs font-bold text-[#0a1430]"
                        : "text-white/60"
                    }
                  >
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-white/10 px-4 py-3 text-center text-xs text-white/50">
        Total {users.length} user
      </p>
    </div>
  );
}