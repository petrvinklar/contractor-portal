import { XMLBuilder } from "fast-xml-parser";

interface IsdocSubmission {
  id: string;
  invoice_number: string | null;
  date_issued: string | null;
  date_due: string | null;
  date_taxable: string | null;
  total_amount: number;
  total_without_vat: number;
  currency: string;
  supplier_name: string | null;
  supplier_ico: string | null;
  supplier_dic: string | null;
  supplier_email: string | null;
  buyer_name: string | null;
  buyer_ico: string | null;
  buyer_dic: string | null;
  bank_account: string | null;
  bank_code: string | null;
  iban: string | null;
  variable_symbol: string | null;
}

interface IsdocItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total_price: number;
  unit: string | null;
  cost_center: string | null;
}

const builder = new XMLBuilder({
  attributeNamePrefix: "$_",
  ignoreAttributes: false,
  format: true,
  suppressEmptyNode: false,
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildParty(name: string | null, ico: string | null, dic: string | null, email?: string | null) {
  return {
    Party: {
      PartyIdentification: { ID: ico || "" },
      PartyName: { Name: name || "" },
      PostalAddress: {
        StreetName: ".",
        BuildingNumber: ".",
        CityName: ".",
        PostalZone: "00000",
        Country: { IdentificationCode: "CZ", Name: "Česká republika" },
      },
      ...(dic ? { PartyTaxScheme: { CompanyID: dic, TaxScheme: "VAT" } } : {}),
      ...(email ? { Contact: { ElectronicMail: email } } : {}),
    },
  };
}

export function generateIsdocXml(submission: IsdocSubmission, items: IsdocItem[]): string {
  const taxMap = new Map<number, { basis: number; tax: number }>();
  const invoiceLines = items.map((item, i) => {
    const lineTotal = Math.round(item.quantity * item.unit_price * 100) / 100;
    const taxAmount = Math.round(lineTotal * (item.vat_rate / 100) * 100) / 100;

    const entry = taxMap.get(item.vat_rate) || { basis: 0, tax: 0 };
    entry.basis += lineTotal;
    entry.tax += taxAmount;
    taxMap.set(item.vat_rate, entry);

    return {
      ID: String(i + 1),
      InvoicedQuantity: item.quantity,
      LineExtensionAmount: lineTotal,
      LineExtensionAmountTaxInclusive: Math.round((lineTotal + taxAmount) * 100) / 100,
      LineExtensionTaxAmount: taxAmount,
      UnitPrice: item.unit_price,
      UnitPriceTaxInclusive: Math.round(item.unit_price * (1 + item.vat_rate / 100) * 100) / 100,
      ClassifiedTaxCategory: {
        Percent: item.vat_rate,
        VATCalculationMethod: 0,
      },
      ...(item.cost_center ? { Note: `Středisko: ${item.cost_center}` } : {}),
      Item: {
        Description: item.description,
      },
    };
  });

  const taxSubTotals = Array.from(taxMap.entries()).map(([rate, { basis, tax }]) => ({
    TaxableAmount: Math.round(basis * 100) / 100,
    TaxAmount: Math.round(tax * 100) / 100,
    TaxInclusiveAmount: Math.round((basis + tax) * 100) / 100,
    AlreadyClaimedTaxableAmount: 0,
    AlreadyClaimedTaxAmount: 0,
    AlreadyClaimedTaxInclusiveAmount: 0,
    DifferenceTaxableAmount: Math.round(basis * 100) / 100,
    DifferenceTaxAmount: Math.round(tax * 100) / 100,
    DifferenceTaxInclusiveAmount: Math.round((basis + tax) * 100) / 100,
    TaxCategory: {
      Percent: rate,
      VATCalculationMethod: 0,
    },
  }));

  const totalWithoutVat = Math.round(submission.total_without_vat * 100) / 100;
  const totalAmount = Math.round(submission.total_amount * 100) / 100;
  const totalTax = Math.round((totalAmount - totalWithoutVat) * 100) / 100;

  const paymentDetails: Record<string, any> = {
    PaymentDueDate: submission.date_due || today(),
  };
  if (submission.bank_account) paymentDetails.ID = submission.bank_account;
  if (submission.bank_code) paymentDetails.BankCode = submission.bank_code;
  if (submission.iban) paymentDetails.IBAN = submission.iban;
  if (submission.variable_symbol) paymentDetails.VariableSymbol = submission.variable_symbol;

  const invoice = {
    "?xml": { "$_version": "1.0", "$_encoding": "UTF-8" },
    Invoice: {
      "$_xmlns": "http://isdoc.cz/namespace/2013",
      "$_version": "6.0.2",
      DocumentType: 1,
      ID: submission.invoice_number || submission.id.slice(0, 8),
      UUID: submission.id,
      IssueDate: submission.date_issued || today(),
      TaxPointDate: submission.date_taxable || submission.date_issued || today(),
      VATApplicable: true,
      ElectronicPossibilityAgreementReference: { ID: "Ze smlouvy" },
      LocalCurrencyCode: submission.currency || "CZK",
      CurrRate: 1,
      RefCurrRate: 1,
      AccountingSupplierParty: buildParty(submission.supplier_name, submission.supplier_ico, submission.supplier_dic, submission.supplier_email),
      AccountingCustomerParty: buildParty(submission.buyer_name, submission.buyer_ico, submission.buyer_dic),
      InvoiceLines: {
        InvoiceLine: invoiceLines,
      },
      TaxTotal: {
        TaxAmount: totalTax,
        TaxSubTotal: taxSubTotals,
      },
      LegalMonetaryTotal: {
        TaxExclusiveAmount: totalWithoutVat,
        TaxInclusiveAmount: totalAmount,
        AlreadyClaimedTaxExclusiveAmount: 0,
        AlreadyClaimedTaxInclusiveAmount: 0,
        DifferenceTaxExclusiveAmount: totalWithoutVat,
        DifferenceTaxInclusiveAmount: totalAmount,
        PayableRoundingAmount: 0,
        PaidDepositsAmount: 0,
        PayableAmount: totalAmount,
      },
      PaymentMeans: {
        Payment: {
          Name: "Bankovní převod",
          PaidAmount: totalAmount,
          PaymentMeansCode: 42,
          Details: paymentDetails,
        },
      },
    },
  };

  return builder.build(invoice);
}
