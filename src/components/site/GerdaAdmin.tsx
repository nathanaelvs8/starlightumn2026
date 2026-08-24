"use client";

import { useEffect, useState } from "react";
import { divisions } from "@/lib/divisions";

type Member = {
  id: string;
  division: string;
  full_name: string;
  nim: string;
};

export function GerdaAdmin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [division, setDivision] = useState(divisions[0]?.name ?? "");
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editNim, setEditNim] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/gerda");
    const d = await r.json();
    setMembers(d.members ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const tambah = async () => {
    if (!nama.trim() || !nim.trim()) {
      setMsg("Nama & NIM wajib diisi");
      return;
    }
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/admin/gerda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ division, full_name: nama, nim }),
    });
    setBusy(false);
    if (r.ok) {
      setNama("");
      setNim("");
      load();
    } else {
      const d = await r.json();
      setMsg(d.error ?? "Gagal nambah");
    }
  };

  const simpanEdit = async (id: string) => {
    setBusy(true);
    const m = members.find((x) => x.id === id);
    const r = await fetch("/api/admin/gerda", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        division: m?.division,
        full_name: editNama,
        nim: editNim,
      }),
    });
    setBusy(false);
    if (r.ok) {
      setEditId(null);
      load();
    }
  };

  const hapus = async (id: string) => {
    if (!confirm("Hapus anggota ini?")) return;
    setBusy(true);
    const r = await fetch("/api/admin/gerda", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    if (r.ok) load();
  };

  // kelompokin per divisi
  const byDivision = divisions.map((d) => ({
    division: d.name,
    list: members.filter((m) => m.division === d.name),
  }));

  return (
    <div className="mx-auto max-w-3xl">
      {/* Form tambah */}
      <div className="rounded-2xl border border-cyan-300/25 bg-white/5 p-6 backdrop-blur">
        <h2 className="font-alice text-lg font-bold text-white">Tambah Anggota</h2>
        <div className="mt-4 flex flex-col gap-3">
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="rounded-lg border border-white/20 bg-[#0a1430] px-4 py-2.5 font-alice text-white focus:border-cyan-300/60 focus:outline-none"
          >
            {divisions.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama lengkap"
              className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 font-alice text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none"
            />
            <input
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="NIM"
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 font-alice text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none sm:w-48"
            />
          </div>

          {msg && <p className="text-sm text-red-300">{msg}</p>}

          <button
            type="button"
            onClick={tambah}
            disabled={busy}
            className="self-start rounded-pill bg-cyan-400 px-6 py-2.5 font-alice font-bold uppercase tracking-wide text-[#0a1430] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* List per divisi */}
      {loading ? (
        <p className="mt-8 text-center font-alice text-white/60">Memuat…</p>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {byDivision.map(({ division: div, list }) => (
            <div
              key={div}
              className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur"
            >
              <h3 className="font-alice text-base font-bold text-cyan-200">
                {div}{" "}
                <span className="font-normal text-white/50">
                  ({list.length})
                </span>
              </h3>

              {list.length === 0 ? (
                <p className="mt-2 font-alice text-sm text-white/40">
                  Belum ada anggota.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {list.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2"
                    >
                      {editId === m.id ? (
                        <>
                          <input
                            value={editNama}
                            onChange={(e) => setEditNama(e.target.value)}
                            className="flex-1 rounded border border-white/20 bg-white/10 px-2 py-1 font-alice text-sm text-white"
                          />
                          <input
                            value={editNim}
                            onChange={(e) => setEditNim(e.target.value)}
                            className="w-28 rounded border border-white/20 bg-white/10 px-2 py-1 font-alice text-sm text-white"
                          />
                          <button
                            type="button"
                            onClick={() => simpanEdit(m.id)}
                            disabled={busy}
                            className="rounded bg-cyan-400 px-3 py-1 text-xs font-bold text-[#0a1430]"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditId(null)}
                            className="text-xs text-white/50"
                          >
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 font-alice text-sm text-white/90">
                            {m.full_name}
                          </span>
                          <span className="font-alice text-sm text-white/60">
                            {m.nim}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditId(m.id);
                              setEditNama(m.full_name);
                              setEditNim(m.nim);
                            }}
                            className="text-xs text-cyan-300 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => hapus(m.id)}
                            className="text-xs text-red-400 hover:underline"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}