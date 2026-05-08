"use client";

import { SubmissionItem } from "@/lib/types";

interface InvoiceFormData {
  invoice_number: string;
  date_issued: string;
  date_due: string;
  date_taxable: string;
  currency: string;
  description: string;
  supplier_name: string;
  supplier_ico: string;
  supplier_dic: string;
  supplier_email: string;
  supplier_contact: string;
  buyer_name: string;
  buyer_ico: string;
  buyer_dic: string;
  bank_account: string;
  bank_code: string;
  iban: string;
  variable_symbol: string;
}

interface InvoiceFormProps {
  data: InvoiceFormData;
  items: SubmissionItem[];
  onChange: (data: InvoiceFormData) => void;
  onItemsChange: (items: SubmissionItem[]) => void;
  triedSubmit?: boolean;
}

export default function InvoiceForm({ data, items, onChange, onItemsChange, triedSubmit = false }: InvoiceFormProps) {
  const update = (field: keyof InvoiceFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const addItem = () => {
    onItemsChange([
      ...items,
      { description: "", quantity: 1, unit_price: 0, vat_rate: 21, total_price: 0, unit: null, cost_center: "", sort_order: items.length },
    ]);
  };

  const updateItem = (index: number, field: keyof SubmissionItem, value: any) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: value };
      // Recalculate total
      newItem.total_price = Math.round((newItem.quantity || 1) * (newItem.unit_price || 0) * 100) / 100;
      return newItem;
    });
    onItemsChange(updated);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const computeLineTotal = (item: SubmissionItem) =>
    Math.round((item.quantity || 1) * (item.unit_price || 0) * 100) / 100;

  const totalWithoutVat = items.reduce((sum, item) => sum + computeLineTotal(item), 0);
  const totalVat = items.reduce((sum, item) => {
    return sum + computeLineTotal(item) * ((item.vat_rate || 0) / 100);
  }, 0);
  const totalWithVat = totalWithoutVat + totalVat;

  return (
    <div className="space-y-6">
      {/* Invoice details */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Údaje faktury</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Číslo faktury</label>
            <input
              type="text"
              value={data.invoice_number}
              onChange={(e) => update("invoice_number", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Datum vystavení</label>
            <input
              type="date"
              value={data.date_issued}
              onChange={(e) => update("date_issued", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Datum splatnosti</label>
            <input
              type="date"
              value={data.date_due}
              onChange={(e) => update("date_due", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">DUZP</label>
            <input
              type="date"
              value={data.date_taxable}
              onChange={(e) => update("date_taxable", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Supplier info */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Dodavatel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Název firmy *</label>
            <input
              type="text"
              value={data.supplier_name}
              onChange={(e) => update("supplier_name", e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                triedSubmit && !data.supplier_name?.trim() ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">IČO *</label>
            <input
              type="text"
              value={data.supplier_ico}
              onChange={(e) => update("supplier_ico", e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                triedSubmit && !data.supplier_ico?.trim() ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">DIČ</label>
            <input
              type="text"
              value={data.supplier_dic}
              onChange={(e) => update("supplier_dic", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              value={data.supplier_email}
              onChange={(e) => update("supplier_email", e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                triedSubmit && !data.supplier_email?.trim() ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              required
            />
            {triedSubmit && !data.supplier_email?.trim() && (
              <p className="text-red-600 text-xs mt-1">Povinné</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Kontaktní osoba</label>
            <input
              type="text"
              value={data.supplier_contact}
              onChange={(e) => update("supplier_contact", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Buyer info */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Odběratel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Název</label>
            <input
              type="text"
              value={data.buyer_name}
              onChange={(e) => update("buyer_name", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">IČO</label>
            <input
              type="text"
              value={data.buyer_ico}
              onChange={(e) => update("buyer_ico", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">DIČ</label>
            <input
              type="text"
              value={data.buyer_dic}
              onChange={(e) => update("buyer_dic", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Platební údaje</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Číslo účtu</label>
            <input
              type="text"
              value={data.bank_account}
              onChange={(e) => update("bank_account", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Kód banky</label>
            <input
              type="text"
              value={data.bank_code}
              onChange={(e) => update("bank_code", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">IBAN</label>
            <input
              type="text"
              value={data.iban}
              onChange={(e) => update("iban", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Variabilní symbol</label>
            <input
              type="text"
              value={data.variable_symbol}
              onChange={(e) => update("variable_symbol", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Měna</label>
          <select
            value={data.currency}
            onChange={(e) => update("currency", e.target.value)}
            className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Položky faktury</h2>
          <button
            type="button"
            onClick={addItem}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Přidat položku
          </button>
        </div>

        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
          Středisko musí sdělit objednatel. Pokud má faktura více řádků, uveďte středisko u každého.
        </p>

        {items.length === 0 && (
          <p className="text-gray-500 text-sm">Zatím žádné položky. Klikněte na &quot;Přidat položku&quot;.</p>
        )}

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border rounded-md p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600">Popis *</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-600">Množství</label>
                  <input
                    type="number"
                    step="0.001"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">Cena/ks *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-600">DPH %</label>
                  <select
                    value={item.vat_rate}
                    onChange={(e) => updateItem(i, "vat_rate", parseFloat(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={0}>0%</option>
                    <option value={12}>12%</option>
                    <option value={21}>21%</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">Středisko *</label>
                  <input
                    type="text"
                    value={item.cost_center || ""}
                    onChange={(e) => updateItem(i, "cost_center", e.target.value)}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      triedSubmit && !item.cost_center?.trim() ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="např. 101"
                    required
                  />
                  {triedSubmit && !item.cost_center?.trim() && (
                    <p className="text-red-600 text-xs mt-1">Povinné</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">Celkem bez DPH</label>
                  <div className="mt-1 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-700">
                    {computeLineTotal(item).toLocaleString("cs-CZ", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="w-full px-2 py-2 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    X
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="mt-4 text-right space-y-1">
            <p className="text-sm text-gray-600">
              Celkem bez DPH: <span className="font-semibold">{totalWithoutVat.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} {data.currency}</span>
            </p>
            <p className="text-sm text-gray-600">
              DPH: <span className="font-semibold">{totalVat.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} {data.currency}</span>
            </p>
            <p className="text-base font-bold">
              Celkem s DPH: {totalWithVat.toLocaleString("cs-CZ", { minimumFractionDigits: 2 })} {data.currency}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Poznámka</label>
        <textarea
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
