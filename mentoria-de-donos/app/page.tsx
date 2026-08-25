import Link from "next/link";
import { BRAND } from "@/config/brand";
import { getPublishedMentors } from "@/lib/queries";
import { MentorCard } from "@/components/MentorCard";

export default async function HomePage() {
  const mentors = await getPublishedMentors({ limit: 6 });

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Hero */}
      <section className="py-16 text-center sm:py-24">
        <span className="chip border-brand/40 text-brand">
          Marketplace de mentoria
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          {BRAND.tagline}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--muted)]">
          Contrate uma hora com donos de negócio e líderes executivos de
          verdade. Escolha o mentor, o horário e pague com Pix — a sessão já
          fica agendada.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/mentores" className="btn">
            Quero uma mentoria
          </Link>
          <Link href="/auth/signup?role=mentor" className="btn-ghost">
            Quero ser mentor
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-12">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Como funciona
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            {
              n: "1",
              t: "Escolha um mentor",
              d: "Filtre por área, experiência e preço. Veja o perfil profissional completo.",
            },
            {
              n: "2",
              t: "Reserve um horário",
              d: "Selecione um horário livre na agenda do mentor e pague com Pix ou cartão.",
            },
            {
              n: "3",
              t: "Faça a sessão",
              d: "A reunião fica agendada com link de vídeo. É só entrar na hora marcada.",
            },
          ].map((step) => (
            <div key={step.n} className="card">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark font-bold text-white">
                {step.n}
              </div>
              <h3 className="mt-4 text-lg font-bold">{step.t}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mentores em destaque */}
      <section className="py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Mentores em destaque
          </h2>
          <Link href="/mentores" className="text-sm font-semibold text-brand">
            Ver todos →
          </Link>
        </div>

        {mentors.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((m) => (
              <MentorCard key={m.id} mentor={m} />
            ))}
          </div>
        ) : (
          <div className="card mt-8 text-center text-[var(--muted)]">
            <p>
              Nenhum mentor publicado ainda. Configure o Supabase e rode o{" "}
              <code className="text-brand">seed.sql</code>, ou{" "}
              <Link href="/auth/signup?role=mentor" className="text-brand">
                cadastre-se como mentor
              </Link>
              .
            </p>
          </div>
        )}
      </section>

      {/* CTA mentores */}
      <section className="my-16 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-10 text-center sm:p-16">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Você é dono de negócio ou executivo?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
          Monetize sua experiência. Defina seus horários e seu preço por hora —
          nós cuidamos do pagamento e do agendamento.
        </p>
        <Link href="/auth/signup?role=mentor" className="btn mt-7">
          Começar como mentor
        </Link>
      </section>
    </div>
  );
}
