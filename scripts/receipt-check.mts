/* Receipt fits one A5 page, even with many fees and long rules: `node scripts/receipt-check.mts` */
import assert from "node:assert/strict";

import pdfmake from "pdfmake";
import { fitReceipt } from "../src/app/portal/maintenance-bill/receipt.ts";
pdfmake.setFonts({ Mukta: { normal: "public/fonts/Mukta-Regular.ttf", bold: "public/fonts/Mukta-Bold.ttf", italics: "public/fonts/Mukta-Regular.ttf", bolditalics: "public/fonts/Mukta-Bold.ttf" } });
const pages = (buf: Buffer) => (buf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;
const society = { name: "श्री गणेश सहकारी गृहनिर्माण संस्था", address: "Kothrud", city: "Pune", state: "Maharashtra", pincode: "411038",
  rules: Array.from({ length: 6 }, (_, i) => `${i + 1}. सदस्यांनी देखभाल शुल्क प्रत्येक महिन्याच्या १० तारखेपूर्वी भरावे. Late payment attracts a fine of ₹100 per month.`).join("\n") } as any;
const many = Array.from({ length: 14 }, (_, i) => ({ name: i % 2 ? `शुल्क क्रमांक ${i + 1}` : `Fee head ${i + 1}`, amount: String(100 * (i + 1)), paid: true }));
const row = { wingName: "A", unitNumber: "A101", ownerName: "श्री. विठ्ठल रामचंद्र पाटील", tenantName: "सौ. क्षितिजा कुलकर्णी", billId: 42, billDate: "2026-10-04", items: many } as any;
for (const [label, args] of [
  ["long", [society, "2026-10", many, row]],
  ["long-blank", [society, "2026-10", many]],
  ["normal", [{ ...society, rules: "1. Pay before the 10th." }, "2026-10", many.slice(0, 3), { ...row, items: many.slice(0, 3) }]],
] as const) {
  const buf = await (await fitReceipt(pdfmake as any, ...(args as any))).getBuffer();
  
  console.log(label, "pages:", pages(buf));
  assert.equal(pages(buf), 1, label);
}
