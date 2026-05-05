import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);

export async function sendContractorConfirmation(email: string, submissionId: string, companyName: string) {
  await resend.emails.send({
    from: "Fakturační portál <onboarding@resend.dev>",
    to: email,
    subject: `Faktura přijata - ${submissionId.slice(0, 8)}`,
    text: `Dobrý den,

Vaše faktura od společnosti ${companyName} byla úspěšně přijata ke zpracování.

ID podání: ${submissionId}

Stav faktury můžete sledovat po registraci na portálu.

S pozdravem,
Fakturační portál`,
  });
}

export async function sendAdminNotification(submissionId: string, companyName: string, ico: string, amount: string) {
  if (ADMIN_EMAILS.length === 0) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  await resend.emails.send({
    from: "Fakturační portál <onboarding@resend.dev>",
    to: ADMIN_EMAILS,
    subject: `Nová faktura od ${companyName} (IČO: ${ico})`,
    text: `Nová faktura byla nahrána do portálu.

Firma: ${companyName}
IČO: ${ico}
Částka: ${amount}

Detail: ${appUrl}/admin/${submissionId}`,
  });
}

export async function sendStatusChange(email: string, submissionId: string, status: string, adminNote?: string) {
  const statusLabels: Record<string, string> = {
    reviewing: "přijata ke zpracování",
    approved: "schválena",
    rejected: "zamítnuta",
    paid: "zaplacena",
  };
  const label = statusLabels[status] || status;
  await resend.emails.send({
    from: "Fakturační portál <onboarding@resend.dev>",
    to: email,
    subject: `Faktura ${label} - ${submissionId.slice(0, 8)}`,
    text: `Dobrý den,

Stav Vaší faktury (ID: ${submissionId.slice(0, 8)}) byl změněn na: ${label}.${adminNote ? `\n\nPoznámka: ${adminNote}` : ""}

S pozdravem,
Fakturační portál`,
  });
}
