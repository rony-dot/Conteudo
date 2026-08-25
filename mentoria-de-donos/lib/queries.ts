import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

function supabaseConfigured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Mentores publicados, com busca opcional por texto/expertise. */
export async function getPublishedMentors(opts?: {
  q?: string;
  limit?: number;
}): Promise<Profile[]> {
  if (!supabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "mentor")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (opts?.q) {
      const q = opts.q.trim();
      query = query.or(
        `full_name.ilike.%${q}%,headline.ilike.%${q}%,bio.ilike.%${q}%`,
      );
    }
    if (opts?.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data as Profile[]) ?? [];
  } catch (err) {
    console.error("getPublishedMentors:", err);
    return [];
  }
}

/** Um mentor por slug (ou id como fallback). */
export async function getMentorBySlug(slug: string): Promise<Profile | null> {
  if (!supabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "mentor")
      .eq("is_published", true)
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .maybeSingle();
    return (data as Profile) ?? null;
  } catch (err) {
    console.error("getMentorBySlug:", err);
    return null;
  }
}
