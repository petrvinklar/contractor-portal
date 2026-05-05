import { XMLParser } from "fast-xml-parser";
import { SubmissionFormData, SubmissionItem } from "./types";

const parser = new XMLParser({
  attributeNamePrefix: "$_",
  ignoreAttributes: false,
  numberParseOptions: { hex: false, leadingZeros: false },
});

function getText(val: any): string {
  if (val == null) return "";
  if (typeof val === "object" && "#text" in val) return String(val["#text"]);
  return String(val);
}

export function parseIsdoc(xmlBuffer: Buffer | string): Partial<SubmissionFormData> {
  const parsed = parser.parse(xmlBuffer);
  const inv = parsed.Invoice;
  if (!inv) throw new Error("Neplatný ISDOC soubor: chybí element Invoice");

  const supplier = inv.AccountingSupplierParty?.Party;
  const customer = inv.AccountingCustomerParty?.Party;
  const payment = inv.PaymentMeans?.Payment || inv.PaymentMeans;
  const totals = inv.LegalMonetaryTotal;

  // Parse items
  const rawLines = inv.InvoiceLines?.InvoiceLine;
  const lines = Array.isArray(rawLines) ? rawLines : rawLines ? [rawLines] : [];
  const items: SubmissionItem[] = lines.map((line: any, i: number) => ({
    description: getText(line.Item?.Description || line.Note || ""),
    quantity: parseFloat(getText(line.InvoicedQuantity)) || 1,
    unit_price: parseFloat(getText(line.UnitPrice || line.UnitPriceWithoutVAT)) || 0,
    vat_rate: parseFloat(getText(line.ClassifiedTaxCategory?.Percent || line.VATRate)) || 21,
    total_price: parseFloat(getText(line.LineExtensionAmountCurr || line.LineExtensionAmount)) || 0,
    unit: getText(line.InvoicedQuantity?.["$_unitCode"] || ""),
    cost_center: null,
    sort_order: i,
  }));

  // Extract bank info
  const bankAccount = getText(payment?.Details?.ID || "");
  const bankCode = getText(payment?.Details?.BankCode || "");
  const iban = getText(payment?.Details?.IBAN || "");
  const vs = getText(payment?.Details?.VariableSymbol || payment?.VariableSymbol || inv.ID || "");

  return {
    invoice_number: getText(inv.ID),
    date_issued: getText(inv.IssueDate),
    date_due: getText(inv.PaymentMeans?.Payment?.Details?.PaymentDueDate || inv.LegalMonetaryTotal?.PaymentDueDate || ""),
    date_taxable: getText(inv.TaxPointDate),
    currency: getText(inv.LocalCurrencyCode || inv.ForeignCurrencyCode || "CZK"),
    supplier_name: getText(supplier?.PartyIdentification?.ID ? supplier?.PartyName?.Name : supplier?.PartyName?.Name || ""),
    supplier_ico: getText(supplier?.PartyIdentification?.ID || ""),
    supplier_dic: getText(supplier?.PartyTaxScheme?.CompanyID || ""),
    buyer_name: getText(customer?.PartyName?.Name || ""),
    buyer_ico: getText(customer?.PartyIdentification?.ID || ""),
    buyer_dic: getText(customer?.PartyTaxScheme?.CompanyID || ""),
    bank_account: bankAccount,
    bank_code: bankCode,
    iban: iban,
    variable_symbol: vs,
    total_amount: parseFloat(getText(totals?.TaxInclusiveAmountCurr || totals?.TaxInclusiveAmount)) || 0,
    total_without_vat: parseFloat(getText(totals?.TaxExclusiveAmountCurr || totals?.TaxExclusiveAmount)) || 0,
    description: getText(inv.Note || ""),
    items,
    source_type: "isdoc",
    isdoc_raw: inv,
  };
}
