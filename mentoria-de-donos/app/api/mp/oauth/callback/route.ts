import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { exchangeOAuthCode, saveMentorAccount } from "@/lib/mercadopago";

// Retorno do OAuth do Mercado Pago: troca o code por tokens e salva a conta.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("mp_oauth_state")?.value;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?next=/onboarding/mentor`);
  }

  // CSRF: o state precisa bater com o nonce que guardamos no cookie.
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/onboarding/mentor?mp=error`);
  }

  try {
    const tokens = await exchangeOAuthCode(code);
    await saveMentorAccount(user.id, tokens);
  } catch (err) {
    console.error("oauth callback:", err);
    return NextResponse.redirect(`${origin}/onboarding/mentor?mp=error`);
  }

  const res = NextResponse.redirect(`${origin}/onboarding/mentor?mp=ok`);
  res.cookies.delete("mp_oauth_state");
  return res;
}
