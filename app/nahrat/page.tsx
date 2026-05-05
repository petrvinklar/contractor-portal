"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import InvoiceForm from "@/components/InvoiceForm";
import { SubmissionItem } from "@/lib/types";
import Link from "next/link";

interface UploadedFile {
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

export default function NahratPage() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submissionId, setSubmissionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [invoice, setInvoice] = useState({
    invoice_number: "",
    date_issued: "",
    date_due: "",
    date_taxable: "",
    currency: "CZK",
    description: "",
    supplier_name: "",
    supplier_ico: "",
    supplier_dic: "",
    supplier_email: "",
    supplier_contact: "",
    buyer_name: "",
    buyer_ico: "",
    buyer_dic: "",
    bank_account: "",
    bank_code: "",
    iban: "",
    variable_symbol: "",
  });

  const [items, setItems] = useState<SubmissionItem[]>([
    { description: "", quantity: 1, unit_price: 0, vat_rate: 21, total_price: 0, unit: null, cost_center: "", sort_order: 0 },
  ]);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [sourceType, setSourceType] = useState<"manual" | "isdoc" | "pdf">("manual");
  const [isdocRaw, setIsdocRaw] = useState<any>(null);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const fillInvoiceFromData = (data: any) => {
    setInvoice((prev) => ({
      ...prev,
      invoice_number: data.invoice_number || prev.invoice_number,
      date_issued: data.date_issued || prev.date_issued,
      date_due: data.date_due || prev.date_due,
      date_taxable: data.date_taxable || prev.date_taxable,
      currency: data.currency || prev.currency,
      description: data.description || prev.description,
      supplier_name: data.supplier_name || data.company_name || prev.supplier_name,
      supplier_ico: data.supplier_ico || data.ico || prev.supplier_ico,
      supplier_dic: data.supplier_dic || prev.supplier_dic,
      supplier_email: data.email || prev.supplier_email,
      supplier_contact: data.contact_person || prev.supplier_contact,
      buyer_name: data.buyer_name || prev.buyer_name,
      buyer_ico: data.buyer_ico || prev.buyer_ico,
      buyer_dic: data.buyer_dic || prev.buyer_dic,
      bank_account: data.bank_account || prev.bank_account,
      bank_code: data.bank_code || prev.bank_code,
      iban: data.iban || prev.iban,
      variable_symbol: data.variable_symbol || prev.variable_symbol,
    }));
    if (data.items && data.items.length > 0) {
      setItems(data.items);
    }
  };

  const handleIsdocParsed = (data: any) => {
    setSourceType("isdoc");
    setIsdocRaw(data.isdoc_raw || null);
    fillInvoiceFromData(data);
  };

