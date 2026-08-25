import Link from "next/link";
import { formatDateTime, formatBRL } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: "Aguardando pagamento",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Concluída",
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending_payment: "border-yellow-500/40 text-yellow-400",
  confirmed: "border-green-500/40 text-green-400",
  cancelled: "border-red-500/40 text-red-400",
  completed: "border-[var(--line)] text-[var(--muted)]",
};

export function BookingRow({
  counterpartName,
  counterpartAvatar,
  startAt,
  status,
  priceCents,
  meetingUrl,
  bookingId,
  showPayLink,
}: {
  counterpartName: string;
  counterpartAvatar: string | null;
  startAt: string;
  status: BookingStatus;
  priceCents: number;
  meetingUrl: string | null;
  bookingId: string;
  showPayLink?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--line)] bg-[var(--panel2)] p-4">
      <img
        src={counterpartAvatar || `https://i.pravatar.cc/80?u=${bookingId}`}
        alt={counterpartName}
        className="h-11 w-11 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{counterpartName}</p>
        <p className="text-sm text-[var(--muted)]">{formatDateTime(startAt)}</p>
      </div>
      <span className="font-medium text-[var(--muted)]">
        {formatBRL(priceCents)}
      </span>
      <span className={`chip ${STATUS_STYLE[status]}`}>
        {STATUS_LABEL[status]}
      </span>
      {status === "confirmed" && meetingUrl && (
        <a href={meetingUrl} target="_blank" rel="noreferrer" className="btn">
          Entrar na sala
        </a>
      )}
      {status === "pending_payment" && showPayLink && (
        <Link href={`/checkout/${bookingId}`} className="btn-ghost">
          Pagar
        </Link>
      )}
    </div>
  );
}
