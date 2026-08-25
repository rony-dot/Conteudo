import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { AdminMentorToggle } from "@/components/AdminMentorToggle";
import { CreateMentorForm } from "@/components/CreateMentorForm";
import { formatBRL, formatDateTime } from "@/lib/format";
import type { Profile, Booking } from "@/lib/types";

interface JoinedBooking extends Booking {
  mentor?: { full_name: string } | null;
  mentee?: { full_name: string } | null;
}

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login?next=/admin");
  if (profile.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-[var(--muted)]">
          Esta área é exclusiva de administradores.
        </p>
        <Link href="/" className="btn mt-6">
          Voltar
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: mentors }, { data: bookings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "mentor")
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select(
        "*, mentor:mentor_id(full_name), mentee:mentee_id(full_name)",
      )
      .order("start_at", { ascending: false })
      .limit(30),
  ]);

  const mentorList = (mentors as Profile[]) ?? [];
  const bookingList = (bookings as JoinedBooking[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-bold">Administração</h1>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Mentores ({mentorList.length})</h2>
        </div>
        <div className="mb-5">
          <CreateMentorForm />
        </div>
        <div className="space-y-3">
          {mentorList.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--line)] bg-[var(--panel2)] p-4"
            >
              <img
                src={m.avatar_url || `https://i.pravatar.cc/80?u=${m.id}`}
                alt={m.full_name}
                className="h-11 w-11 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {m.full_name || "(sem nome)"}
                </p>
                <p className="truncate text-sm text-[var(--muted)]">
                  {m.headline || "Perfil incompleto"}
                </p>
              </div>
              <span className="text-sm text-[var(--muted)]">
                {formatBRL(m.hourly_rate_cents)}
              </span>
              <span
                className={`chip ${
                  m.is_published
                    ? "border-green-500/40 text-green-400"
                    : "border-[var(--line)]"
                }`}
              >
                {m.is_published ? "Publicado" : "Rascunho"}
              </span>
              <AdminMentorToggle
                mentorId={m.id}
                published={m.is_published}
              />
            </div>
          ))}
          {mentorList.length === 0 && (
            <p className="text-[var(--muted)]">Nenhum mentor cadastrado.</p>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Reservas recentes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[var(--muted)]">
              <tr className="border-b border-[var(--line)]">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Mentor</th>
                <th className="py-2 pr-4">Aluno</th>
                <th className="py-2 pr-4">Valor</th>
                <th className="py-2 pr-4">Taxa</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookingList.map((b) => (
                <tr key={b.id} className="border-b border-[var(--line)]">
                  <td className="py-2 pr-4">{formatDateTime(b.start_at)}</td>
                  <td className="py-2 pr-4">{b.mentor?.full_name}</td>
                  <td className="py-2 pr-4">{b.mentee?.full_name}</td>
                  <td className="py-2 pr-4">{formatBRL(b.price_cents)}</td>
                  <td className="py-2 pr-4">
                    {formatBRL(b.platform_fee_cents)}
                  </td>
                  <td className="py-2">{b.status}</td>
                </tr>
              ))}
              {bookingList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-[var(--muted)]">
                    Nenhuma reserva ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
