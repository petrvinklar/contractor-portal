import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Chybí soubor" }, { status: 400 });
  }

  const allowedTypes = ["application/pdf", "text/xml", "application/xml", "application/octet-stream"];
  const allowedExtensions = [".pdf", ".xml", ".isdoc", ".isdocx"];
  const ext = file.name.toLowerCase().split(".").pop() || "";
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(`.${ext}`)) {
    return NextResponse.json(
      { error: "Povolené formáty: PDF, ISDOC, ISDOCX, XML" },
      { status: 400 }
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Maximální velikost souboru je 10 MB" },
      { status: 400 }
    );
  }

  const storagePath = `${randomUUID()}.${ext || "pdf"}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("contractor-invoices")
    .upload(storagePath, buffer, {
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Upload selhal: ${uploadError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    storage_path: storagePath,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
  });
}
