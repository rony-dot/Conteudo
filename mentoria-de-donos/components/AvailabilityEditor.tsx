"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AvailabilityRule } from "@/lib/types";

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export function AvailabilityEditor({
  mentorId,
  initialRules,
}: {
  mentorId: string;
  initialRules: AvailabilityRule[];
}) {
  const supabase = createClient();
  const [rules, setRules] = useState<AvailabilityRule[]>(initialRules);
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("12:00");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function addRule() {
    setError(null);
    if (end <= start) {
      setError("O horário final deve ser maior que o inicial.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("availability_rules")
      .insert({
        mentor_id: mentorId,
        weekday,
        start_time: start,
        end_time: end,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setRules((r) => [...r, data as AvailabilityRule]);
  }

  async function removeRule(id: string) {
    setRules((r) => r.filter((x) => x.id !== id));
    await supabase.from("availability_rules").delete().eq("id", id);
  }

  const byDay = WEEKDAYS.map((_, d) =>
    rules
      .filter((r) => r.weekday === d)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  );

  return (
    <div className="card">
      <h2 className="text-lg font-bold">Disponibilidade semanal</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Adicione as faixas de horário em que você atende. Elas se repetem toda
        semana (fuso de Brasília).
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Dia</label>
          <select
            className="input"
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
          >
            {WEEKDAYS.map((w, i) => (
              <option key={i} value={i}>
                {w}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Início</label>
          <input
            type="time"
            className="input"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Fim</label>
          <input
            type="time"
            className="input"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn"
          onClick={addRule}
          disabled={saving}
        >
          Adicionar
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-6 space-y-3">
        {byDay.map((dayRules, d) =>
          dayRules.length > 0 ? (
            <div key={d} className="flex flex-wrap items-center gap-2">
              <span className="w-24 shrink-0 font-semibold">{WEEKDAYS[d]}</span>
              {dayRules.map((r) => (
                <span
                  key={r.id}
                  className="chip gap-2 text-[var(--text)]"
                >
                  {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                  <button
                    type="button"
                    onClick={() => removeRule(r.id)}
                    className="text-red-400 hover:text-red-300"
                    aria-label="Remover"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          ) : null,
        )}
        {rules.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            Nenhum horário cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
