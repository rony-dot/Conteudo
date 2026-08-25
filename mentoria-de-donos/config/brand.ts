/**
 * Configuração central da marca.
 * Trocar o nome/cores do produto é uma mudança de uma linha aqui.
 */
export const BRAND = {
  name: "Mentoria de Donos",
  shortName: "MdD",
  tagline: "Aprenda com quem já construiu.",
  description:
    "Marketplace de mentoria: contrate uma hora com donos de negócio e líderes executivos de verdade. Escolha o mentor, o horário e pague com Pix.",
  // Alternativas consideradas: "Hora Mentor", "Mentores Prime", "Mentoraê", "Mentorlab".
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supportEmail: "contato@mentoriadedonos.com.br",
  currency: "BRL",
  locale: "pt-BR",
  // Taxa da plataforma sobre cada sessão (padrão 15%).
  platformFeePercent: Number(process.env.PLATFORM_FEE_PERCENT ?? 15),
  colors: {
    // Paleta âmbar/terracota, alinhada às landing pages existentes do Conteudo.
    accent: "#f97316",
    accentDark: "#e8530e",
    ink: "#0c0a09",
  },
} as const;

export type Brand = typeof BRAND;
