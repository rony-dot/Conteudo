"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { slugify } from "@/lib/format";

export function MentorProfileForm({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile.full_name);
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [linkedin, setLinkedin] = useState(profile.linkedin_url ?? "");
  const [expertise, setExpertise] = useState<string[]>(profile.expertise ?? []);
  const [tagInput, setTagInput] = useState("");
  const [rate, setRate] = useState(
    profile.hourly_rate_cents ? String(profile.hourly_rate_cents / 100) : "",
  );
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [published, setPublished] = useState(profile.is_published);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function addTag() {
    const t = tagInput.trim();
    if (t && !expertise.includes(t)) setExpertise((e) => [...e, t]);
    setTagInput("");
  }

  async function uploadAvatar(file: File) {
    setError(null);
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) {
      setError(`Falha no upload: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
  }

  async function save(publish: boolean) {
    setSaving(true);
    setError(null);
    setMsg(null);

    const rateCents = Math.round(parseFloat(rate || "0") * 100);
    if (publish) {
      if (!fullName || !headline || !rateCents) {
        setError("Preencha nome, headline e preço/hora antes de publicar.");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        role: "mentor",
        full_name: fullName,
        slug: profile.slug ?? slugify(fullName),
        headline,
        bio,
        linkedin_url: linkedin || null,
        expertise,
        hourly_rate_cents: rateCents || null,
        avatar_url: avatarUrl || null,
        is_published: publish ? true : published,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (publish) setPublished(true);
    setMsg(publish ? "Perfil publicado! 🎉" : "Alterações salvas.");
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold">Seu perfil profissional</h2>

      <div className="mt-5 flex items-center gap-4">
        <img
          src={avatarUrl || `https://i.pravatar.cc/120?u=${profile.id}`}
          alt="avatar"
          className="h-20 w-20 rounded-full object-cover"
        />
        <label className="btn-ghost cursor-pointer">
          Trocar foto
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && uploadAvatar(e.target.files[0])
            }
          />
        </label>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nome completo *</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Preço por hora (R$) *</label>
          <input
            type="number"
            min="0"
            step="10"
            className="input"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Headline * (ex.: Fundadora & CEO — SaaS)</label>
        <input
          className="input"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label className="label">Bio</label>
        <textarea
          className="input min-h-28"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label className="label">LinkedIn (URL)</label>
        <input
          className="input"
          placeholder="https://linkedin.com/in/..."
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label className="label">Áreas de expertise</label>
        <div className="flex gap-2">
          <input
            className="input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Digite e pressione Enter"
          />
          <button type="button" className="btn-ghost" onClick={addTag}>
            Adicionar
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {expertise.map((tag) => (
            <span key={tag} className="chip gap-2 text-[var(--text)]">
              {tag}
              <button
                type="button"
                onClick={() =>
                  setExpertise((e) => e.filter((t) => t !== tag))
                }
                className="text-red-400"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {msg && <p className="mt-4 text-sm text-green-400">{msg}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => save(false)}
          disabled={saving}
        >
          Salvar rascunho
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => save(true)}
          disabled={saving}
        >
          {published ? "Salvar e manter publicado" : "Publicar perfil"}
        </button>
        {published && (
          <span className="chip self-center border-green-500/40 text-green-400">
            ● Publicado
          </span>
        )}
      </div>
    </div>
  );
}
