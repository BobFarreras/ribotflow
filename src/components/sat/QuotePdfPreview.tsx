/**
 * Creation/modification date: 28/05/2026
 * Path: src/components/sat/QuotePdfPreview.tsx
 * Description: Professional PDF preview for quotes. Matches A4 document layout.
 *              Configurable colors for company branding.
 */

"use client";

/* ============================================================
   TYPES
   ============================================================ */

interface CompanyData {
  name: string;
  nif: string;
  address: string;
  phone: string;
  email: string;
}

interface ClientData {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
}

interface QuoteItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
}

interface Props {
  quoteNumber: string;
  company: CompanyData;
  client: ClientData;
  items: QuoteItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil: string | null;
  description: string | null;
  clientNotes: string | null;
}

/* ============================================================
   CONSTANTS
   ============================================================ */

const UNIT_LABELS: Record<string, string> = {
  unit: "Ud.",
  kg: "kg",
  g: "g",
  m: "m",
  m2: "m²",
  m3: "m³",
  l: "L",
  h: "h",
  day: "dies",
  pack: "Pq.",
};

/* ============================================================
   COMPONENT
   ============================================================ */

export function QuotePdfPreview({
  quoteNumber,
  company,
  client,
  items,
  subtotal,
  discountPercent,
  discountAmount,
  taxRate,
  taxAmount,
  total,
  validUntil,
  description,
  clientNotes,
}: Props) {
  const validItems = items.filter((item) => item.description);
  const today = new Date().toLocaleDateString("ca-ES");
  const validUntilDate = validUntil
    ? new Date(validUntil).toLocaleDateString("ca-ES")
    : null;

  return (
    <div className="p-4">
      <div
        className="mx-auto bg-white shadow-lg"
        style={{ maxWidth: "595px", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
      >
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between border-b-2 border-slate-200 pb-5 mb-8">
          <div className="w-3/5">
            <div className="text-xl font-bold text-slate-800 leading-tight">
              {company.name}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {company.nif}
            </div>
          </div>
          <div className="w-2/5 text-right">
            <h1 className="m-0 text-2xl font-black text-slate-900 uppercase tracking-wide">
              Pressupost
            </h1>
            <div className="mt-1 font-bold text-sm text-slate-500">
              NÚM. {quoteNumber}
            </div>
          </div>
        </div>

        {/* ── INFO SECTION: Company + Client + Dates ── */}
        <div className="flex gap-4 mb-8">
          {/* Company (Emissor) */}
          <div className="w-[30%]">
            <div className="mb-2 text-[8px] font-bold uppercase tracking-wider text-slate-400">
              De:
            </div>
            <div className="text-xs font-bold text-slate-800 mb-1">
              {company.name}
            </div>
            <div className="text-[10px] text-slate-500 leading-relaxed">
              NIF: {company.nif}<br />
              {company.address}<br />
              Tel: {company.phone}<br />
              {company.email}
            </div>
          </div>

          {/* Client (Receptor) */}
          <div className="w-[35%]">
            <div className="mb-2 text-[8px] font-bold uppercase tracking-wider text-slate-400">
              Per a:
            </div>
            <div className="rounded-md bg-slate-50 border-l-4 border-blue-500 p-3">
              <div className="text-xs font-bold text-slate-800 mb-1">
                {client.name}
              </div>
              <div className="text-[10px] text-slate-500 leading-relaxed">
                {client.taxId && <>NIF: {client.taxId}<br /></>}
                {client.address && <>{client.address}<br /></>}
                {client.email && <>{client.email}<br /></>}
                {client.phone && <>Tel: {client.phone}</>}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="w-[35%]">
            <div className="mb-2 text-[8px] font-bold uppercase tracking-wider text-slate-400">
              &nbsp;
            </div>
            <div className="rounded-md bg-slate-100 p-3">
              <table className="w-full text-[10px]">
                <tbody>
                  <tr>
                    <td className="py-0.5 font-bold text-slate-500">Data emissió:</td>
                    <td className="py-0.5 text-right text-slate-700">{today}</td>
                  </tr>
                  {validUntilDate && (
                    <>
                      <tr>
                        <td className="py-0.5 font-bold text-slate-500">Validesa:</td>
                        <td className="py-0.5 text-right text-slate-700">{validUntilDate}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-bold text-slate-500">Termini:</td>
                        <td className="py-0.5 text-right text-slate-700">
                          {validUntil
                            ? `${Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86400000)} dies`
                            : "—"}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── ITEMS TABLE ── */}
        <table className="w-full border-collapse mb-6 text-[10px]">
          <thead>
            <tr>
              <th className="bg-slate-800 text-white font-bold uppercase text-[8px] tracking-wider py-3 px-2.5 text-center w-[8%]">
                Ref.
              </th>
              <th className="bg-slate-800 text-white font-bold uppercase text-[8px] tracking-wider py-3 px-2.5 text-left w-[50%]">
                Descripció del Concepte
              </th>
              <th className="bg-slate-800 text-white font-bold uppercase text-[8px] tracking-wider py-3 px-2.5 text-center w-[10%]">
                Unitats
              </th>
              <th className="bg-slate-800 text-white font-bold uppercase text-[8px] tracking-wider py-3 px-2.5 text-right w-[14%]">
                Preu Unitari
              </th>
              <th className="bg-slate-800 text-white font-bold uppercase text-[8px] tracking-wider py-3 px-2.5 text-right w-[14%]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {validItems.map((item, index) => (
              <tr key={index}>
                <td className="py-3 px-2.5 text-center border-b border-slate-200 text-slate-400">
                  {String(index + 1).padStart(3, "0")}
                </td>
                <td className="py-3 px-2.5 border-b border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">{item.description}</div>
                </td>
                <td className="py-3 px-2.5 text-center border-b border-slate-200 text-slate-600">
                  {item.quantity} {UNIT_LABELS[item.unit] ?? item.unit}
                </td>
                <td className="py-3 px-2.5 text-right border-b border-slate-200 text-slate-600">
                  {item.unitPrice.toFixed(2)} €
                </td>
                <td className="py-3 px-2.5 text-right border-b border-slate-200 font-bold text-slate-800">
                  {item.total.toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── DESCRIPTION ── */}
        {description && (
          <div className="mb-6 p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Descripció del treball
            </div>
            <div className="text-[10px] text-slate-600 whitespace-pre-wrap">{description}</div>
          </div>
        )}

        {/* ── TOTALS ── */}
        <div className="flex mb-10">
          <div className="w-3/5" />
          <div className="w-2/5">
            <table className="w-full text-[10px]">
              <tbody>
                <tr>
                  <td className="py-1.5 text-slate-500">Base Imposable:</td>
                  <td className="py-1.5 text-right text-slate-700">{subtotal.toFixed(2)} €</td>
                </tr>
                {discountPercent > 0 && (
                  <tr>
                    <td className="py-1.5 text-red-500">Descompte ({discountPercent}%):</td>
                    <td className="py-1.5 text-right text-red-500">-{discountAmount.toFixed(2)} €</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1.5 text-slate-500">IVA ({taxRate}%):</td>
                  <td className="py-1.5 text-right text-slate-700">{taxAmount.toFixed(2)} €</td>
                </tr>
                <tr>
                  <td className="py-2.5 border-t-2 border-slate-800 text-sm font-bold text-slate-900">
                    TOTAL:
                  </td>
                  <td className="py-2.5 border-t-2 border-slate-800 text-right text-sm font-bold text-slate-900">
                    {total.toFixed(2)} €
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── CONDITIONS ── */}
        {clientNotes && (
          <div className="mb-10 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2.5 pb-2 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-800">
              Condicions generals i forma de pagament
            </div>
            <div className="text-[9px] text-slate-500 whitespace-pre-wrap leading-relaxed">
              {clientNotes}
            </div>
          </div>
        )}

        {/* ── SIGNATURE ── */}
        <div className="flex items-end pt-10">
          <div className="w-1/2">
            <div className="text-[10px] font-bold uppercase text-slate-800 mb-1">
              Acceptació del Pressupost
            </div>
            <div className="text-[8px] text-slate-400 mb-12">
              Per aprovar i formalitzar la comanda, si us plau, signeu i retorneu aquest document.
            </div>
            <div className="w-48 border-t border-slate-400 mb-1" />
            <div className="text-[8px] text-slate-400">Signatura del client i data</div>
          </div>
          <div className="w-1/2 text-right">
            <div className="text-[8px] text-slate-300">Gràcies per la seva confiança.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
