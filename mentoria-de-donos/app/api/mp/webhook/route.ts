import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPayment } from "@/lib/mercadopago";
import { meetingUrlForBooking } from "@/lib/jitsi";
import { sendBookingConfirmation } from "@/lib/email";
import type { Booking } from "@/lib/types";

/**
 * Webhook do Mercado Pago. Segurança: nunca confiamos no corpo do webhook —
 * sempre RE-BUSCAMOS o pagamento na API do MP com nosso access token. Um
 * webhook forjado não consegue confirmar um pagamento que não existe/aprovou.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let paymentId =
      url.searchParams.get("data.id") || url.searchParams.get("id");
    let type = url.searchParams.get("type") || url.searchParams.get("topic");

    // Alguns eventos vêm no corpo.
    try {
      const body = await request.json();
      paymentId = paymentId || body?.data?.id?.toString();
      type = type || body?.type || body?.action;
    } catch {
      // sem corpo JSON — ok
    }

    // Só nos interessam eventos de pagamento.
    if (type && !String(type).includes("payment")) {
      return NextResponse.json({ ok: true, ignored: type });
    }
    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: "sem id" });
    }

    const payment = await getPayment(paymentId);
    const bookingId = payment.external_reference;
    const status = payment.status; // approved, pending, rejected...
    if (!bookingId) {
      return NextResponse.json({ ok: true, ignored: "sem external_reference" });
    }

    const admin = createAdminClient();

    const { data: bookingRow } = await admin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();
    if (!bookingRow) {
      return NextResponse.json({ ok: true, ignored: "reserva inexistente" });
    }
    const booking = bookingRow as Booking;

    // Registra o pagamento (idempotente por provider_payment_id).
    const { data: existingPayment } = await admin
      .from("payments")
      .select("id")
      .eq("provider_payment_id", String(paymentId))
      .maybeSingle();
    if (!existingPayment) {
      await admin.from("payments").insert({
        booking_id: bookingId,
        provider: "mercadopago",
        provider_payment_id: String(paymentId),
        amount_cents: Math.round((payment.transaction_amount ?? 0) * 100),
        status: status ?? "unknown",
        raw: payment as unknown as Record<string, unknown>,
      });
    }

    if (status === "approved" && booking.status === "pending_payment") {
      const meetingUrl = meetingUrlForBooking(bookingId);
      await admin
        .from("bookings")
        .update({
          status: "confirmed",
          meeting_url: meetingUrl,
          mp_payment_id: String(paymentId),
        })
        .eq("id", bookingId);

      // E-mail de confirmação (no-op se Resend não configurado).
      const [{ data: mentor }, { data: mentee }] = await Promise.all([
        admin.from("profiles").select("full_name").eq("id", booking.mentor_id).maybeSingle(),
        admin.from("profiles").select("id").eq("id", booking.mentee_id).maybeSingle(),
      ]);
      const { data: menteeUser } = await admin.auth.admin.getUserById(
        booking.mentee_id,
      );
      if (menteeUser?.user?.email) {
        await sendBookingConfirmation({
          to: menteeUser.user.email,
          mentorName: mentor?.full_name ?? "seu mentor",
          startAt: booking.start_at,
          meetingUrl,
        });
      }
      void mentee;
    } else if (
      (status === "rejected" || status === "cancelled") &&
      booking.status === "pending_payment"
    ) {
      await admin
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("webhook:", err);
    // Retorna 200 mesmo em erro para o MP não reenviar infinitamente em casos
    // não recuperáveis; erros de infra podem ser reprocessados manualmente.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

// MP às vezes faz GET para validar a URL.
export async function GET() {
  return NextResponse.json({ ok: true });
}
