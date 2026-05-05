"use client";

import { useEffect, useState } from "react";
import { ContractorSubmission } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "", label: "Všechny" },
  { value: "received", label: "Přijaté" },
  { value: "reviewing", label: "Ke zpracování" },
  { value: "approved", label: "Schválené" },
  { value: "rejected", label: "Zamítnuté" },
  { value: "paid", label: "Zaplacené" },
];

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<ContractorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/invoices?${params.toString()}`);
    if (res.ok) {
      setSubmissions(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/prihlaseni");
    router.refresh();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Správa faktur</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          Odhlásit
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                statusFilter === opt.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat firmu, IČO, číslo..."
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md w-64"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Hledat
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Načítám...</div>
      ) : submissions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          Žádné faktury k zobrazení.
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firma</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IČO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Číslo fakt.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Částka</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stav</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zdroj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(s.created_at).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/admin/${s.id}`} className="text-blue-600 hover:underline font-medium">
                      {s.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.ico}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.invoice_number || "-"}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">
                    {s.total_amount?.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} {s.currency}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{s.source_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
