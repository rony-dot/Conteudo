import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { BRAND } from "@/config/brand";

function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN não configurado — pagamento indisponível.",
    );
  }
  return new MercadoPagoConfig({ accessToken });
}

export interface CreatePreferenceInput {
  bookingId: string;
  title: string;
  priceCents: number;
  payerEmail?: string;
}

/**
 * Cria uma preferência de pagamento (Checkout Pro) para uma reserva.
 * Aceita Pix e cartão automaticamente. Retorna o init_point (URL de checkout).
 */
export async function createPreference(
  input: CreatePreferenceInput,
): Promise<{ id: string; init_point: string }> {
  const preference = new Preference(getClient());
  const base = BRAND.url;

  const result = await preference.create({
    body: {
      items: [
        {
          id: input.bookingId,
          title: input.title,
          quantity: 1,
          unit_price: Math.round(input.priceCents) / 100,
          currency_id: "BRL",
        },
      ],
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      external_reference: input.bookingId,
      back_urls: {
        success: `${base}/checkout/${input.bookingId}?status=success`,
        pending: `${base}/checkout/${input.bookingId}?status=pending`,
        failure: `${base}/checkout/${input.bookingId}?status=failure`,
      },
      auto_return: "approved",
      notification_url: `${base}/api/mp/webhook`,
      statement_descriptor: BRAND.shortName,
    },
  });

  return {
    id: String(result.id),
    init_point: result.init_point ?? result.sandbox_init_point ?? "",
  };
}

/** Busca os dados de um pagamento pelo id (usado no webhook). */
export async function getPayment(paymentId: string) {
  const payment = new Payment(getClient());
  return payment.get({ id: paymentId });
}
