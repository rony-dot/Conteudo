import { getPublishedMentors } from "@/lib/queries";
import { MentorCard } from "@/components/MentorCard";

export default async function MentoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const mentors = await getPublishedMentors({ q });

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-bold">Encontre seu mentor</h1>
      <p className="mt-2 text-[var(--muted)]">
        Donos de negócio e líderes executivos prontos para te ajudar por hora.
      </p>

      <form action="/mentores" method="get" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Busque por nome, área ou cargo (ex.: vendas, finanças...)"
          className="input"
        />
        <button type="submit" className="btn">
          Buscar
        </button>
      </form>

      {mentors.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
        </div>
      ) : (
        <div className="card mt-8 text-center text-[var(--muted)]">
          {q
            ? `Nenhum mentor encontrado para “${q}”.`
            : "Nenhum mentor publicado ainda. Configure o Supabase e rode o seed.sql."}
        </div>
      )}
    </div>
  );
}
