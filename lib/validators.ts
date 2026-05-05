import { SubmissionFormData } from "./types";

export function validateSubmission(data: Partial<SubmissionFormData>): string[] {
  const errors: string[] = [];

  if (!data.company_name?.trim()) errors.push("Název firmy je povinný");
  if (!data.ico?.trim()) errors.push("IČO je povinné");
  if (!data.email?.trim()) errors.push("Email je povinný");
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Neplatný formát emailu");
  }
  if (!data.items || data.items.length === 0) {
    errors.push("Faktura musí mít alespoň jednu položku");
  }
  if (data.items) {
    data.items.forEach((item, i) => {
      if (!item.description?.trim()) errors.push(`Položka ${i + 1}: chybí popis`);
      if (!item.unit_price && item.unit_price !== 0) errors.push(`Položka ${i + 1}: chybí cena`);
    });
  }

  return errors;
}

export function validateStatusTransition(current: string, next: string): boolean {
  const allowed: Record<string, string[]> = {
    received: ["reviewing", "rejected"],
    reviewing: ["approved", "rejected"],
    approved: ["paid"],
    rejected: [],
    paid: [],
  };
  return (allowed[current] || []).includes(next);
}
