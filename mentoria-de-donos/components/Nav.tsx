import Link from "next/link";
import { BRAND } from "@/config/brand";
import { getCurrentProfile } from "@/lib/auth";

export async function Nav() {
  let profile = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    // Supabase pode não estar configurado ainda.
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(12,10,9,0.85)] backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-2">
        <Link href="/" className="text-lg font-extrabold tracking-tight">
          Mentoria<span className="text-brand"> de Donos</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/mentores" className="btn-ghost">
            Encontrar mentores
          </Link>
          {profile ? (
            <>
              <Link href="/dashboard" className="btn-ghost">
                Painel
              </Link>
              {profile.role === "admin" && (
                <Link href="/admin" className="btn-ghost">
                  Admin
                </Link>
              )}
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn-ghost">
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost">
                Entrar
              </Link>
              <Link href="/auth/signup?role=mentor" className="btn">
                Seja mentor
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
