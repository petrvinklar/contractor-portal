import { NextRequest, NextResponse } from "next/server";
import { parseIsdoc } from "@/lib/isdoc-parser";
import AdmZip from "adm-zip";

function extractIsdocFromZip(buffer: Buffer): Buffer {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntries().find((e) => e.entryName.endsWith(".isdoc"));
  if (!entry) {
    throw new Error("ISDOCX archiv neobsahuje .isdoc soubor");
  }
  return entry.getData();
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Chybí soubor" }, { status: 400 });
  }

  try {
    const raw = Buffer.from(await file.arrayBuffer());

    // ISDOCX is a ZIP containing the .isdoc XML (PK magic bytes)
    const isZip = file.name.endsWith(".isdocx") || (raw[0] === 0x50 && raw[1] === 0x4b);
    const buffer = isZip ? extractIsdocFromZip(raw) : raw;

    const data = parseIsdoc(buffer);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Parsování ISDOC selhalo: ${err.message}` },
      { status: 400 }
    );
  }
}
