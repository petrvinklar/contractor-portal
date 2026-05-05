const statusConfig: Record<string, { label: string; className: string }> = {
  received: { label: "Přijato", className: "bg-blue-100 text-blue-800" },
  reviewing: { label: "Ke zpracování", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Schváleno", className: "bg-green-100 text-green-800" },
  rejected: { label: "Zamítnuto", className: "bg-red-100 text-red-800" },
  paid: { label: "Zaplaceno", className: "bg-emerald-100 text-emerald-800" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
