import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { BookingRow } from "@/components/BookingRow";
import { formatBRL } from "@/lib/format";
import type { Booking } from "@/lib/types";

interface JoinedBooking extends Booking {
  mentor?: { full_name: string; avatar_url: string | null } | null;
  mentee?: { full_name: string; avatar_url: string | null } | null;
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login?next=/dashboard");

  const supabase = await createClient();

  // Reservas onde sou aluno.
  const { data: asMentee } = await supabase
    .from("bookings")
    .select("*, mentor:mentor_id(full_name, avatar_url)")
    .eq("mentee_id", profile.id)
    .order("start_at", { ascending: true });

  // Reservas onde sou mentor.
  const { data: asMentor } =
    profile.role === "mentor"
      ? await supabase
          .from("bookings")
          .select("*, mentee:mentee_id(full_name, avatar_url)")
          .eq("mentor_id", profile.id)
          .order("start_at", { ascending: true })
      : { data: [] as JoinedBooking[] };

  const menteeBookings = (asMentee as JoinedBooking[]) ?? [];
  const mentorBookings = (asMentor as JoinedBooking[]) ?? [];

  const earnings = mentorBookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + (b.price_cents - b.platform_fee_cents), 0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Olá, {profile.full_name || "!"}</h1>
        {profile.role === "mentor" && (
          <Link href="/onboarding/mentor" className="btn-ghost">
            Editar perfil e disponibilidade
          </Link>
        )}
      </div>

      {/* Painel do mentor */}
      {profile.role === "mentor" && (
        <section className="mt-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-sm text-[var(--muted)]">Ganhos (líquido)</p>
              <p className="mt-1 text-2xl font-bold text-brand">
                {formatBRL(earnings)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-[var(--muted)]">Sessões confirmadas</p>
              <p className="mt-1 text-2xl font-bold">
                {
                  mentorBookings.filter((b) => b.status === "confirmed").length
                }
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-[var(--muted)]">Status do perfil</p>
              <p className="mt-1 text-2xl font-bold">
                {profile.is_published ? "Publicado" : "Rascunho"}
              </p>
            </div>
          </div>

          <h2 className="mt-8 text-xl font-bold">Sessões como mentor</h2>
          <div className="mt-4 space-y-3">
            {mentorBookings.length > 0 ? (
              mentorBookings.map((b) => (
                <BookingRow
                  key={b.id}
                  bookingId={b.id}
                  counterpartName={b.mentee?.full_name ?? "Aluno"}
                  counterpartAvatar={b.mentee?.avatar_url ?? null}
                  startAt={b.start_at}
                  status={b.status}
                  priceCents={b.price_cents - b.platform_fee_cents}
                  meetingUrl={b.meeting_url}
                />
              ))
            ) : (
              <p className="text-[var(--muted)]">
                Nenhuma sessão agendada ainda.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Painel do aluno */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Minhas mentorias</h2>
        <div className="mt-4 space-y-3">
          {menteeBookings.length > 0 ? (
            menteeBookings.map((b) => (
              <BookingRow
                key={b.id}
                bookingId={b.id}
                counterpartName={b.mentor?.full_name ?? "Mentor"}
                counterpartAvatar={b.mentor?.avatar_url ?? null}
                startAt={b.start_at}
                status={b.status}
                priceCents={b.price_cents}
                meetingUrl={b.meeting_url}
                showPayLink
              />
            ))
          ) : (
            <p className="text-[var(--muted)]">
              Você ainda não contratou nenhuma mentoria.{" "}
              <Link href="/mentores" className="text-brand">
                Encontrar mentores →
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
