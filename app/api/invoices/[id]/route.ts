import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase-server";
import { validateStatusTransition } from "@/lib/validators";
import { sendStatusChange } from "@/lib/resend";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);

// GET: Detail of a submission
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email || "");

  const { data: submission, error } = await supabaseAdmin
    .from("contractor_submissions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !submission) {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }

  // Check access: match by contractor_id, email, or ICO (same as list endpoint)
  if (!isAdmin) {
    const { data: profile } = await supabaseAdmin
      .from("contractor_profiles")
      .select("ico")
      .eq("id", user.id)
      .maybeSingle();

    const hasAccess =
      submission.contractor_id === user.id ||
      submission.email === user.email ||
      (profile?.ico && submission.ico === profile.ico);

    if (!hasAccess) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }
  }

  // Load items and files
  const [{ data: items }, { data: files }] = await Promise.all([
    supabaseAdmin
      .from("contractor_submission_items")
      .select("*")
      .eq("submission_id", params.id)
      .order("sort_order"),
    supabaseAdmin
      .from("contractor_submission_files")
      .select("*")
      .eq("submission_id", params.id),
  ]);

  return NextResponse.json({ ...submission, items: items || [], files: files || [] });
}

// PATCH: Update status (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
  }

  const { status, admin_note } = await req.json();

  // Get current submission
  const { data: submission, error: fetchErr } = await supabaseAdmin
    .from("contractor_submissions")
    .select("status, email, company_name")
    .eq("id", params.id)
    .single();

  if (fetchErr || !submission) {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }

  if (!validateStatusTransition(submission.status, status)) {
    return NextResponse.json(
      { error: `Nelze změnit stav z "${submission.status}" na "${status}"` },
      { status: 400 }
    );
  }

  const { error: updateErr } = await supabaseAdmin
    .from("contractor_submissions")
    .update({
      status,
      admin_note: admin_note || null,
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Send status change email
  sendStatusChange(submission.email, params.id, status, admin_note).catch(console.error);

  return NextResponse.json({ ok: true });
}
