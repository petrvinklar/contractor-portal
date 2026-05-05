import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

async function callGeminiRaw(parts: any[], responseMimeType?: string): Promise<any> {
  const maxRetries = 3;
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      ...(responseMimeType ? { responseMimeType } : {}),
    },
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      },
    );

    if (res.ok) return res.json();

    if ((res.status === 503 || res.status === 429) && attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.warn(`[parse-pdf] Gemini ${res.status}, retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    const errBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  throw new Error("Gemini API: max retries exceeded");
}

function extractGeminiText(data: any): string {
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];

  let fullText = "";
  for (const p of parts) {
    if (p.text && !p.thought) fullText += p.text;
  }
  if (!fullText) {
    for (const p of parts) {
      if (p.text) fullText += p.text;
    }
  }

  if (!fullText) {
    throw new Error(`No response from Gemini (finishReason: ${candidate?.finishReason})`);
  }
  return fullText;
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Chybí soubor" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfBase64 = buffer.toString("base64");

    const prompt = `Analyzuj přiloženou PDF fakturu a extrahuj z ní všechny fakturační údaje.

Odpověz POUZE platným JSON objektem, bez markdown, bez vysvětlení.

Formát:
{
  "invoice_number": "číslo faktury",
  "date_issued": "YYYY-MM-DD",
  "date_due": "YYYY-MM-DD",
  "date_taxable": "YYYY-MM-DD",
  "currency": "CZK",
  "description": "krátký popis co se fakturuje",
  "supplier_name": "název dodavatele",
  "supplier_ico": "IČO dodavatele",
  "supplier_dic": "DIČ dodavatele",
  "buyer_name": "název odběratele",
  "buyer_ico": "IČO odběratele",
  "buyer_dic": "DIČ odběratele",
  "bank_account": "číslo účtu",
  "bank_code": "kód banky",
  "iban": "IBAN pokud je uveden",
  "variable_symbol": "variabilní symbol",
  "contact_person": "kontaktní osoba dodavatele pokud je uvedena",
  "email": "email dodavatele pokud je uveden",
  "items": [
    {
      "description": "popis položky",
      "quantity": 1,
      "unit_price": 0,
      "vat_rate": 21,
      "total_price": 0,
      "unit": "ks",
      "sort_order": 0
    }
  ]
}

Pravidla:
- Datumy vždy ve formátu YYYY-MM-DD
- Částky jako čísla (ne stringy)
- Pokud údaj není na faktuře uveden, použij prázdný string "" pro texty a 0 pro čísla
- IČO a DIČ vždy jako string
- Pokud je číslo účtu ve formátu "123456/0100", rozděl na bank_account="123456" a bank_code="0100"
- Položky (items) extrahuj všechny řádky faktury
- unit může být: ks, hod, m2, m3, km, den, měsíc, rok, nebo null
- vat_rate: sazba DPH v procentech (typicky 0, 12, nebo 21)`;

    const data = await callGeminiRaw(
      [
        { inlineData: { mimeType: "application/pdf", data: pdfBase64 } },
        { text: prompt },
      ],
      "application/json",
    );

    const text = extractGeminiText(data);
    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      // Try to extract JSON from potential markdown wrapping
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Gemini returned invalid JSON");
      }
    }

    // Normalize items
    if (parsed.items && Array.isArray(parsed.items)) {
      parsed.items = parsed.items.map((item: any, i: number) => ({
        description: String(item.description || ""),
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        vat_rate: Number(item.vat_rate) || 21,
        total_price: Number(item.total_price) || 0,
        unit: item.unit || null,
        sort_order: i,
      }));
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[parse-pdf] Error:", err);
    return NextResponse.json(
      { error: `Analýza PDF selhala: ${err.message}` },
      { status: 500 },
    );
  }
}
