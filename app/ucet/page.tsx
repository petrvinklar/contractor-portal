"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { ContractorSubmission } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UcetPage() {
  const [submissions, setSubmissions] = useState<ContractorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/prihlaseni");
        return;
      }
      setUserEmail(user.email || "");

      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || `Chyba ${res.status}`);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/prihlaseni");
    router.refresh();
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 px-4 text-center text-gray-500">Načítám...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Moje faktury</h1>
          <p className="text-sm text-gray-500 mt-1">{userEmail}</p>
        </div>
        <div className="space-x-3">
          <Link
            href="/nahrat"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Nahrát fakturu
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            Odhlásit
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {!error && submissions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          <p>Zatím nemáte žádné nahrané faktury.</p>
          <Link href="/nahrat" className="text-blue-600 hover:underline mt-2 inline-block">
            Nahrát první fakturu
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Číslo faktury</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firma</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Částka</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stav</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(s.created_at).toLocaleDateString("cs-CZ")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/ucet/${s.id}`} className="text-blue-600 hover:underline">
                      {s.invoice_number || s.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{s.company_name}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">
                    {s.total_amount?.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} {s.currency}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
