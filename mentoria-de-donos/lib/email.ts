import { Resend } from "resend";
import { BRAND } from "@/config/brand";
import { formatDateTime } from "@/lib/format";

/**
 * Envia e-mail de confirmação de sessão. Silencioso (no-op) se RESEND_API_KEY
 * não estiver configurada — o painel serve de fallback.
 */
export async function sendBookingConfirmation(params: {
  to: string;
  mentorName: string;
  startAt: string;
  meetingUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || `${BRAND.name} <onboarding@resend.dev>`;

  try {
    await resend.emails.send({
      from,
      to: params.to,
      subject: `Sua sessão com ${params.mentorName} está confirmada ✅`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2>Sessão confirmada!</h2>
          <p>Sua mentoria com <strong>${params.mentorName}</strong> está agendada para:</p>
          <p style="font-size:18px"><strong>${formatDateTime(params.startAt)}</strong></p>
          <p>Link da sala de vídeo:</p>
          <p><a href="${params.meetingUrl}">${params.meetingUrl}</a></p>
          <hr/>
          <p style="color:#888">${BRAND.name} — ${BRAND.tagline}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Falha ao enviar e-mail de confirmação:", err);
  }
}
