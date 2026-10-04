"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useCreateResourceMutation,
  useDeleteCreditEntryMutation,
  useDeleteResourceMutation,
  useGetLedgerCategoriesQuery,
  useGetLedgerQuery,
  useGetLedgerSummaryQuery,
  useGetResourceListQuery,
  useSaveCreditEntryMutation,
  type LedgerEntry,
  type LedgerSource,
} from "@/lib/features/portal/portalApi";
import { useAppSelector } from "@/lib/hooks";
import { errorMessage } from "@/lib/api";

const today = () => new Date().toLocaleDateString("en-CA");
const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const MODES = ["Cash", "Cheque", "UPI", "Bank transfer"];

const SOURCE: Record<LedgerSource, string> = {
  MAINTENANCE: "Maintenance",
  OTHER_INCOME: "Other income",
  EXPENSE: "Expense",
  VENDOR_PAYMENT: "Vendor payment",
  ASSET_PURCHASE: "Asset purchase",
};

// Where a row that isn't edited here is managed.
const MANAGED_AT: Partial<Record<LedgerSource, [string, string]>> = {
  MAINTENANCE: ["/portal/maintenance-bill", "Monthly Maintenance"],
  VENDOR_PAYMENT: ["/portal/essential-service", "Essential Services"],
  ASSET_PURCHASE: ["/portal/asset", "Assets"],
};

/** Financial year (Apr–Mar) starting in `start`. */
const fy = (start: number) => ({ from: `${start}-04-01`, to: `${start + 1}-03-31`, label: `FY ${start}-${String(start + 1).slice(2)}` });
const currentFyStart = () => {
  const [y, m] = today().split("-").map(Number);
  return m >= 4 ? y : y - 1;
};

type Tab = "credits" | "debits" | "balance";

