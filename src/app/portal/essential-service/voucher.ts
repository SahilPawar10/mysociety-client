import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import type { DebitEntry, Vendor } from "@/lib/features/portal/portalApi";
import { amountCells, BLUE, field, inWords, loadPdfMake, RED } from "../maintenance-bill/receipt.ts";

export type VoucherSociety = {
  name?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  pincode?: unknown;
};

/** Payment voucher for a debit entry: same red/blue look as the maintenance receipt. */
export function voucherDoc(society: VoucherSociety, vendor: Vendor, entry: DebitEntry) {
  const address = [society.address, society.city, society.state, society.pincode]
    .filter(Boolean)
    .join(", ");
  const full = (content: Content): TableCell[] => [{ ...(content as object), colSpan: 2 } as TableCell, {}];
  const amount = Number(entry.amount);

  const doc: TDocumentDefinitions = {
    pageSize: "A5",
    pageMargins: 22,
    info: { title: `Payment voucher ${entry.id}` },
    defaultStyle: { font: "Mukta", fontSize: 10, color: RED, lineHeight: 1 },
    content: [
      {
        table: {
          widths: ["*", "*"],
          body: [
            full({
              stack: [
                { text: String(society.name ?? ""), fontSize: 17, bold: true },
                ...(address ? [{ text: address, fontSize: 9 }] : []),
                { text: "PAYMENT VOUCHER", bold: true, fontSize: 11, characterSpacing: 2, margin: [0, 4, 0, 0] },
              ],
              alignment: "center",
              margin: [0, 4, 0, 2],
            }),
            [field("Voucher No.", entry.id), field("Date", new Date(entry.paymentDate).toLocaleDateString("en-IN"))],
            full(field("Paid to", `${vendor.name} (${vendor.vendorType === "COMPANY" ? "Company" : "Individual"})`)),
            ...(vendor.address || vendor.phone
              ? [full(field("Address / Contact", [vendor.address, vendor.phone].filter(Boolean).join(" · ")))]
              : []),
            [field("Service", vendor.serviceType), field("Period", entry.period)],
            full({
              margin: [-6, -2.5, -6, -2.5],
              table: {
                widths: [26, "*", 60, 34],
                body: [
                  [
                    { text: "Sr.", bold: true },
                    { text: "Particulars", bold: true },
                    { text: "Rupees", bold: true, alignment: "right" },
                    { text: "Paise", bold: true, alignment: "right" },
                  ],
                  [
                    { text: "1.", alignment: "center" },
                    { text: [vendor.serviceType, entry.period].filter(Boolean).join(" — "), color: BLUE },
                    ...amountCells(entry.amount),
                  ],
                  [{ text: "" }, { text: "Total", alignment: "right", bold: true }, ...amountCells(entry.amount)],
                ],
              },
              layout: {
                hLineWidth: (i, node) => (i === 1 || i === node.table.body.length - 1 ? 1 : 0),
                vLineWidth: (i, node) => (i > 0 && i < (node.table.widths?.length ?? 0) ? 1 : 0),
                hLineColor: () => RED,
                vLineColor: () => RED,
                paddingLeft: () => 6,
                paddingRight: () => 6,
                paddingTop: () => 2,
                paddingBottom: () => 2,
              },
            }),
            [field("Mode", entry.paymentMode), field("Ref. No.", entry.reference)],
            full(field("Amount in words:", inWords(amount))),
            ...(entry.note ? [full(field("Note", entry.note))] : []),
            full({
              columns: ["Receiver", "Treasurer", "Secretary"].map((t, i) => ({
                text: t,
                alignment: (["left", "center", "right"] as const)[i],
              })),
              margin: [4, 20, 4, 2],
            }),
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 1.5 : 1),
          vLineWidth: (i) => (i === 1 ? 1 : 1.5),
          hLineColor: () => RED,
          vLineColor: () => RED,
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 2.5,
          paddingBottom: () => 2.5,
        },
      },
    ],
  };
  return doc;
}

export async function downloadVoucher(society: VoucherSociety, vendor: Vendor, entry: DebitEntry) {
  try {
    const pdfMake = await loadPdfMake();
    await pdfMake.createPdf(voucherDoc(society, vendor, entry)).download(`Voucher-${entry.id}-${vendor.name}.pdf`);
  } catch (error) {
    window.alert(`Could not create the voucher PDF: ${(error as Error).message}`);
  }
}

/** What a payment on `date` covers: "October 2026", "Oct–Dec 2026" or "FY 2026-27". */
export const periodFor = (frequency: Vendor["paymentFrequency"], date: string) => {
  const d = new Date(`${date}T00:00:00`);
  const year = d.getFullYear();
  if (frequency === "MONTHLY") {
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }
  if (frequency === "QUARTERLY") {
    const first = Math.floor(d.getMonth() / 3) * 3;
    const name = (m: number) => new Date(year, m, 1).toLocaleDateString("en-IN", { month: "short" });
    return `${name(first)}–${name(first + 2)} ${year}`;
  }
  // Indian financial year, April to March.
  const start = d.getMonth() >= 3 ? year : year - 1;
  return `FY ${start}-${String(start + 1).slice(2)}`;
};
