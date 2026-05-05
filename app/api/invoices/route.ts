import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase-server";
import { validateSubmission } from "@/lib/validators";
import { sendContractorConfirmation, sendAdminNotification } from "@/lib/resend";
import { SubmissionFormData } from "@/lib/types";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);

// POST: Submit new invoice (public)
export async function POST(req: NextRequest) {
  let body: SubmissionFormData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }

  const errors = validateSubmission(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // Calculate totals from items
  let totalWithoutVat = 0;
  let totalAmount = 0;
  const items = (body.items || []).map((item, i) => {
    const qty = item.quantity || 1;
    const price = item.unit_price || 0;
    const lineTotal = qty * price;
    const vatAmount = lineTotal * ((item.vat_rate || 0) / 100);
    totalWithoutVat += lineTotal;
    totalAmount += lineTotal + vatAmount;
    return {
      description: item.description,
      quantity: qty,
      unit_price: price,
      vat_rate: item.vat_rate ?? 21,
      total_price: Math.round(lineTotal * 100) / 100,
      unit: item.unit || null,
      cost_center: item.cost_center || null,
      sort_order: i,
    };
  });

  totalWithoutVat = Math.round(totalWithoutVat * 100) / 100;
  totalAmount = Math.round(totalAmount * 100) / 100;

  // Try to link to existing contractor
  let contractorId: string | null = null;
  const { data: profile } = await supabaseAdmin
    .from("contractor_profiles")
    .select("id")
    .eq("ico", body.ico)
    .maybeSingle();
  if (profile) contractorId = profile.id;

  // Insert submission
  const { data: submission, error: insertErr } = await supabaseAdmin
    .from("contractor_submissions")
    .insert({
      company_name: body.company_name,
      ico: body.ico,
      email: body.email,
      contact_person: body.contact_person || null,
      contractor_id: contractorId,
      invoice_number: body.invoice_number || null,
      date_issued: body.date_issued || null,
      date_due: body.date_due || null,
      date_taxable: body.date_taxable || null,
      total_amount: body.total_amount ?? totalAmount,
      total_without_vat: body.total_without_vat ?? totalWithoutVat,
      currency: body.currency || "CZK",
      description: body.description || null,
      supplier_name: body.supplier_name || null,
      supplier_ico: body.supplier_ico || null,
      supplier_dic: body.supplier_dic || null,
      buyer_name: body.buyer_name || null,
      buyer_ico: body.buyer_ico || null,
      buyer_dic: body.buyer_dic || null,
      bank_account: body.bank_account || null,
      bank_code: body.bank_code || null,
      iban: body.iban || null,
      variable_symbol: body.variable_symbol || null,
      source_type: body.source_type || "manual",
      isdoc_raw: body.isdoc_raw || null,
    })
    .select("id")
    .single();

  if (insertErr || !submission) {
    return NextResponse.json(
      { error: `Uložení selhalo: ${insertErr?.message}` },
      { status: 500 }
    );
  }

  // Insert items
  if (items.length > 0) {
    const { error: itemsErr } = await supabaseAdmin
      .from("contractor_submission_items")
      .insert(items.map((item) => ({ ...item, submission_id: submission.id })));
    if (itemsErr) {
      console.error("Items insert error:", itemsErr);
    }
  }

  // Link uploaded files
  if (body.file_ids && body.file_ids.length > 0) {
    const fileRecords = body.file_ids.map((f) => ({
      submission_id: submission.id,
      file_name: f.file_name,
      file_type: f.file_type,
      file_size: f.file_size,
      storage_path: f.storage_path,
    }));
    const { error: filesErr } = await supabaseAdmin
      .from("contractor_submission_files")
      .insert(fileRecords);
    if (filesErr) {
      console.error("Files insert error:", filesErr);
    }
  }

  // Send emails (non-blocking)
  sendContractorConfirmation(body.email, submission.id, body.company_name).catch(console.error);
  sendAdminNotification(
    submission.id,
    body.company_name,
    body.ico,
    `${totalAmount} ${body.currency || "CZK"}`
  ).catch(console.error);

  return NextResponse.json({ id: submission.id }, { status: 201 });
}

// GET: List invoices (auth required)
export async function GET(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email || "");

  let query = supabaseAdmin
    .from("contractor_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    // Look up the user's profile to also match by IČO
    const { data: profile } = await supabaseAdmin
      .from("contractor_profiles")
      .select("ico")
      .eq("id", user.id)
      .maybeSingle();

    const filters = [`contractor_id.eq.${user.id}`, `email.eq.${user.email}`];
    if (profile?.ico) {
      filters.push(`ico.eq.${profile.ico}`);
    }
    query = query.or(filters.join(","));
  }

  const status = req.nextUrl.searchParams.get("status");
  if (status) {
    query = query.eq("status", status);
  }

  const search = req.nextUrl.searchParams.get("search");
  if (search) {
    query = query.or(
      `company_name.ilike.%${search}%,ico.ilike.%${search}%,invoice_number.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
