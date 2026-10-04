"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useDeleteDebitEntryMutation,
  useGetDebitEntriesQuery,
  useGetResourceListQuery,
  useSaveDebitEntryMutation,
  type DebitEntry,
  type Vendor,
} from "@/lib/features/portal/portalApi";
import { useAppSelector } from "@/lib/hooks";
import { errorMessage } from "@/lib/api";
import { downloadVoucher, periodFor, type VoucherSociety } from "./voucher";

const today = () => new Date().toLocaleDateString("en-CA");
const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const FREQUENCY: Record<Vendor["paymentFrequency"], string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};
const MODES = ["Cash", "Cheque", "UPI", "Bank transfer"];

export default function EssentialServicesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [editing, setEditing] = useState<Vendor | null>(null);

  const { data: societies = [] } = useGetResourceListQuery({ resource: "society" });
  const societyId = isSuperAdmin ? Number(selectedSocietyId) : Number(user?.societyId);
  const society = societies.find((s) => Number(s.id) === societyId) as VoucherSociety | undefined;

  const vendorsQuery = useGetResourceListQuery({ resource: "vendor", societyId }, { skip: !societyId });
  const vendors = (vendorsQuery.data ?? []) as unknown as Vendor[];
  const active = vendors.filter((v) => v.isActive);
  const { data: entries = [] } = useGetDebitEntriesQuery(societyId, { skip: !societyId });

  const month = today().slice(0, 7);
  const paidThisMonth = entries
    .filter((e) => e.paymentDate.startsWith(month))
    .reduce((t, e) => t + Number(e.amount), 0);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title">Essential Services</h2>
          <p className="page-subtitle">Payments to vendors: water, security and the rest.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isSuperAdmin ? (
            <select
              value={selectedSocietyId}
              onChange={(e) => setSelectedSocietyId(e.target.value)}
              className="input w-56"
              aria-label="Society"
            >
              <option value="">Select a society</option>
              {societies.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {String(s.name ?? `Society ${s.id}`)}
                </option>
              ))}
            </select>
          ) : null}
          <Link href="/portal/vendor" className="btn-secondary">
            Manage vendors
          </Link>
        </div>
      </div>

      {!societyId ? (
        <div className="card p-10 text-center">
          <p className="section-title">Pick a society</p>
        </div>
      ) : vendorsQuery.isLoading ? (
        <div className="card h-40 animate-pulse bg-slate-50" />
      ) : vendorsQuery.error ? (
        <p className="alert-error">{errorMessage(vendorsQuery.error, "Failed to load vendors.")}</p>
      ) : !vendors.length ? (
        <div className="card p-10 text-center space-y-3">
          <p className="section-title">No vendors yet</p>
          <p className="text-sm text-slate-500">Add who supplies water, security, housekeeping…</p>
          <Link href="/portal/vendor" className="btn-primary inline-block">
            Add a vendor
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            {[
              ["Paid this month", money(paidThisMonth), `${entries.filter((e) => e.paymentDate.startsWith(month)).length} payments`],
              ["Active vendors", active.length, `${new Set(active.map((v) => v.serviceType)).size} services`],
            ].map(([label, value, sub]) => (
              <article key={String(label)} className="card p-5">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{sub}</p>
              </article>
            ))}
          </div>

          {[
            ...[...new Set(active.map((v) => v.serviceType))].map((service) => ({
              title: service,
              list: active.filter((v) => v.serviceType === service),
            })),
            // Replaced/ended vendors: payment history and receipts only.
            { title: "Past vendors", list: vendors.filter((v) => !v.isActive) },
          ]
            .filter((group) => group.list.length)
            .map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                {group.list.map((v) => {
                    // Entries arrive newest first.
                    const last = entries.find((e) => e.vendorId === v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setEditing(v)}
                        className="text-left card p-4 transition hover:-translate-y-0.5 hover:shadow-md hover:border-brand-300"
                      >
                        <span className="badge bg-slate-100 text-slate-600">
                          {v.isActive ? (v.vendorType === "COMPANY" ? "Company" : "Individual") : v.serviceType}
                        </span>
                        <p className="mt-3 text-base font-semibold tracking-tight text-slate-900 truncate">{v.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {FREQUENCY[v.paymentFrequency]} · {money(Number(v.paymentAmount))}
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          {last
                            ? `Last paid ${new Date(last.paymentDate).toLocaleDateString("en-IN")} · ${last.period ?? ""}`
                            : "Not paid yet"}
                        </p>
                        <p className="mt-2 text-xs font-medium text-brand-700">
                          {v.isActive
                            ? "+ Add entry"
                            : `${v.startDate ?? ""} → ${v.endDate ?? "ended"} · View payments`}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </>
      )}

      {editing ? (
        <PaymentModal
          vendor={editing}
          entries={entries.filter((e) => e.vendorId === editing.id)}
          society={society ?? {}}
          societyId={societyId}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}

/** New debit entry for a vendor, plus its past payments with voucher download. */
function PaymentModal({
  vendor,
  entries,
  society,
  societyId,
  onClose,
}: {
  vendor: Vendor;
  entries: DebitEntry[];
  society: VoucherSociety;
  societyId: number;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    paymentDate: today(),
    amount: String(Number(vendor.paymentAmount) || ""),
    period: periodFor(vendor.paymentFrequency, today()),
    paymentMode: "Cash",
    reference: "",
    note: "",
  });
  const [saveEntry, { isLoading }] = useSaveDebitEntryMutation();
  const [deleteEntry] = useDeleteDebitEntryMutation();
  const [message, setMessage] = useState("");
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await saveEntry({ societyId, vendorId: vendor.id, ...form }).unwrap();
      if (window.confirm("Payment saved. Download the voucher?")) {
        await downloadVoucher(society, vendor, saved);
      }
      onClose();
    } catch (error) {
      setMessage(errorMessage(error, "Failed to save payment."));
    }
  };

  const onDelete = async (id: number) => {
    if (!window.confirm("Delete this payment entry?")) {
      return;
    }
    try {
      await deleteEntry({ societyId, id }).unwrap();
    } catch (error) {
      setMessage(errorMessage(error, "Failed to delete payment."));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal max-w-lg space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{vendor.name}</h2>
          <p className="hint">
            {vendor.serviceType} · {FREQUENCY[vendor.paymentFrequency]} {money(Number(vendor.paymentAmount))}
          </p>
        </div>
        {!vendor.isActive ? (
          <p className="alert-warn">
            This vendor has ended ({vendor.startDate ?? "—"} → {vendor.endDate ?? "—"}). Its payments are kept
            below; to add a new one, mark it Active again in Vendors.
          </p>
        ) : null}
        <fieldset disabled={!vendor.isActive} className={vendor.isActive ? "grid grid-cols-2 gap-3" : "hidden"}>
          <label className="block space-y-1">
            <span className="label">Date</span>
            <input
              type="date"
              className="input"
              required
              value={form.paymentDate}
              onChange={(e) =>
                set({
                  paymentDate: e.target.value,
                  period: e.target.value ? periodFor(vendor.paymentFrequency, e.target.value) : form.period,
                })
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="label">Amount paid</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="input"
              required
              value={form.amount}
              onChange={(e) => set({ amount: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="label">For period</span>
            <input className="input" value={form.period} onChange={(e) => set({ period: e.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="label">Mode</span>
            <select className="input" value={form.paymentMode} onChange={(e) => set({ paymentMode: e.target.value })}>
              {MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 col-span-2">
            <span className="label">Cheque / transaction no.</span>
            <input className="input" value={form.reference} onChange={(e) => set({ reference: e.target.value })} />
          </label>
          <label className="block space-y-1 col-span-2">
            <span className="label">Note</span>
            <textarea className="input" value={form.note} onChange={(e) => set({ note: e.target.value })} />
          </label>
        </fieldset>
        {message ? <p className="alert-error">{message}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {vendor.isActive ? "Cancel" : "Close"}
          </button>
          {vendor.isActive ? (
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Saving…" : "Save payment"}
            </button>
          ) : null}
        </div>

        {entries.length ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Past payments</p>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{money(Number(e.amount))}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {new Date(e.paymentDate).toLocaleDateString("en-IN")} · {e.period ?? "—"} · {e.paymentMode ?? ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => downloadVoucher(society, vendor, e)}>
                      Receipt
                    </button>
                    <button type="button" className="btn-ghost btn-sm" aria-label="Delete payment" onClick={() => onDelete(e.id)}>
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </div>
  );
}