  const handlePdfParsed = (data: any) => {
    setSourceType("pdf");
    fillInvoiceFromData(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    setErrors([]);

    // Client-side validation
    const clientErrors: string[] = [];
    if (!invoice.supplier_email?.trim()) clientErrors.push("Email je povinný");
    items.forEach((item, i) => {
      if (!item.cost_center?.trim()) clientErrors.push(`Položka ${i + 1}: chybí středisko`);
    });
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        company_name: invoice.supplier_name,
        ico: invoice.supplier_ico,
        email: invoice.supplier_email,
        contact_person: invoice.supplier_contact,
        ...invoice,
        items,
        source_type: sourceType,
        isdoc_raw: isdocRaw,
        file_ids: files.map((f) => ({
          storage_path: f.storage_path,
          file_name: f.file_name,
          file_type: f.file_type,
          file_size: f.file_size,
        })),
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrors(result.errors || [result.error || "Odeslání selhalo"]);
        return;
      }

      setSubmissionId(result.id);
      setStep("success");
    } catch (err: any) {
      setErrors([err.message || "Neočekávaná chyba"]);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-green-800 mb-4">Faktura byla odeslána</h1>
          <p className="text-green-700 mb-2">
            ID podání: <span className="font-mono font-bold">{submissionId.slice(0, 8)}</span>
          </p>
          <p className="text-green-600 mb-6">
            Na Váš email jsme zaslali potvrzení o přijetí faktury.
          </p>
          <div className="space-x-4">
            <Link
              href="/registrace"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Vytvořit účet pro sledování
            </Link>
            <button
              onClick={() => {
                setStep("form");
                setInvoice({
                  invoice_number: "", date_issued: "", date_due: "", date_taxable: "",
                  currency: "CZK", description: "", supplier_name: "", supplier_ico: "",
                  supplier_dic: "", supplier_email: "", supplier_contact: "",
                  buyer_name: "", buyer_ico: "", buyer_dic: "",
                  bank_account: "", bank_code: "", iban: "", variable_symbol: "",
                });
                setItems([{ description: "", quantity: 1, unit_price: 0, vat_rate: 21, total_price: 0, unit: null, cost_center: "", sort_order: 0 }]);
                setFiles([]);
                setSourceType("manual");
                setIsdocRaw(null);
                setTriedSubmit(false);
              }}
              className="inline-block px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Odeslat další fakturu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Nahrát fakturu</h1>
      <p className="text-gray-600 mb-6">
        Fakturu můžete podat i bez registrace. Pokud si chcete sledovat stav úhrady,{" "}
        <Link href="/registrace" className="text-blue-600 hover:underline">
          zaregistrujte se
        </Link>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Krok 1: Nahrání souboru */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Nahrát soubory</h2>
          <p className="text-sm text-gray-500 mb-3">
            Nahrajte PDF nebo ISDOC fakturu — údaje se automaticky předvyplní.
          </p>
          <FileUpload
            onFilesUploaded={setFiles}
            onIsdocParsed={handleIsdocParsed}
            onPdfParsed={handlePdfParsed}
          />
        </div>

        {/* PDF flow: full editable form */}
        {sourceType === "pdf" && (
          <div className="bg-white rounded-lg border p-6">
            <InvoiceForm
              data={invoice}
              items={items}
              onChange={setInvoice}
              onItemsChange={setItems}
              triedSubmit={triedSubmit}
            />
          </div>
        )}

        {/* ISDOC flow: compact summary + cost center fields */}
        {sourceType === "isdoc" && (
          <div className="bg-white rounded-lg border p-6 space-y-6">
            <h2 className="text-lg font-semibold">Shrnutí faktury</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Dodavatel</p>
                <p className="font-medium">{invoice.supplier_name || "—"}</p>
                <p className="text-sm text-gray-600">{invoice.supplier_ico ? `IČO: ${invoice.supplier_ico}` : ""}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Číslo faktury</p>
                <p className="font-medium">{invoice.invoice_number || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Datum splatnosti</p>
                <p className="font-medium">{invoice.date_due || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Celková částka</p>
                <p className="font-medium">
                  {items.reduce((sum, item) => {
                    const withoutVat = item.total_price || 0;
                    const vat = withoutVat * ((item.vat_rate || 0) / 100);
                    return sum + withoutVat + vat;
                  }, 0).toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} {invoice.currency}
                </p>
              </div>
            </div>

            {/* Email — required, not in ISDOC data */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Váš email *</label>
              <input
                type="email"
                value={invoice.supplier_email}
                onChange={(e) => setInvoice((prev) => ({ ...prev, supplier_email: e.target.value }))}
                className={`mt-1 block w-full max-w-md rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  triedSubmit && !invoice.supplier_email?.trim() ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                placeholder="email@firma.cz"
                required
              />
              {triedSubmit && !invoice.supplier_email?.trim() && (
                <p className="text-red-600 text-xs mt-1">Email je povinný</p>
              )}
            </div>

            {/* Items with cost center */}
            <div>
              <h3 className="text-md font-semibold mb-2">Položky</h3>
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
                Středisko musí sdělit objednatel. Pokud má faktura více řádků, uveďte středisko u každého.
              </p>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Popis</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Množství</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Cena/ks</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">DPH</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Celkem</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Středisko *</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{item.description || "—"}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{item.unit_price.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 text-right">{item.vat_rate}%</td>
                        <td className="px-3 py-2 text-right">{item.total_price.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.cost_center || ""}
                            onChange={(e) => {
                              const updated = items.map((it, j) =>
                                j === i ? { ...it, cost_center: e.target.value } : it
                              );
                              setItems(updated);
                            }}
                            className={`block w-full rounded-md border px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                              triedSubmit && !item.cost_center?.trim() ? "border-red-500 bg-red-50" : "border-gray-300"
                            }`}
                            placeholder="např. 101"
                            required
                          />
                          {triedSubmit && !item.cost_center?.trim() && (
                            <p className="text-red-600 text-xs mt-1">Povinné</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <ul className="list-disc list-inside text-red-700 text-sm">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit — only show after file is parsed */}
        {sourceType !== "manual" && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {submitting ? "Odesílám..." : "Odeslat fakturu"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
