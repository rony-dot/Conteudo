import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMentorBySlug } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import {
  generateSlots,
  groupSlotsByDay,
  type BusyInterval,
} from "@/lib/availability";
import { BookingCalendar } from "@/components/BookingCalendar";
import type { AvailabilityRule, AvailabilityException } from "@/lib/types";

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mentor = await getMentorBySlug(slug);
  if (!mentor) notFound();

  const supabase = await createClient();
  const user = await getUser();

  const [{ data: rules }, { data: exceptions }, { data: busy }] =
    await Promise.all([
      supabase
        .from("availability_rules")
        .select("*")
        .eq("mentor_id", mentor.id),
      supabase
        .from("availability_exceptions")
        .select("*")
        .eq("mentor_id", mentor.id),
      supabase.rpc("busy_intervals", { mentor: mentor.id }),
    ]);

  const slots = generateSlots({
    rules: (rules as AvailabilityRule[]) ?? [],
    exceptions: (exceptions as AvailabilityException[]) ?? [],
    busy: (busy as BusyInterval[]) ?? [],
  });
  const slotsByDay = groupSlotsByDay(slots);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Perfil */}
        <div>
          <div className="flex items-center gap-5">
            <img
              src={mentor.avatar_url || `https://i.pravatar.cc/200?u=${mentor.id}`}
              alt={mentor.full_name}
              className="h-24 w-24 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">{mentor.full_name}</h1>
              <p className="mt-1 text-[var(--muted)]">{mentor.headline}</p>
              {mentor.linkedin_url && (
                <a
                  href={mentor.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-brand"
                >
                  Ver LinkedIn →
                </a>
              )}
            </div>
          </div>

          {mentor.expertise?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {mentor.expertise.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {mentor.bio && (
            <div className="mt-6">
              <h2 className="text-lg font-bold">Sobre</h2>
              <p className="mt-2 whitespace-pre-line text-[var(--muted)]">
                {mentor.bio}
              </p>
            </div>
          )}
        </div>

        {/* Agendamento */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BookingCalendar
            mentorId={mentor.id}
            priceCents={mentor.hourly_rate_cents ?? 0}
            slotsByDay={slotsByDay}
            isLoggedIn={!!user}
          />
        </div>
      </div>
    </div>
  );
}
