import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { MentorProfileForm } from "@/components/MentorProfileForm";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";
import { MercadoPagoConnect } from "@/components/MercadoPagoConnect";
import type { AvailabilityRule } from "@/lib/types";

export default async function MentorOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ mp?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/login?next=/onboarding/mentor");

  const { mp } = await searchParams;

  const supabase = await createClient();
  const { data: rules } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("mentor_id", profile.id);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Monte seu perfil de mentor</h1>
        <p className="mt-2 text-[var(--muted)]">
          Complete o perfil, conecte o recebimento, defina sua disponibilidade e
          publique para começar a receber agendamentos.{" "}
          {profile.is_published && (
            <Link
              href={`/mentores/${profile.slug ?? profile.id}`}
              className="text-brand"
            >
              Ver meu perfil público →
            </Link>
          )}
        </p>
      </div>

      <div className="space-y-6">
        <MentorProfileForm profile={profile} mpConnected={profile.mp_connected} />
        <MercadoPagoConnect connected={profile.mp_connected} notice={mp} />
        <AvailabilityEditor
          mentorId={profile.id}
          initialRules={(rules as AvailabilityRule[]) ?? []}
        />
      </div>
    </div>
  );
}
