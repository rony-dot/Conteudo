import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPreference } from "@/lib/mercadopago";
import type { Booking } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { bookingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (!body.bookingId) {
    return NextResponse.json({ error: "bookingId ausente." }, { status: 400 });
  }

  // RLS garante que o usuário só lê a própria reserva.
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", body.bookingId)
    .maybeSingle();

  if (!booking || (booking as Booking).mentee_id !== user.id) {
    return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });
  }
  const b = booking as Booking;
  if (b.status !== "pending_payment") {
    return NextResponse.json(
      { error: "Esta reserva não está aguardando pagamento." },
      { status: 400 },
    );
  }

  const { data: mentor } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", b.mentor_id)
    .maybeSingle();

  try {
    const pref = await createPreference({
      bookingId: b.id,
      title: `Mentoria com ${mentor?.full_name ?? "mentor"} (1h)`,
      priceCents: b.price_cents,
      payerEmail: user.email ?? undefined,
    });
    return NextResponse.json({ init_point: pref.init_point });
  } catch (err) {
    console.error("create-preference:", err);
    return NextResponse.json(
      {
        error:
          "Pagamento indisponível. Verifique se o Mercado Pago está configurado.",
      },
      { status: 500 },
    );
  }
}
