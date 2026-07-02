"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateMentorForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/create-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao criar mentor.");
      setMsg("Mentor criado! Ele já pode completar o perfil.");
      setFullName("");
      setEmail("");
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        + Cadastrar mentor
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card">
      <h3 className="font-bold">Cadastrar novo mentor</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          className="input"
          placeholder="Nome completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          className="input"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          className="input"
          placeholder="Senha provisória"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {msg && <p className="mt-3 text-sm text-green-400">{msg}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Criando..." : "Criar mentor"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
