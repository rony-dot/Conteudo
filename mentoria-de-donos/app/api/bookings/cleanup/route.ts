import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cancela holds expirados (reservas pending_payment cuja janela de 15 min
 * passou), liberando o horário. Chame periodicamente via cron (Vercel Cron
 * ou pg_cron). Veja o README.
 */
export async function POST() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("status", "pending_payment")
    .lt("hold_expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ cancelled: data?.length ?? 0 });
}

export const GET = POST;
