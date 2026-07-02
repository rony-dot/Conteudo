import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateSlots,
  DEFAULT_DURATION_MIN,
  type BusyInterval,
} from "@/lib/availability";
import { platformFeeCents } from "@/lib/format";
import type {
  AvailabilityRule,
  AvailabilityException,
  Profile,
} from "@/lib/types";

const HOLD_MINUTES = 15;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login para reservar." }, { status: 401 });
  }

  let body: { mentorId?: string; start?: string; end?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const { mentorId, start, end } = body;
  if (!mentorId || !start || !end) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }
  if (mentorId === user.id) {
    return NextResponse.json(
      { error: "Você não pode agendar consigo mesmo." },
      { status: 400 },
    );
  }

  // Mentor precisa existir e estar publicado.
  const { data: mentor } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", mentorId)
    .eq("role", "mentor")
    .eq("is_published", true)
    .maybeSingle();
  if (!mentor) {
    return NextResponse.json({ error: "Mentor não encontrado." }, { status: 404 });
  }
  const mentorProfile = mentor as Profile;
  if (!mentorProfile.hourly_rate_cents) {
    return NextResponse.json(
      { error: "Mentor sem preço definido." },
      { status: 400 },
    );
  }

  // Valida que o horário pedido é realmente um slot livre.
  const [{ data: rules }, { data: exceptions }, { data: busy }] =
    await Promise.all([
      supabase.from("availability_rules").select("*").eq("mentor_id", mentorId),
      supabase
        .from("availability_exceptions")
        .select("*")
        .eq("mentor_id", mentorId),
      supabase.rpc("busy_intervals", { mentor: mentorId }),
    ]);

  const slots = generateSlots({
    rules: (rules as AvailabilityRule[]) ?? [],
    exceptions: (exceptions as AvailabilityException[]) ?? [],
    busy: (busy as BusyInterval[]) ?? [],
  });
  const valid = slots.some((s) => s.start === start && s.end === end);
  if (!valid) {
    return NextResponse.json(
      { error: "Horário indisponível. Escolha outro." },
      { status: 409 },
    );
  }

  const priceCents = mentorProfile.hourly_rate_cents;
  const holdExpires = new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString();

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      mentor_id: mentorId,
      mentee_id: user.id,
      start_at: start,
      end_at: end,
      duration_min: DEFAULT_DURATION_MIN,
      price_cents: priceCents,
      platform_fee_cents: platformFeeCents(priceCents),
      status: "pending_payment",
      hold_expires_at: holdExpires,
    })
    .select("id")
    .single();

  if (error) {
    // 23P01 = exclusion_violation (horário já reservado por outra pessoa)
    const code = (error as { code?: string }).code;
    if (code === "23P01") {
      return NextResponse.json(
        { error: "Esse horário acabou de ser reservado. Escolha outro." },
        { status: 409 },
      );
    }
    console.error("hold insert:", error);
    return NextResponse.json(
      { error: "Não foi possível reservar. Tente novamente." },
      { status: 500 },
    );
  }

  return NextResponse.json({ bookingId: booking.id });
}
