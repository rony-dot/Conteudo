"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Slot } from "@/lib/types";
import { formatBRL, formatTime } from "@/lib/format";

function dayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00-03:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

export function BookingCalendar({
  mentorId,
  priceCents,
  slotsByDay,
  isLoggedIn,
}: {
  mentorId: string;
  priceCents: number;
  slotsByDay: Record<string, Slot[]>;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const days = Object.keys(slotsByDay).sort();
  const [selectedDay, setSelectedDay] = useState(days[0] ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function book(slot: Slot) {
    setError(null);
    if (!isLoggedIn) {
      router.push(`/auth/login?next=/mentores/${mentorId}`);
      return;
    }
    setLoading(slot.start);
    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId,
          start: slot.start,
          end: slot.end,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao reservar horário.");
      router.push(`/checkout/${data.bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(null);
    }
  }

  if (days.length === 0) {
    return (
      <div className="card">
        <p className="text-[var(--muted)]">
          Este mentor ainda não tem horários disponíveis. Volte em breve.
        </p>
      </div>
    );
  }

  const slots = slotsByDay[selectedDay] ?? [];

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Agende sua sessão</h2>
        <span className="font-bold text-brand">
          {formatBRL(priceCents)}
          <span className="text-xs font-normal text-[var(--muted)]">/hora</span>
        </span>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm capitalize ${
              d === selectedDay
                ? "border-brand bg-brand/10 text-brand"
                : "border-[var(--line)] text-[var(--muted)]"
            }`}
          >
            {dayLabel(d)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => (
          <button
            key={slot.start}
            onClick={() => book(slot)}
            disabled={loading !== null}
            className="rounded-lg border border-[var(--line)] py-2 text-sm font-medium transition hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {loading === slot.start ? "..." : formatTime(slot.start)}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <p className="mt-4 text-xs text-[var(--muted)]">
        Ao escolher um horário você será levado ao pagamento (Pix ou cartão). A
        sessão fica reservada por 15 minutos até a confirmação.
      </p>
    </div>
  );
}
