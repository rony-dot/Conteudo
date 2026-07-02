import type { AvailabilityRule, AvailabilityException, Slot } from "@/lib/types";

// Brasil não adota horário de verão desde 2019 — offset fixo -03:00.
const BR_OFFSET = "-03:00";

export const DEFAULT_DURATION_MIN = 60;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DD" no fuso de São Paulo para uma data. */
function brDateString(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

/** Dia da semana (0=dom..6=sáb) no fuso de São Paulo. */
function brWeekday(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00${BR_OFFSET}`).getUTCDay();
}

function addMinutes(iso: string, min: number): string {
  return new Date(new Date(iso).getTime() + min * 60_000).toISOString();
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

export interface BusyInterval {
  start_at: string;
  end_at: string;
}

export interface GenerateSlotsOptions {
  rules: AvailabilityRule[];
  busy?: BusyInterval[];
  exceptions?: AvailabilityException[];
  /** ISO da referência "agora" (default: momento da chamada). */
  now?: Date;
  weeks?: number;
  durationMin?: number;
  /** Antecedência mínima em minutos para agendar (default 120). */
  minLeadMinutes?: number;
}

/**
 * Gera os horários livres de um mentor para as próximas semanas, subtraindo
 * reservas ativas e datas bloqueadas.
 */
export function generateSlots({
  rules,
  busy = [],
  exceptions = [],
  now = new Date(),
  weeks = 3,
  durationMin = DEFAULT_DURATION_MIN,
  minLeadMinutes = 120,
}: GenerateSlotsOptions): Slot[] {
  const slots: Slot[] = [];
  const earliest = new Date(now.getTime() + minLeadMinutes * 60_000);
  const blocked = new Set(
    exceptions.filter((e) => e.is_blocked).map((e) => e.date),
  );
  const days = weeks * 7;

  for (let i = 0; i < days; i++) {
    const day = new Date(now.getTime() + i * 24 * 60 * 60_000);
    const dateStr = brDateString(day);
    if (blocked.has(dateStr)) continue;

    const weekday = brWeekday(dateStr);
    const dayRules = rules.filter((r) => r.weekday === weekday);

    for (const rule of dayRules) {
      const [sh, sm] = rule.start_time.split(":").map(Number);
      const [eh, em] = rule.end_time.split(":").map(Number);
      const windowStart = new Date(
        `${dateStr}T${pad(sh)}:${pad(sm)}:00${BR_OFFSET}`,
      );
      const windowEnd = new Date(
        `${dateStr}T${pad(eh)}:${pad(em)}:00${BR_OFFSET}`,
      );

      let cursor = windowStart.toISOString();
      while (new Date(addMinutes(cursor, durationMin)) <= windowEnd) {
        const slotEnd = addMinutes(cursor, durationMin);
        const isFuture = new Date(cursor) >= earliest;
        const isBusy = busy.some((b) =>
          overlaps(cursor, slotEnd, b.start_at, b.end_at),
        );
        if (isFuture && !isBusy) {
          slots.push({ start: cursor, end: slotEnd });
        }
        cursor = slotEnd;
      }
    }
  }

  slots.sort((a, b) => a.start.localeCompare(b.start));
  return slots;
}

/** Agrupa slots por dia (YYYY-MM-DD em SP) para renderização. */
export function groupSlotsByDay(slots: Slot[]): Record<string, Slot[]> {
  const grouped: Record<string, Slot[]> = {};
  for (const slot of slots) {
    const key = brDateString(new Date(slot.start));
    (grouped[key] ??= []).push(slot);
  }
  return grouped;
}
