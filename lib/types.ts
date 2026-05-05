export interface ContractorSubmission {
  id: string;
  company_name: string;
  ico: string;
  email: string;
  contact_person: string | null;
  contractor_id: string | null;
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
  status: "received" | "reviewing" | "approved" | "rejected" | "paid";
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  source_type: "manual" | "isdoc" | "pdf";
  isdoc_raw: any;
  created_at: string;
  updated_at: string;
}

export interface SubmissionItem {
  id?: string;
  submission_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total_price: number;
  unit: string | null;
  sort_order: number;
}

export interface SubmissionFile {
  id: string;
  submission_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  file_category: string;
}

export interface ContractorProfile {
  id: string;
  company_name: string;
  ico: string;
  contact_person: string | null;
  phone: string | null;
  created_at: string;
}

export interface SubmissionFormData {
  company_name: string;
  ico: string;
  email: string;
  contact_person: string;
  invoice_number: string;
  date_issued: string;
  date_due: string;
  date_taxable: string;
  currency: string;
  description: string;
  supplier_name: string;
  supplier_ico: string;
  supplier_dic: string;
  buyer_name: string;
  buyer_ico: string;
  buyer_dic: string;
  bank_account: string;
  bank_code: string;
  iban: string;
  variable_symbol: string;
  total_amount?: number;
  total_without_vat?: number;
  items: SubmissionItem[];
  source_type: "manual" | "isdoc" | "pdf";
  isdoc_raw?: any;
  file_ids: { storage_path: string; file_name: string; file_type: string; file_size: number }[];
}
