import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, company_name, ico, contact_person, phone } = body;

  if (!email || !password || !company_name || !ico) {
    return NextResponse.json(
      { error: "Vyplňte všechna povinná pole" },
      { status: 400 },
    );
  }

  // Create user with admin client (auto-confirms email)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.includes("already been registered")
      ? "Uživatel s tímto emailem již existuje"
      : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (authData.user) {
    // Create contractor profile
    const { error: profileError } = await supabaseAdmin
      .from("contractor_profiles")
      .insert({
        id: authData.user.id,
        company_name,
        ico,
        contact_person: contact_person || null,
        phone: phone || null,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }
  }

  return NextResponse.json({ success: true });
}
