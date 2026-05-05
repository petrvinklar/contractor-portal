"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

interface SubmissionDetail {
  id: string;
  company_name: string;
  ico: string;
  email: string;
  contact_person: string | null;
  invoice_number: string | null;
  date_issued: string | null;
  date_due: string | null;
  date_taxable: string | null;
  total_amount: number | null;
  total_without_vat: number | null;
  currency: string;
  description: string | null;
  supplier_name: string | null;
  supplier_ico: string | null;
  supplier_dic: string | null;
  buyer_name: string | null;
  buyer_ico: string | null;
  buyer_dic: string | null;
  bank_account: string | null;
  bank_code: string | null;
  iban: string | null;
  variable_symbol: string | null;
  status: string;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  source_type: string;
  created_at: string;
  updated_at: string;
  items: any[];
  files: any[];
}

const TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  received: [
    { label: "Přijmout ke zpracování", next: "reviewing", color: "bg-yellow-500 hover:bg-yellow-600" },
    { label: "Zamítnout", next: "rejected", color: "bg-red-500 hover:bg-red-600" },
  ],
  reviewing: [
    { label: "Schválit", next: "approved", color: "bg-green-500 hover:bg-green-600" },
    { label: "Zamítnout", next: "rejected", color: "bg-red-500 hover:bg-red-600" },
  ],
  approved: [
    { label: "Označit jako zaplaceno", next: "paid", color: "bg-emerald-500 hover:bg-emerald-600" },
  ],
  rejected: [],
  paid: [],
};

export default function AdminDetailPage() {
  const params = useParams();
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/invoices/${params.id}`);
      if (!res.ok) {
        setError("Nenalezeno");
        setLoading(false);
        return;
      }
      const d = await res.json();
      setData(d);
      setAdminNote(d.admin_note || "");
      setLoading(false);
    };
    load();
  }, [params.id]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    const res = await fetch(`/api/invoices/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, admin_note: adminNote }),
    });

    if (res.ok) {
      // Reload
      const r = await fetch(`/api/invoices/${params.id}`);
      if (r.ok) setData(await r.json());
    } else {
      const err = await res.json();
      alert(err.error || "Chyba");
    }
    setUpdating(false);
  };

  const downloadFile = (storagePath: string) => {
    window.open(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/contractor-invoices/${storagePath}`, "_blank");
  };

  if (loading) return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-gray-500">Načítám...</div>;
  if (error) return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-red-600">{error}</div>;
  if (!data) return null;

  const transitions = TRANSITIONS[data.status] || [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link href="/admin" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        &larr; Zpět na seznam
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{data.company_name}</h1>
          <p className="text-sm text-gray-500">IČO: {data.ico} | {data.email}</p>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {/* Invoice details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Dodavatel</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Název</dt><dd>{data.supplier_name || data.company_name}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">IČO</dt><dd>{data.supplier_ico || data.ico}</dd></div>
            {data.supplier_dic && <div className="flex justify-between"><dt className="text-gray-500">DIČ</dt><dd>{data.supplier_dic}</dd></div>}
            {data.contact_person && <div className="flex justify-between"><dt className="text-gray-500">Kontakt</dt><dd>{data.contact_person}</dd></div>}
          </dl>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Faktura</h2>
          <dl className="space-y-1 text-sm">
            {data.invoice_number && <div className="flex justify-between"><dt className="text-gray-500">Číslo</dt><dd className="font-medium">{data.invoice_number}</dd></div>}
            {data.date_issued && <div className="flex justify-between"><dt className="text-gray-500">Vystaveno</dt><dd>{data.date_issued}</dd></div>}
            {data.date_due && <div className="flex justify-between"><dt className="text-gray-500">Splatnost</dt><dd>{data.date_due}</dd></div>}
            {data.date_taxable && <div className="flex justify-between"><dt className="text-gray-500">DUZP</dt><dd>{data.date_taxable}</dd></div>}
          </dl>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Odběratel</h2>
          <dl className="space-y-1 text-sm">
            {data.buyer_name && <div className="flex justify-between"><dt className="text-gray-500">Název</dt><dd>{data.buyer_name}</dd></div>}
            {data.buyer_ico && <div className="flex justify-between"><dt className="text-gray-500">IČO</dt><dd>{data.buyer_ico}</dd></div>}
            {data.buyer_dic && <div className="flex justify-between"><dt className="text-gray-500">DIČ</dt><dd>{data.buyer_dic}</dd></div>}
          </dl>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Platba</h2>
          <dl className="space-y-1 text-sm">
            {data.bank_account && <div className="flex justify-between"><dt className="text-gray-500">Účet</dt><dd>{data.bank_account}{data.bank_code ? `/${data.bank_code}` : ""}</dd></div>}
            {data.iban && <div className="flex justify-between"><dt className="text-gray-500">IBAN</dt><dd>{data.iban}</dd></div>}
            {data.variable_symbol && <div className="flex justify-between"><dt className="text-gray-500">VS</dt><dd>{data.variable_symbol}</dd></div>}
          </dl>
        </div>
      </div>

      {/* Items table */}
      {data.items && data.items.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase px-4 py-3 bg-gray-50">Položky</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Popis</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Množství</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Cena/ks</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">DPH</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Celkem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.items.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-sm">{item.description}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.unit_price?.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-sm text-right">{item.vat_rate}%</td>
                  <td className="px-4 py-2 text-sm text-right font-medium">{item.total_price?.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 text-right">
            {data.total_without_vat != null && (
              <p className="text-sm text-gray-600">
                Bez DPH: {data.total_without_vat.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} {data.currency}
              </p>
            )}
            {data.total_amount != null && (
              <p className="text-lg font-bold">
                Celkem: {data.total_amount.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} {data.currency}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Files */}
      {data.files && data.files.length > 0 && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Soubory</h2>
          <ul className="space-y-2">
            {data.files.map((f: any) => (
              <li key={f.id} className="flex items-center justify-between text-sm">
                <span>{f.file_name} ({(f.file_size / 1024).toFixed(0)} KB)</span>
                <button
                  onClick={() => downloadFile(f.storage_path)}
                  className="text-blue-600 hover:underline"
                >
                  Stáhnout
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.description && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Poznámka</h2>
          <p className="text-sm text-gray-700">{data.description}</p>
        </div>
      )}

      {/* Admin actions */}
      {transitions.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Akce</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Poznámka pro kontraktora</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Volitelná poznámka..."
            />
          </div>
          <div className="flex gap-3">
            {transitions.map((t) => (
              <button
                key={t.next}
                onClick={() => updateStatus(t.next)}
                disabled={updating}
                className={`px-4 py-2 text-white text-sm rounded-md ${t.color} disabled:opacity-50`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {data.reviewed_by && (
        <p className="mt-4 text-xs text-gray-400">
          Zpracoval: {data.reviewed_by} | {data.reviewed_at ? new Date(data.reviewed_at).toLocaleString("cs-CZ") : ""}
        </p>
      )}

      <p className="mt-2 text-xs text-gray-400">
        Odesláno: {new Date(data.created_at).toLocaleString("cs-CZ")} | Zdroj: {data.source_type} | ID: {data.id}
      </p>
    </div>
  );
}
