"use client";

interface ContractorInfoProps {
  data: {
    company_name: string;
    ico: string;
    email: string;
    contact_person: string;
  };
  onChange: (data: ContractorInfoProps["data"]) => void;
}

export default function ContractorInfo({ data, onChange }: ContractorInfoProps) {
  const update = (field: keyof typeof data, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Identifikace dodavatele</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Název firmy *
          </label>
          <input
            type="text"
            value={data.company_name}
            onChange={(e) => update("company_name", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            IČO *
          </label>
          <input
            type="text"
            value={data.ico}
            onChange={(e) => update("ico", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Kontaktní osoba
          </label>
          <input
            type="text"
            value={data.contact_person}
            onChange={(e) => update("contact_person", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
