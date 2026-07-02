import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service-role. BYPASSA RLS.
 * Use SOMENTE em código server-side confiável (webhooks, rotas de API que
 * já validaram a autorização). Nunca importe em componentes client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
