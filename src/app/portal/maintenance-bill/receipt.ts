import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import type { FeeHead, MaintenanceSheet } from "@/lib/features/portal/portalApi";

type Society = MaintenanceSheet["society"];
type Row = MaintenanceSheet["units"][number];

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
  "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const two = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]} ${ONES[n % 10]}`.trim());
const three = (n: number) =>
  n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred ${two(n % 100)}`.trim() : two(n);
const int = (n: number): string => {
  const out = [];
  if (n >= 1e7) {
    out.push(`${int(Math.floor(n / 1e7))} Crore`);
    n %= 1e7;
  }
  if (n >= 1e5) {
    out.push(`${two(Math.floor(n / 1e5))} Lakh`);
    n %= 1e5;
  }
  if (n >= 1000) {
    out.push(`${two(Math.floor(n / 1000))} Thousand`);
    n %= 1000;
  }
  if (n) out.push(three(n));
  return out.join(" ");
};

/** 1250.5 → "Rupees One Thousand Two Hundred Fifty and Fifty Paise Only" (Indian numbering). */
export const inWords = (amount: number) => {
  const paiseTotal = Math.round(amount * 100);
  const rupees = Math.floor(paiseTotal / 100);
  const paise = paiseTotal % 100;
  return `Rupees ${int(rupees) || "Zero"}${paise ? ` and ${two(paise)} Paise` : ""} Only`;
};

const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export const RED = "#b3261e";
export const BLUE = "#1e3a8a";

// Mukta covers Devanagari and Latin, so Marathi or English names both render (public/fonts, OFL licence).
export const loadPdfMake = async () => {
  const mod = await import("pdfmake");
  const pdfMake = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const origin = window.location.origin;
  pdfMake.setUrlAccessPolicy((url) => url.startsWith(`${origin}/fonts/`));
  pdfMake.setFonts({
    Mukta: {
      normal: `${origin}/fonts/Mukta-Regular.ttf`,
      bold: `${origin}/fonts/Mukta-Bold.ttf`,
      italics: `${origin}/fonts/Mukta-Regular.ttf`,
      bolditalics: `${origin}/fonts/Mukta-Bold.ttf`,
    },
  });
  return pdfMake;
};

/** "Label  value" with the filled-in value in blue, like ink on the printed books. */
export const field = (label: string, value: unknown): Content => ({
  text: [`${label}  `, { text: String(value ?? ""), color: BLUE, bold: true }],
});

export const amountCells = (amount: string): Content[] => {
  if (amount === "") return [{ text: "" }, { text: "" }];
  const [rs, ps] = Number(amount).toFixed(2).split(".");
  return [
    { text: rs, alignment: "right", color: BLUE, bold: true },
    { text: ps, alignment: "right", color: BLUE, bold: true },
  ];
};

/**
 * The receipt as a pdfmake document. No row → a blank receipt with just the society header,
 * fee names and rules, to fill in by hand.
 */
export function receiptDoc(
  society: Society,
  month: string,
  heads: FeeHead[],
  row?: Row,
  /** < 1 shrinks text and spacing so a long receipt still fits one page. */
  scale = 1,
) {
  const z = (n: number) => n * scale;
  const paid = row ? row.items.filter((i) => i.paid) : [];
  const lines = row ? paid : heads.map((h) => ({ name: h.name, amount: "" }));
  const total = paid.reduce((t, i) => t + Number(i.amount), 0);
  const address = [society.address, society.city, society.state, society.pincode]
    .filter(Boolean)
    .join(", ");
  // A few empty lines so the blank receipt has room to write in, like the printed books.
  const pad = scale < 1 ? 0 : Math.max(0, (row ? 3 : 5) - lines.length);
  const date = row?.billDate ? new Date(row.billDate).toLocaleDateString("en-IN") : "";

  const particulars: Content = {
    // Cancels the outer cell padding so this table's lines meet the outer border.
    margin: [-z(6), -z(2.5), -z(6), -z(2.5)],
    table: {
      widths: [26, "*", 60, 34],
      body: [
        [
          { text: "Sr.", bold: true },
          { text: "Particulars", bold: true },
          { text: "Rupees", bold: true, alignment: "right" },
          { text: "Paise", bold: true, alignment: "right" },
        ],
        ...lines.map((l, i): Content[] => [
          { text: `${i + 1}.`, alignment: "center" },
          { text: l.name },
          ...amountCells(String(l.amount)),
        ]),
        ...Array.from({ length: pad }, (): Content[] => [" ", " ", " ", " "]),
        [
          { text: "" },
          { text: "Total", alignment: "right", bold: true },
          ...amountCells(row ? String(total) : ""),
        ],
      ],
    },
    layout: {
      hLineWidth: (i, node) => (i === 1 || i === node.table.body.length - 1 ? 1 : 0),
      vLineWidth: (i, node) => (i > 0 && i < (node.table.widths?.length ?? 0) ? 1 : 0),
      hLineColor: () => RED,
      vLineColor: () => RED,
      paddingLeft: () => z(6),
      paddingRight: () => z(6),
      paddingTop: () => z(2),
      paddingBottom: () => z(2),
    },
  };

  // A row whose single cell spans both columns ({} fills the spanned slot).
  const full = (content: Content): TableCell[] => [
    { ...(content as object), colSpan: 2 } as TableCell,
    {},
  ];

  const doc: TDocumentDefinitions = {
    pageSize: "A5",
    pageMargins: 22,
    info: { title: `Maintenance receipt ${row ? `${row.wingName}-${row.unitNumber} ` : ""}${month}` },
    defaultStyle: { font: "Mukta", fontSize: z(10), color: RED, lineHeight: 1 },
    content: [
      {
        table: {
          widths: ["*", "*"],
          body: [
            full({
              stack: [
                { text: society.name, fontSize: z(17), bold: true },
                ...(address ? [{ text: address, fontSize: z(9) }] : []),
                { text: "MAINTENANCE RECEIPT", bold: true, fontSize: z(11), characterSpacing: 2, margin: [0, z(4), 0, 0] },
              ],
              alignment: "center",
              margin: [0, z(4), 0, z(2)],
            }),
            [field("Flat No.", row?.unitNumber), field("Wing", row?.wingName)],
            [field("Receipt No.", row?.billId), field("Date", date)],
            full(field("Month", row ? monthLabel(month) : "")),
            full(field("Owner Name", row?.ownerName)),
            full(field("Tenant Name", row?.tenantName)),
            full(particulars),
            full({ text: "Cash / Cheque" }),
            full(field("Amount in words:", row ? inWords(total) : "")),
            ...(society.rules
              ? [full({ text: [{ text: "Note:\n", bold: true }, society.rules], fontSize: z(8.5) })]
              : []),
            full({
              columns: ["Chairman", "Vice Chairman", "Secretary"].map((t, i) => ({
                text: t,
                alignment: (["left", "center", "right"] as const)[i],
              })),
              margin: [4, z(20), 4, 2],
            }),
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 1.5 : 1),
          vLineWidth: (i) => (i === 1 ? 1 : 1.5),
          hLineColor: () => RED,
          vLineColor: () => RED,
          paddingLeft: () => z(6),
          paddingRight: () => z(6),
          paddingTop: () => z(2.5),
          paddingBottom: () => z(2.5),
        },
      },
    ],
  };
  return doc;
}

type PdfMake = Awaited<ReturnType<typeof loadPdfMake>>;

/** Lays the receipt out, shrinking it step by step until it fits on one page. */
export async function fitReceipt(pdfMake: PdfMake, ...args: Parameters<typeof receiptDoc>) {
  const [society, month, heads, row] = args;
  let pdf;
  for (let scale = 1; ; scale -= 0.05) {
    let pages = 0;
    const doc = receiptDoc(society, month, heads, row, scale);
    // pdfmake hands the footer the final page count once the layout is done.
    doc.footer = (_page, pageCount) => {
      pages = pageCount;
      return "";
    };
    pdf = pdfMake.createPdf(doc);
    await pdf.getBuffer();
    // ponytail: stops at 50% size; anything longer (dozens of fees) would be unreadable anyway.
    if (pages <= 1 || scale <= 0.5) return pdf;
  }
}

export async function downloadReceipt(society: Society, month: string, heads: FeeHead[], row?: Row) {
  const name = row ? `Receipt-${row.wingName}-${row.unitNumber}-${month}` : `Receipt-blank-${month}`;
  try {
    const pdfMake = await loadPdfMake();
    const pdf = await fitReceipt(pdfMake, society, month, heads, row);
    await pdf.download(`${name}.pdf`);
  } catch (error) {
    window.alert(`Could not create the receipt PDF: ${(error as Error).message}`);
  }
}
