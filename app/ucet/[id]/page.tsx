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
  source_type: string;
  created_at: string;
  items: any[];
  files: any[];
}

export default function UcetDetailPage() {
  const params = useParams();
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/invoices/${params.id}`);
      if (!res.ok) {
        setError("Faktura nenalezena nebo nemáte přístup.");
        setLoading(false);
        return;
      }
      setData(await res.json());
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading) return <div className="max-w-3xl mx-auto py-12 px-4 text-center text-gray-500">Načítám...</div>;
  if (error) return <div className="max-w-3xl mx-auto py-12 px-4 text-center text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link href="/ucet" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        &larr; Zpět na přehled
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Faktura {data.invoice_number || data.id.slice(0, 8)}
        </h1>
        <StatusBadge status={data.status} />
      </div>

      {data.admin_note && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <p className="text-sm font-medium text-yellow-800">Poznámka od správce:</p>
          <p className="text-sm text-yellow-700 mt-1">{data.admin_note}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Dodavatel</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500">Firma</dt><dd className="font-medium">{data.company_name}</dd></div>
            <div><dt className="text-gray-500">IČO</dt><dd>{data.ico}</dd></div>
            {data.supplier_dic && <div><dt className="text-gray-500">DIČ</dt><dd>{data.supplier_dic}</dd></div>}
            <div><dt className="text-gray-500">Email</dt><dd>{data.email}</dd></div>
          </dl>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Údaje faktury</h2>
          <dl className="space-y-2 text-sm">
            {data.date_issued && <div><dt className="text-gray-500">Datum vystavení</dt><dd>{data.date_issued}</dd></div>}
            {data.date_due && <div><dt className="text-gray-500">Splatnost</dt><dd>{data.date_due}</dd></div>}
            {data.date_taxable && <div><dt className="text-gray-500">DUZP</dt><dd>{data.date_taxable}</dd></div>}
            {data.variable_symbol && <div><dt className="text-gray-500">VS</dt><dd>{data.variable_symbol}</dd></div>}
          </dl>
        </div>
      </div>

      {/* Items */}
      {data.items && data.items.length > 0 && (
        <div className="mt-6 bg-white border rounded-lg overflow-hidden">
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
        </div>
      )}

      {/* Totals */}
      <div className="mt-4 text-right">
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

      <p className="mt-6 text-xs text-gray-400">
        Odesláno: {new Date(data.created_at).toLocaleString("cs-CZ")} | Zdroj: {data.source_type}
      </p>
    </div>
  );
}
