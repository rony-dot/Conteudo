import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { BRAND } from "@/config/brand";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MentorPaymentAccount } from "@/lib/types";

const MP_API = "https://api.mercadopago.com";
const OAUTH_AUTHORIZE = "https://auth.mercadopago.com/authorization";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} não configurado.`);
  return v;
}

export function redirectUri(): string {
  return (
    process.env.MERCADOPAGO_REDIRECT_URI || `${BRAND.url}/api/mp/oauth/callback`
  );
}

// ------------------------------------------------------------
// OAuth do vendedor (mentor) — split de pagamento
// ------------------------------------------------------------

/** URL para o mentor autorizar a plataforma a receber em nome dele. */
export function buildOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("MERCADOPAGO_CLIENT_ID"),
    response_type: "code",
    platform_id: "mp",
    state,
    redirect_uri: redirectUri(),
  });
  return `${OAUTH_AUTHORIZE}?${params.toString()}`;
}

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  user_id?: number | string;
  public_key?: string;
  expires_in?: number; // segundos
}

async function postOAuthToken(
  body: Record<string, string>,
): Promise<OAuthTokenResponse> {
  const res = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `OAuth Mercado Pago falhou: ${data.message || data.error || res.status}`,
    );
  }
  return data as OAuthTokenResponse;
}

/** Troca o code de autorização pelos tokens do vendedor. */
export function exchangeOAuthCode(code: string) {
  return postOAuthToken({
    client_id: requireEnv("MERCADOPAGO_CLIENT_ID"),
    client_secret: requireEnv("MERCADOPAGO_CLIENT_SECRET"),
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
  });
}

/** Renova o access_token do vendedor a partir do refresh_token. */
export function refreshOAuthToken(refreshToken: string) {
  return postOAuthToken({
    client_id: requireEnv("MERCADOPAGO_CLIENT_ID"),
    client_secret: requireEnv("MERCADOPAGO_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

function expiresAtFrom(expiresIn?: number): string | null {
  if (!expiresIn) return null;
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

/** Persiste (upsert) a conta de recebimento do mentor. */
export async function saveMentorAccount(
  mentorId: string,
  tokens: OAuthTokenResponse,
) {
  const admin = createAdminClient();
  await admin.from("mentor_payment_accounts").upsert({
    mentor_id: mentorId,
    provider: "mercadopago",
    mp_user_id: tokens.user_id ? String(tokens.user_id) : null,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    public_key: tokens.public_key ?? null,
    expires_at: expiresAtFrom(tokens.expires_in),
    updated_at: new Date().toISOString(),
  });
  await admin
    .from("profiles")
    .update({ mp_connected: true })
    .eq("id", mentorId);
}

/**
 * Retorna um access_token válido do mentor, renovando se estiver perto de
 * expirar. `null` se o mentor não conectou o Mercado Pago.
 */
export async function getValidMentorToken(
  mentorId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("mentor_payment_accounts")
    .select("*")
    .eq("mentor_id", mentorId)
    .maybeSingle();
  if (!data) return null;
  const account = data as MentorPaymentAccount;

  const soon = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 dias
  const expired =
    account.expires_at && new Date(account.expires_at).getTime() < soon;

  if (expired && account.refresh_token) {
    try {
      const refreshed = await refreshOAuthToken(account.refresh_token);
      await saveMentorAccount(mentorId, refreshed);
      return refreshed.access_token;
    } catch (err) {
      console.error("refresh token MP:", err);
      // Cai no token atual como fallback (pode ainda estar válido).
    }
  }
  return account.access_token;
}

// ------------------------------------------------------------
// Criação de preferência com split
// ------------------------------------------------------------

export interface CreatePreferenceInput {
  bookingId: string;
  mentorId: string;
  sellerAccessToken: string;
  title: string;
  priceCents: number;
  marketplaceFeeCents: number;
  payerEmail?: string;
}

/**
 * Cria a preferência (Checkout Pro) NA CONTA DO MENTOR (token do vendedor),
 * com `marketplace_fee` = comissão da plataforma. O Mercado Pago divide os
 * valores automaticamente: o líquido fica na conta do mentor e a comissão vai
 * para a conta da plataforma. Aceita Pix e cartão.
 */
export async function createPreference(
  input: CreatePreferenceInput,
): Promise<{ id: string; init_point: string }> {
  const client = new MercadoPagoConfig({
    accessToken: input.sellerAccessToken,
  });
  const preference = new Preference(client);
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
      marketplace_fee: Math.round(input.marketplaceFeeCents) / 100,
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      external_reference: input.bookingId,
      back_urls: {
        success: `${base}/checkout/${input.bookingId}?status=success`,
        pending: `${base}/checkout/${input.bookingId}?status=pending`,
        failure: `${base}/checkout/${input.bookingId}?status=failure`,
      },
      auto_return: "approved",
      // Webhook por-mentor: o pagamento vive na conta do vendedor, então
      // precisamos do mentorId para buscar o pagamento com o token certo.
      notification_url: `${base}/api/mp/webhook/${input.mentorId}`,
      statement_descriptor: BRAND.shortName,
    },
  });

  return {
    id: String(result.id),
    init_point: result.init_point ?? result.sandbox_init_point ?? "",
  };
}

/** Busca um pagamento usando o token do vendedor (dono do pagamento). */
export async function getPaymentWithToken(
  paymentId: string,
  sellerAccessToken: string,
) {
  const client = new MercadoPagoConfig({ accessToken: sellerAccessToken });
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}
