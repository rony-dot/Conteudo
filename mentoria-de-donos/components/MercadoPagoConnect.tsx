/**
 * Card de conexão da conta Mercado Pago do mentor (split de pagamento).
 * Server component — apenas um link para iniciar o OAuth.
 */
export function MercadoPagoConnect({
  connected,
  notice,
}: {
  connected: boolean;
  notice?: string;
}) {
  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Recebimento (Mercado Pago)</h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
            Conecte sua conta Mercado Pago para receber o valor das mentorias{" "}
            <strong>direto na sua conta</strong> (no seu CPF/CNPJ). A plataforma
            desconta apenas a comissão automaticamente — sem repasse manual.
          </p>
        </div>
        {connected ? (
          <span className="chip border-green-500/40 text-green-400">
            ● Conta conectada
          </span>
        ) : (
          <a href="/api/mp/oauth/start" className="btn shrink-0">
            Conectar Mercado Pago
          </a>
        )}
      </div>

      {notice === "ok" && (
        <p className="mt-4 text-sm text-green-400">
          Conta conectada com sucesso! Você já pode publicar seu perfil.
        </p>
      )}
      {notice === "error" && (
        <p className="mt-4 text-sm text-red-400">
          Não foi possível conectar. Tente novamente.
        </p>
      )}
      {notice === "config" && (
        <p className="mt-4 text-sm text-yellow-400">
          Pagamentos ainda não configurados pela plataforma. Fale com o suporte.
        </p>
      )}
    </div>
  );
}