export default function AccountsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [tab, setTab] = useState<Tab>("credits");
  const [fyStart, setFyStart] = useState(currentFyStart);
  const [adding, setAdding] = useState(false);

  const { data: societies = [] } = useGetResourceListQuery({ resource: "society" }, { skip: !isSuperAdmin });
  const societyId = isSuperAdmin ? Number(selectedSocietyId) : Number(user?.societyId);
  const { from, to } = fy(fyStart);

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title">Credits &amp; Debits</h2>
          <p className="page-subtitle">
            Every rupee in and out, by category. Use the same category for repeated entries so the balance sheet adds
            them up.
          </p>
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
          <select
            value={fyStart}
            onChange={(e) => setFyStart(Number(e.target.value))}
            className="input w-36"
            aria-label="Financial year"
          >
            {Array.from({ length: 6 }, (_, i) => currentFyStart() - i).map((y) => (
              <option key={y} value={y}>
                {fy(y).label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 print:hidden" role="tablist">
        {(
          [
            ["credits", "Credits"],
            ["debits", "Debits"],
            ["balance", "Balance sheet"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === key ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
        {tab !== "balance" && societyId ? (
          <button type="button" onClick={() => setAdding(true)} className="btn-primary ml-auto">
            {tab === "credits" ? "+ Add credit" : "+ Add expense"}
          </button>
        ) : null}
      </div>

      {!societyId ? (
        <div className="card p-10 text-center">
          <p className="section-title">Pick a society</p>
        </div>
      ) : tab === "balance" ? (
        <BalanceSheet societyId={societyId} from={from} to={to} label={fy(fyStart).label} />
      ) : (
        <EntryList key={tab} side={tab} societyId={societyId} from={from} to={to} />
      )}

      {adding && societyId && tab !== "balance" ? (
        <AddEntryModal side={tab} societyId={societyId} onClose={() => setAdding(false)} />
      ) : null}
    </section>
  );
}

function EntryList({
  side,
  societyId,
  from,
  to,
}: {
  side: "credits" | "debits";
  societyId: number;
  from: string;
  to: string;
}) {
  const { data: entries = [], isLoading, error } = useGetLedgerQuery({ societyId, side, from, to });
  const [deleteCredit] = useDeleteCreditEntryMutation();
  const [deleteResource] = useDeleteResourceMutation();
  const [message, setMessage] = useState("");
  const total = entries.reduce((t, e) => t + e.amount, 0);
  const isCredit = side === "credits";

  const onDelete = async (e: LedgerEntry) => {
    if (!e.id || !window.confirm(`Delete "${e.title}"?`)) {
      return;
    }
    try {
      if (e.source === "OTHER_INCOME") {
        await deleteCredit({ societyId, id: e.id }).unwrap();
      } else {
        await deleteResource({ resource: "society-expense", id: e.id, societyId }).unwrap();
      }
    } catch (err) {
      setMessage(errorMessage(err, "Delete failed."));
    }
  };

  if (isLoading) {
    return <div className="card h-40 animate-pulse bg-slate-50" />;
  }
  if (error) {
    return <p className="alert-error">{errorMessage(error, `Failed to load ${side}.`)}</p>;
  }

  return (
    <div className="space-y-3">
      {message ? <p className="alert-error">{message}</p> : null}
      <div className="card w-full max-w-full overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table min-w-max">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                {isCredit ? (
                  <>
                    <th>Unit</th>
                    <th>Owner</th>
                  </>
                ) : null}
                <th>Details</th>
                <th className="text-right">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const managed = MANAGED_AT[e.source];
                return (
                  <tr key={`${e.source}-${e.id ?? i}-${e.category}`}>
                    <td className="whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <span className="badge bg-slate-100 text-slate-600">{SOURCE[e.source]}</span>
                    </td>
                    <td className="font-medium text-slate-800">{e.category}</td>
                    {isCredit ? (
                      <>
                        <td className="whitespace-nowrap">{e.unit ?? "—"}</td>
                        <td>{e.ownerName ?? "—"}</td>
                      </>
                    ) : null}
                    <td className="max-w-[280px] whitespace-normal break-words text-slate-600">{e.title}</td>
                    <td className="text-right font-medium">{money(e.amount)}</td>
                    <td className="text-right whitespace-nowrap">
                      {managed ? (
                        <Link href={managed[0]} className="link text-xs">
                          {managed[1]}
                        </Link>
                      ) : (
                        <button type="button" className="btn-ghost btn-sm" aria-label="Delete" onClick={() => onDelete(e)}>
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {entries.length ? (
              <tfoot>
                <tr>
                  <td colSpan={isCredit ? 6 : 4} className="font-semibold">
                    Total {side}
                  </td>
                  <td className="text-right font-semibold">{money(total)}</td>
                  <td />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
        {!entries.length ? (
          <div className="p-10 text-center">
            <p className="section-title">No {side} in this year</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Credit → /v1/ledger/credits; debit → a society expense. Both need a category. */
function AddEntryModal({
  side,
  societyId,
  onClose,
}: {
  side: "credits" | "debits";
  societyId: number;
  onClose: () => void;
}) {
  const isCredit = side === "credits";
  const [form, setForm] = useState({
    category: "",
    title: "",
    amount: "",
    date: today(),
    paymentMode: "Cash",
    reference: "",
    note: "",
    unitId: "",
    ownerName: "",
  });
  const { data: categories } = useGetLedgerCategoriesQuery(societyId);
  const { data: unitList = [] } = useGetResourceListQuery({ resource: "unit", societyId }, { skip: !isCredit });
  const { data: wingList = [] } = useGetResourceListQuery({ resource: "wing", societyId }, { skip: !isCredit });
  const wingName = (id: unknown) => String(wingList.find((w) => w.id === id)?.name ?? "");
  const [saveCredit, { isLoading: savingCredit }] = useSaveCreditEntryMutation();
  const [createResource, { isLoading: savingDebit }] = useCreateResourceMutation();
  const [message, setMessage] = useState("");
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCredit) {
        await saveCredit({ societyId, ...form, entryDate: form.date }).unwrap();
      } else {
        await createResource({
          resource: "society-expense",
          payload: {
            societyId,
            category: form.category,
            title: form.title || form.category,
            amount: form.amount,
            expenseDate: form.date,
            description: form.note || null,
          },
        }).unwrap();
      }
      onClose();
    } catch (err) {
      setMessage(errorMessage(err, "Failed to save."));
    }
  };

  const suggestions = (isCredit ? categories?.credits : categories?.debits) ?? [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal max-w-lg space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{isCredit ? "New credit" : "New expense"}</h2>
          <p className="hint">
            {isCredit
              ? "Money received other than maintenance: hall booking, interest, donation…"
              : "Vendor payments and asset purchases are added from their own pages."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1 col-span-2">
            <span className="label">Category (pick an existing one for repeated entries)</span>
            <input
              className="input"
              required
              list="ledger-categories"
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
            />
            <datalist id="ledger-categories">
              {suggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="block space-y-1 col-span-2">
            <span className="label">Title</span>
            <input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="label">Amount</span>
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
            <span className="label">Date</span>
            <input type="date" className="input" required value={form.date} onChange={(e) => set({ date: e.target.value })} />
          </label>
          {isCredit ? (
            <>
              <label className="block space-y-1">
                <span className="label">Unit (optional)</span>
                <select className="input" value={form.unitId} onChange={(e) => set({ unitId: e.target.value })}>
                  <option value="">Not from a flat</option>
                  {unitList.map((u) => (
                    <option key={String(u.id)} value={String(u.id)}>
                      {[wingName(u.wingId), u.unitNumber].filter(Boolean).join(" - ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="label">Owner / paid by</span>
                <input
                  className="input"
                  placeholder={form.unitId ? "Blank = the unit's owner" : ""}
                  value={form.ownerName}
                  onChange={(e) => set({ ownerName: e.target.value })}
                />
              </label>
              <label className="block space-y-1">
                <span className="label">Mode</span>
                <select className="input" value={form.paymentMode} onChange={(e) => set({ paymentMode: e.target.value })}>
                  {MODES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="label">Cheque / transaction no.</span>
                <input className="input" value={form.reference} onChange={(e) => set({ reference: e.target.value })} />
              </label>
            </>
          ) : null}
          <label className="block space-y-1 col-span-2">
            <span className="label">Note</span>
            <textarea className="input" value={form.note} onChange={(e) => set({ note: e.target.value })} />
          </label>
        </div>
        {message ? <p className="alert-error">{message}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={savingCredit || savingDebit}>
            {savingCredit || savingDebit ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Year totals per type + category, credits beside debits, with the surplus / deficit. */
function BalanceSheet({ societyId, from, to, label }: { societyId: number; from: string; to: string; label: string }) {
  const { data, isLoading, error } = useGetLedgerSummaryQuery({ societyId, from, to });

  if (isLoading) {
    return <div className="card h-40 animate-pulse bg-slate-50" />;
  }
  if (error || !data) {
    return <p className="alert-error">{errorMessage(error, "Failed to load the balance sheet.")}</p>;
  }

  const side = (title: string, groups: typeof data.credits) => (
    <div className="card overflow-hidden">
      <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
        {title}
      </p>
      <table className="table">
        <tbody>
          {groups.groups.map((g) => (
            <tr key={`${g.source}-${g.category}`}>
              <td>
                <p className="font-medium text-slate-800">{g.category}</p>
                <p className="text-xs text-slate-500">
                  {SOURCE[g.source]} · {g.count} {g.count === 1 ? "entry" : "entries"}
                </p>
              </td>
              <td className="text-right font-medium">{money(g.amount)}</td>
            </tr>
          ))}
          {!groups.groups.length ? (
            <tr>
              <td colSpan={2} className="text-center text-slate-500">
                Nothing this year
              </td>
            </tr>
          ) : null}
        </tbody>
        <tfoot>
          <tr>
            <td className="font-semibold">Total</td>
            <td className="text-right font-semibold">{money(groups.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-600">
          {label} · {new Date(from).toLocaleDateString("en-IN")} to {new Date(to).toLocaleDateString("en-IN")}
        </p>
        <button type="button" className="btn-secondary print:hidden" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {side("Credits (income)", data.credits)}
        {side("Debits (expenditure)", data.debits)}
      </div>
      <div className={data.net >= 0 ? "alert-success" : "alert-error"}>
        {data.net >= 0 ? "Surplus" : "Deficit"} for the year: <strong>{money(Math.abs(data.net))}</strong>
      </div>
    </div>
  );
}
