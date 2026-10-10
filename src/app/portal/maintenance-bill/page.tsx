"use client";

import { useState } from "react";
import {
  useDeleteMaintenanceEntryMutation,
  useGetFeeHeadsQuery,
  useGetMaintenanceSheetQuery,
  useGetResourceListQuery,
  useSaveMaintenanceEntryMutation,
  useSetFeeHeadsMutation,
  type FeeHead,
  type MaintenanceItem,
  type MaintenanceSheet,
  type MaintenanceStatus,
} from "@/lib/features/portal/portalApi";
import { useAppSelector } from "@/lib/hooks";
import { can, isAdminRole } from "@/lib/permissions";
import { errorMessage } from "@/lib/api";
import { useLang, useT } from "@/lib/i18n";
import { downloadReceipt } from "./receipt";

const thisMonth = () => new Date().toLocaleDateString("en-CA").slice(0, 7);
const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const monthLabel = (m: string, locale = "en-IN") =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString(locale, { month: "long", year: "numeric" });

const STATUS_STYLE: Record<MaintenanceStatus, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  PARTIAL: "bg-amber-50 text-amber-700",
  UNPAID: "bg-red-50 text-red-700",
};

type Row = MaintenanceSheet["units"][number];

export default function MaintenancePage() {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  // Recording a payment is "create", changing the fee setup is "edit".
  const isAdmin = can(user, "maintenance-bill", "create");
  const canSetup = can(user, "maintenance-bill", "edit");
  const t = useT();
  const locale = useLang() === "mr" ? "mr-IN" : "en-IN";

  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const [month, setMonth] = useState(thisMonth);
  const [editing, setEditing] = useState<"setup" | "month" | Row | null>(null);

  const { data: societies = [] } = useGetResourceListQuery(
    { resource: "society" },
    { skip: !isSuperAdmin },
  );
  const societyId = isSuperAdmin ? Number(selectedSocietyId) : Number(user?.societyId);

  const { data, isLoading, error } = useGetMaintenanceSheetQuery(
    { societyId, month },
    // Always fresh on open: receipts print the society's rules/address from this response.
    { skip: !societyId || !month, refetchOnMountOrArgChange: true },
  );
  const { data: setupHeads = [] } = useGetFeeHeadsQuery(societyId, { skip: !societyId });

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title">{t("Monthly Maintenance")}</h2>
          <p className="page-subtitle">{month ? t("Who has paid for {month}.", { month: monthLabel(month, locale) }) : t("Who has paid for the month.")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isSuperAdmin ? (
            <select
              value={selectedSocietyId}
              onChange={(e) => setSelectedSocietyId(e.target.value)}
              className="input w-56"
              aria-label={t("Society")}
            >
              <option value="">{t("Select a society")}</option>
              {societies.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {String(s.name ?? t("Society {id}", { id: String(s.id) }))}
                </option>
              ))}
            </select>
          ) : null}
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || thisMonth())}
            className="input w-44"
            aria-label={t("Month")}
          />
          {data ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => downloadReceipt(data.society, month, data.heads)}
            >
              {t("Blank receipt")}
            </button>
          ) : null}
          {canSetup && societyId ? (
            <>
              <button type="button" className="btn-secondary" onClick={() => setEditing("month")}>
                {t("This month's fees")}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditing("setup")}>
                {t("Fee setup")}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {!societyId ? (
        <div className="card p-10 text-center">
          <p className="section-title">{t("Pick a society")}</p>
        </div>
      ) : isLoading ? (
        <div className="card h-40 animate-pulse bg-slate-50" />
      ) : error || !data ? (
        <p className="alert-error">{errorMessage(error, t("Failed to load maintenance."))}</p>
      ) : (
        <>
          {canSetup && !setupHeads.length ? (
            <div className="alert-warn flex items-center justify-between gap-3">
              <span>{t("Set up the fees you collect every month (Maintenance, Sinking Fund, Water…).")}</span>
              <button type="button" className="btn-primary btn-sm" onClick={() => setEditing("setup")}>
                {t("Set up fees")}
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            {[
              [t("Collected"), money(data.totals.collected), t("of {amount} due", { amount: money(data.totals.due) })],
              [t("Paid"), data.totals.paid, t("of {count} units", { count: data.totals.units })],
              // Partly paid units still owe money, so they count as unpaid here.
              [t("Unpaid"), data.totals.unpaid + data.totals.partial, t("units with dues")],
            ].map(([label, value, sub]) => (
              <article key={String(label)} className="card p-5">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{sub}</p>
              </article>
            ))}
          </div>

          <div className="space-y-6">
              {!data.units.length ? (
                <div className="card p-10 text-center text-slate-500">
                  {isAdminRole(user?.role) ? t("No units yet.") : t("No paid bills for this month.")}
                </div>
              ) : null}
              {/* Same tile grid as the Units tab, one block per wing (rows arrive sorted by wing). */}
              {[...new Set(data.units.map((u) => u.wingName))].map((wing) => (
                <div key={wing}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t("Wing {wing}", { wing })}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {data.units
                      .filter((u) => u.wingName === wing)
                      .map((row) => (
                        <button
                          key={row.unitId}
                          type="button"
                          // Members: their own paid entries, a click downloads the receipt.
                          disabled={!isAdmin && !row.billId}
                          onClick={() =>
                            isAdmin
                              ? setEditing(row)
                              : downloadReceipt(data.society, month, data.heads, row)
                          }
                          className={`text-left card p-4 transition disabled:cursor-default ${
                            isAdmin || row.billId ? "hover:-translate-y-0.5 hover:shadow-md hover:border-brand-300" : ""
                          }`}
                        >
                          <span className={`badge ${STATUS_STYLE[row.status]}`}>{t(row.status)}</span>
                          <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
                            {row.unitNumber}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{t("Floor {floor}", { floor: row.floor })}</p>
                          <p className="mt-3 text-sm text-slate-700 truncate">
                            {row.ownerName ?? <span className="text-slate-400">{t("No owner")}</span>}
                          </p>
                          <p className="mt-1 text-base font-semibold text-slate-900">
                            {money(row.paidAmount)}
                          </p>
                          <p className="mt-2 text-xs font-medium text-brand-700">
                            {isAdmin
                              ? row.billId
                                ? t("Edit entry")
                                : t("+ Add entry")
                              : t("Download receipt")}
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {editing === "setup" ? (
        <FeeHeadsModal
          title={t("Fee setup")}
          hint={t("Fees collected every month. Use 0 for fees collected only sometimes; you can enter the amount per unit when adding an entry.")}
          initial={setupHeads}
          initialRules={data?.society.rules ?? ""}
          societyId={societyId}
          onClose={() => setEditing(null)}
        />
      ) : editing === "month" && data ? (
        <FeeHeadsModal
          title={t("Fees for {month}", { month: monthLabel(month, locale) })}
          hint={t("Add or remove fees for this month only. Remove them all to go back to the fee setup.")}
          initial={data.heads}
          societyId={societyId}
          month={month}
          onClose={() => setEditing(null)}
        />
      ) : editing && typeof editing === "object" && data ? (
        <EntryModal
          row={editing}
          sheet={data}
          month={month}
          societyId={societyId}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}

/** Edits a list of { name, amount }: the setup form, or one month's fees. */
function FeeHeadsModal({
  title,
  hint,
  initial,
  initialRules,
  societyId,
  month,
  onClose,
}: {
  title: string;
  hint: string;
  initial: FeeHead[];
  /** Setup form only: notes printed at the bottom of every receipt. */
  initialRules?: string;
  societyId: number;
  month?: string;
  onClose: () => void;
}) {
  const [heads, setHeads] = useState<FeeHead[]>(initial.length ? initial : [{ name: "", amount: "" }]);
  const [rules, setRules] = useState(initialRules);
  const [setFeeHeads, { isLoading }] = useSetFeeHeadsMutation();
  const [message, setMessage] = useState("");
  const t = useT();

  const update = (i: number, patch: Partial<FeeHead>) =>
    setHeads(heads.map((h, j) => (j === i ? { ...h, ...patch } : h)));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setFeeHeads({
        societyId,
        month,
        heads: heads.filter((h) => h.name.trim()),
        rules,
      }).unwrap();
      onClose();
    } catch (error) {
      setMessage(errorMessage(error, t("Failed to save fees.")));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal max-w-lg space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="hint">{hint}</p>
        </div>
        {heads.map((h, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input"
              placeholder={t("Fee name, e.g. Sinking Fund")}
              value={h.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <input
              className="input w-32"
              type="number"
              min="0"
              step="0.01"
              placeholder={t("Amount")}
              value={h.amount}
              onChange={(e) => update(i, { amount: e.target.value })}
              required={Boolean(h.name.trim())}
            />
            <button
              type="button"
              className="btn-ghost btn-sm"
              aria-label={t("Remove fee")}
              onClick={() => {
                // A blank row has nothing to lose; a named fee asks first.
                if (h.name.trim() && !window.confirm(t("Remove \"{name}\"? It's only removed once you click Save.", { name: h.name.trim() }))) {
                  return;
                }
                setHeads(heads.filter((_, j) => j !== i));
              }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => setHeads([...heads, { name: "", amount: "" }])}
        >
          {t("+ Add fee")}
        </button>
        <p className="text-sm text-slate-600">
          {t("Total per unit:")}{" "}
          <strong>{money(heads.reduce((t, h) => t + (Number(h.amount) || 0), 0))}</strong>
        </p>
        {rules !== undefined ? (
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">{t("Receipt rules")}</span>
            <textarea
              className="input min-h-24"
              placeholder={t("e.g. 1) Pay maintenance between the 1st and 10th of every month. 2) ₹100 penalty after the 10th.")}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
            />
            <span className="hint">{t("Printed at the bottom of every maintenance receipt.")}</span>
          </label>
        ) : null}
        {message ? <p className="alert-error">{message}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? t("Saving...") : t("Save")}
          </button>
        </div>
      </form>
    </div>
  );
}

/** The "Add" form: the month's fees prefilled; admin marks each as received or not. */
function EntryModal({
  row,
  sheet,
  month,
  societyId,
  onClose,
}: {
  row: Row;
  sheet: MaintenanceSheet;
  month: string;
  societyId: number;
  onClose: () => void;
}) {
  const heads = sheet.heads;
  // Every fee of the month is listed, ₹0 ones too (collected only sometimes), so the admin can
  // charge any of them to this unit. ₹0 lines aren't saved, so an existing entry only has the rest.
  const [items, setItems] = useState<MaintenanceItem[]>(() => {
    const saved = row.billId ? row.items : [];
    const rest = heads
      .filter((h) => !saved.some((s) => s.name === h.name))
      .map((h) => ({ ...h, paid: !row.billId && Number(h.amount) > 0 }));
    return [...saved, ...rest];
  });
  const update = (i: number, patch: Partial<MaintenanceItem>) =>
    setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const [saveEntry, { isLoading }] = useSaveMaintenanceEntryMutation();
  const [deleteEntry] = useDeleteMaintenanceEntryMutation();
  const [message, setMessage] = useState("");
  const t = useT();
  const locale = useLang() === "mr" ? "mr-IN" : "en-IN";

  const received = items.reduce((t, i) => t + (i.paid ? Number(i.amount) || 0 : 0), 0);
  const total = items.reduce((t, i) => t + (Number(i.amount) || 0), 0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const charged = items.filter((i) => Number(i.amount) > 0);
    if (!charged.length) {
      setMessage(t("Enter an amount for at least one fee."));
      return;
    }
    try {
      await saveEntry({ societyId, unitId: row.unitId, month, items: charged }).unwrap();
      onClose();
    } catch (error) {
      setMessage(errorMessage(error, t("Failed to save entry.")));
    }
  };

  const onDelete = async () => {
    if (!row.billId || !window.confirm(t("Delete this entry? The unit will show as unpaid."))) {
      return;
    }
    try {
      await deleteEntry({ societyId, id: row.billId }).unwrap();
      onClose();
    } catch (error) {
      setMessage(errorMessage(error, t("Failed to delete entry.")));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal max-w-lg space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {row.wingName} - {row.unitNumber}
          </h2>
          <p className="hint">
            {t("{month} · tick each fee that was received. Enter an amount for an occasional fee to charge it to this unit.", {
              month: monthLabel(month, locale),
            })}
          </p>
        </div>
        {!items.length ? (
          <p className="alert-warn">{t("No fees for this month. Set them up in Fee setup first.")}</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {items.map((item, i) => (
              <li key={item.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={item.paid}
                    onChange={(e) => update(i, { paid: e.target.checked })}
                    className="h-4 w-4 accent-brand-600"
                  />
                  {item.name}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.amount}
                  // Typing an amount into an unticked ₹0 fee means it's being collected now.
                  onChange={(e) =>
                    update(i, {
                      amount: e.target.value,
                      paid: item.paid || (!(Number(item.amount) > 0) && Number(e.target.value) > 0),
                    })
                  }
                  className={`input w-28 text-right ${item.paid ? "" : "text-slate-400"}`}
                  aria-label={t("{name} amount", { name: item.name })}
                />
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-slate-600">
          {t("Received {received} of {total}", { received: money(received), total: money(total) })}
        </p>
        {message ? <p className="alert-error">{message}</p> : null}
        <div className="flex justify-between gap-2">
          {row.billId ? (
            <div className="flex gap-2">
              <button type="button" className="btn-danger" onClick={onDelete}>
                {t("Delete")}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => downloadReceipt(sheet.society, month, heads, row)}
              >
                {t("Download receipt")}
              </button>
            </div>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t("Cancel")}
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading || !items.length}>
              {isLoading ? t("Saving...") : t("Submit")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
