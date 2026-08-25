import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildOAuthUrl } from "@/lib/mercadopago";

// Inicia o OAuth: leva o mentor ao Mercado Pago para conectar a conta dele.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/login?next=/onboarding/mentor", request.url),
    );
  }

  const state = crypto.randomUUID();
  let url: string;
  try {
    url = buildOAuthUrl(state);
  } catch {
    // Credenciais do MP não configuradas.
    return NextResponse.redirect(
      new URL("/onboarding/mentor?mp=config", request.url),
    );
  }

  const res = NextResponse.redirect(url);
  res.cookies.set("mp_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
