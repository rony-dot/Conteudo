"use client";

import { useState } from "react";

export function PayButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mp/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok || !data.init_point) {
        throw new Error(data.error || "Falha ao iniciar o pagamento.");
      }
      window.location.href = data.init_point;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={pay} className="btn w-full" disabled={loading}>
        {loading ? "Redirecionando..." : "Pagar com Pix ou cartão"}
      </button>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
