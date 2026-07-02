"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const roleParam = (params.get("role") as Role) || "mentee";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: roleParam },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${
              roleParam === "mentor" ? "/onboarding/mentor" : "/dashboard"
            }`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(
            roleParam === "mentor" ? "/onboarding/mentor" : "/dashboard",
          );
          router.refresh();
        } else {
          setMsg(
            "Enviamos um e-mail de confirmação. Confirme para ativar sua conta.",
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Informe seu e-mail para receber o link.");
      return;
    }
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setMsg("Link mágico enviado! Verifique seu e-mail.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-md">
      <h1 className="text-2xl font-bold">
        {mode === "signup"
          ? roleParam === "mentor"
            ? "Cadastre-se como mentor"
            : "Criar conta"
          : "Entrar"}
      </h1>

      {mode === "signup" && (
        <div className="mt-5">
          <label className="label">Nome completo</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
      )}

      <div className="mt-4">
        <label className="label">E-mail</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mt-4">
        <label className="label">Senha</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {msg && <p className="mt-4 text-sm text-green-400">{msg}</p>}

      <button type="submit" className="btn mt-6 w-full" disabled={loading}>
        {loading ? "Aguarde..." : mode === "signup" ? "Criar conta" : "Entrar"}
      </button>

      <button
        type="button"
        onClick={handleMagicLink}
        className="btn-ghost mt-3 w-full"
        disabled={loading}
      >
        Entrar com link mágico
      </button>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        {mode === "signup" ? (
          <>
            Já tem conta?{" "}
            <Link href="/auth/login" className="text-brand">
              Entrar
            </Link>
          </>
        ) : (
          <>
            Não tem conta?{" "}
            <Link href="/auth/signup" className="text-brand">
              Cadastre-se
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
