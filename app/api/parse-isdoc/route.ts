import { NextRequest, NextResponse } from "next/server";
import { parseIsdoc } from "@/lib/isdoc-parser";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Chybí soubor" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = parseIsdoc(buffer);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Parsování ISDOC selhalo: ${err.message}` },
      { status: 400 }
    );
  }
}
