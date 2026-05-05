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
    // If user already exists, confirm email + update password
    if (authError.message.includes("already been registered")) {
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existing = users?.users?.find((u) => u.email === email);
      if (existing) {
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
        });
        // Upsert profile
        await supabaseAdmin
          .from("contractor_profiles")
          .upsert({
            id: existing.id,
            company_name,
            ico,
            contact_person: contact_person || null,
            phone: phone || null,
          });
        return NextResponse.json({ success: true });
      }
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
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
