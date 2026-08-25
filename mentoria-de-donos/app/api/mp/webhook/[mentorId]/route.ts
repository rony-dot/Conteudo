import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentWithToken, getValidMentorToken } from "@/lib/mercadopago";
import { meetingUrlForBooking } from "@/lib/jitsi";
import { sendBookingConfirmation } from "@/lib/email";
import type { Booking } from "@/lib/types";

/**
 * Webhook do Mercado Pago por mentor (split de pagamento).
 * O pagamento vive na conta do vendedor, então buscamos com o TOKEN do mentor.
 * Segurança: nunca confiamos no corpo — sempre re-buscamos o pagamento na API
 * do MP; um webhook forjado não confirma um pagamento inexistente/não aprovado.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ mentorId: string }> },
) {
  try {
    const { mentorId } = await params;
    const url = new URL(request.url);
    let paymentId =
      url.searchParams.get("data.id") || url.searchParams.get("id");
    let type = url.searchParams.get("type") || url.searchParams.get("topic");

    try {
      const body = await request.json();
      paymentId = paymentId || body?.data?.id?.toString();
      type = type || body?.type || body?.action;
    } catch {
      // sem corpo JSON — ok
    }

    if (type && !String(type).includes("payment")) {
      return NextResponse.json({ ok: true, ignored: type });
    }
    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: "sem id" });
    }

    const sellerToken = await getValidMentorToken(mentorId);
    if (!sellerToken) {
      return NextResponse.json({ ok: true, ignored: "mentor sem conta" });
    }

    const payment = await getPaymentWithToken(paymentId, sellerToken);
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
    // O pagamento precisa ser desta reserva/deste mentor.
    if (booking.mentor_id !== mentorId) {
      return NextResponse.json({ ok: true, ignored: "mentor divergente" });
    }

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

      const { data: mentor } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", booking.mentor_id)
        .maybeSingle();
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
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
