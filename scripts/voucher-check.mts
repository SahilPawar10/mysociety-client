/* Voucher fits one A5 page and periods are labelled right: `node scripts/voucher-check.mts` */
import assert from "node:assert/strict";

import pdfmake from "pdfmake";
import { periodFor, voucherDoc } from "../src/app/portal/essential-service/voucher.ts";
pdfmake.setFonts({ Mukta: { normal: "public/fonts/Mukta-Regular.ttf", bold: "public/fonts/Mukta-Bold.ttf", italics: "public/fonts/Mukta-Regular.ttf", bolditalics: "public/fonts/Mukta-Bold.ttf" } });
const pages = (buf: Buffer) => (buf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;

assert.equal(periodFor("MONTHLY", "2026-10-04"), "October 2026");
assert.equal(periodFor("QUARTERLY", "2026-10-04"), "Oct–Dec 2026");
assert.equal(periodFor("YEARLY", "2026-10-04"), "FY 2026-27");
assert.equal(periodFor("YEARLY", "2027-03-31"), "FY 2026-27");

const society = { name: "श्री गणेश सहकारी गृहनिर्माण संस्था", address: "Kothrud", city: "Pune", state: "Maharashtra", pincode: "411038" };
const vendor = { id: 1, serviceType: "Water", vendorType: "COMPANY", name: "जलसेवा टँकर्स Pvt Ltd", address: "Plot 12, MIDC, Pune", email: null, phone: "9876543210", paymentFrequency: "MONTHLY", paymentAmount: "12500" } as const;
const entry = { id: 7, vendorId: 1, amount: "12500.50", paymentDate: "2026-10-04", period: "October 2026", paymentMode: "Cheque", reference: "004512", note: "Paid for 20 tankers" };
const buf = await (pdfmake as any).createPdf(voucherDoc(society, vendor, entry)).getBuffer();
assert.equal(pages(buf), 1);
console.log("voucher ok");
