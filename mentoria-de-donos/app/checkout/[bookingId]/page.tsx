import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { formatBRL, formatDateTime } from "@/lib/format";
import { PayButton } from "@/components/PayButton";
import type { Booking } from "@/lib/types";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { bookingId } = await params;
  const { status } = await searchParams;

  const user = await getUser();
  if (!user) redirect(`/auth/login?next=/checkout/${bookingId}`);

  const supabase = await createClient();
  const { data: bookingRow } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();
  if (!bookingRow) notFound();
  const booking = bookingRow as Booking;

  const { data: mentor } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, headline")
    .eq("id", booking.mentor_id)
    .maybeSingle();

  const confirmed = booking.status === "confirmed";

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <div className="card">
        {confirmed ? (
          <>
            <h1 className="text-2xl font-bold text-green-400">
              Sessão confirmada! 🎉
            </h1>
            <p className="mt-2 text-[var(--muted)]">
              Sua mentoria está agendada. O link da videochamada está no seu
              painel.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Confirmar e pagar</h1>
            {status === "pending" && (
              <p className="mt-2 text-sm text-yellow-400">
                Seu pagamento está em processamento. Assim que for aprovado, a
                sessão será confirmada.
              </p>
            )}
            {status === "failure" && (
              <p className="mt-2 text-sm text-red-400">
                O pagamento não foi concluído. Você pode tentar novamente.
              </p>
            )}
          </>
        )}

        <div className="mt-6 flex items-center gap-4 border-t border-[var(--line)] pt-6">
          <img
            src={
              mentor?.avatar_url ||
              `https://i.pravatar.cc/120?u=${booking.mentor_id}`
            }
            alt={mentor?.full_name ?? "mentor"}
            className="h-14 w-14 rounded-full object-cover"
          />
          <div>
            <p className="font-bold">{mentor?.full_name}</p>
            <p className="text-sm text-[var(--muted)]">{mentor?.headline}</p>
          </div>
        </div>

        <div className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Data e hora</span>
            <span className="font-medium">
              {formatDateTime(booking.start_at)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted)]">Duração</span>
            <span className="font-medium">{booking.duration_min} min</span>
          </div>
          <div className="flex justify-between border-t border-[var(--line)] pt-2 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-brand">
              {formatBRL(booking.price_cents)}
            </span>
          </div>
        </div>

        <div className="mt-8">
          {confirmed ? (
            <Link href="/dashboard" className="btn w-full">
              Ir para o painel
            </Link>
          ) : (
            <PayButton bookingId={booking.id} />
          )}
        </div>
      </div>
    </div>
  );
}
