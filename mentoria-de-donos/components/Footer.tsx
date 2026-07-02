import { BRAND } from "@/config/brand";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] px-5 py-10 text-center text-sm text-[var(--muted)]">
      <p className="font-semibold text-[var(--text)]">{BRAND.name}</p>
      <p className="mt-1">{BRAND.tagline}</p>
      <p className="mt-4 opacity-70">
        © {new Date().getFullYear()} {BRAND.name}. Marketplace de mentoria.
      </p>
    </footer>
  );
}
