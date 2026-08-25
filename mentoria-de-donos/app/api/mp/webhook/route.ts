import { NextResponse } from "next/server";

/**
 * Endpoint legado. Com split de pagamento, as notificações do Mercado Pago vão
 * para `/api/mp/webhook/[mentorId]` (o pagamento vive na conta do vendedor e
 * precisa do token dele para ser lido). Este handler só reconhece o evento.
 */
export async function POST() {
  return NextResponse.json({ ok: true, note: "use /api/mp/webhook/[mentorId]" });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
