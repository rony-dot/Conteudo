import Link from "next/link";
import type { Profile } from "@/lib/types";
import { formatBRL } from "@/lib/format";

export function MentorCard({ mentor }: { mentor: Profile }) {
  return (
    <Link
      href={`/mentores/${mentor.slug ?? mentor.id}`}
      className="card group flex flex-col transition hover:-translate-y-1 hover:border-brand"
    >
      <div className="flex items-center gap-4">
        <img
          src={
            mentor.avatar_url ||
            `https://i.pravatar.cc/120?u=${mentor.id}`
          }
          alt={mentor.full_name}
          className="h-16 w-16 rounded-full object-cover"
        />
        <div className="min-w-0">
          <h3 className="truncate font-bold">{mentor.full_name}</h3>
          <p className="truncate text-sm text-[var(--muted)]">
            {mentor.headline}
          </p>
        </div>
      </div>
      {mentor.bio && (
        <p className="mt-4 line-clamp-3 text-sm text-[var(--muted)]">
          {mentor.bio}
        </p>
      )}
      {mentor.expertise?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {mentor.expertise.slice(0, 3).map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
        <span className="text-sm text-[var(--muted)]">a partir de</span>
        <span className="font-bold text-brand">
          {formatBRL(mentor.hourly_rate_cents)}
          <span className="text-xs font-normal text-[var(--muted)]">/hora</span>
        </span>
      </div>
    </Link>
  );
}
