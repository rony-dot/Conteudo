"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminMentorToggle({
  mentorId,
  published,
}: {
  mentorId: string;
  published: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(published);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = !isPublished;
    const { error } = await supabase
      .from("profiles")
      .update({ is_published: next })
      .eq("id", mentorId);
    setLoading(false);
    if (!error) {
      setIsPublished(next);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={isPublished ? "btn-ghost" : "btn"}
    >
      {loading ? "..." : isPublished ? "Despublicar" : "Publicar"}
    </button>
  );
}
