import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/format";

export async function POST(request: Request) {
  // Verifica que quem chama é admin.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  let body: { fullName?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  const { fullName, email, password } = body;
  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "mentor" },
  });
  if (error || !created.user) {
    return NextResponse.json(
      { error: error?.message ?? "Falha ao criar usuário." },
      { status: 500 },
    );
  }

  // Garante os dados de mentor no profile (o trigger já criou a linha).
  await admin
    .from("profiles")
    .update({ role: "mentor", full_name: fullName, slug: slugify(fullName) })
    .eq("id", created.user.id);

  return NextResponse.json({ ok: true, id: created.user.id });
}
