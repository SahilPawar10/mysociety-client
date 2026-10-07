"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useGetResourceListQuery,
  useSetOpeningBalanceMutation,
} from "@/lib/features/portal/portalApi";
import ImportExportActions, { type ImportKind } from "@/components/importexport/page";
import { useAppSelector } from "@/lib/hooks";
import { errorMessage } from "@/lib/api";
import { useT } from "@/lib/i18n";

/** 1 April of the current financial year: where last year's closing balance is booked. */
const fyStartDate = () => {
  const [y, m] = new Date().toLocaleDateString("en-CA").split("-").map(Number);
  return `${m >= 4 ? y : y - 1}-04-01`;
};

const IMPORTS: { kind: Exclude<ImportKind, "migration-maintenance">; title: string; text: string }[] = [
  {
    kind: "migration-credits",
    title: "Past credits",
    text: "Hall booking, interest, donations… received before using the portal.",
  },
  {
    kind: "migration-debits",
    title: "Past debits",
    text: "Vendor payments and expenses. Replaced vendors: add them under Vendors (inactive, with start/end dates) first, so each payment goes to the vendor serving then.",
  },
];

/** Last onboarding step: bring the society's old books in. */
export default function MigrationPage() {
  const t = useT();
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const { data: societies = [] } = useGetResourceListQuery({ resource: "society" }, { skip: !isSuperAdmin });
  const societyId = isSuperAdmin ? Number(selectedSocietyId) : Number(user?.societyId);
  const [month, setMonth] = useState("");

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title">{t("Previous Data")}</h2>
          <p className="page-subtitle">
            {t("Bring over the books from before the portal. Every import can be previewed first, and uploading the same sheet again skips what is already saved.")}
          </p>
        </div>
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
      </div>

      {!societyId ? (
        <div className="card p-10 text-center">
          <p className="section-title">{t("Pick a society")}</p>
        </div>
      ) : (
        <>
          <OpeningBalanceCard key={societyId} societyId={societyId} />

          <div className="card p-5 space-y-3">
            <div>
              <p className="section-title">{t("Past maintenance")}</p>
              <p className="text-sm text-slate-500">
                {t("The sheet has one column per fee from your fee setup. A month with different fees: set that month's fees in Monthly Maintenance first, then pick the month here.")}{" "}
                <Link href="/portal/maintenance-bill" className="link">
                  {t("Monthly Maintenance")}
                </Link>
              </p>
              <p className="hint mt-1">
                {t("Each month goes to the unit's owner on that date, from the owner's start date. Set start dates in Units → household, or fill ownerName in the sheet.")}
              </p>
            </div>
            <div className="flex items-end gap-3 flex-wrap">
              <label className="block space-y-1">
                <span className="label">{t("Template for month (optional)")}</span>
                <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-48" />
              </label>
              <ImportExportActions
                kind="migration-maintenance"
                societyId={societyId}
                templateQuery={month ? `month=${month}` : undefined}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {IMPORTS.map((item) => (
              <div key={item.kind} className="card p-5 space-y-3">
                <div>
                  <p className="section-title">{t(item.title)}</p>
                  <p className="text-sm text-slate-500">{t(item.text)}</p>
                </div>
                <ImportExportActions kind={item.kind} societyId={societyId} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function OpeningBalanceCard({ societyId }: { societyId: number }) {
  const t = useT();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(fyStartDate);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [save, { isLoading }] = useSetOpeningBalanceMutation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await save({ societyId, amount, date, note: note || undefined }).unwrap();
      setMessage({ ok: true, text: t("Saved. It shows in Credits & Debits as \"Opening Balance\".") });
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err, t("Failed to save.")) });
    }
  };

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <div>
        <p className="section-title">{t("Last year's closing balance")}</p>
        <p className="text-sm text-slate-500">
          {t("Saved as an \"Opening Balance\" credit on the date below. A deficit (negative amount) is saved as a debit. Saving again replaces it.")}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1">
          <span className="label">{t("Amount")}</span>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
          />
        </label>
        <label className="block space-y-1">
          <span className="label">{t("Date")}</span>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </label>
        <label className="block space-y-1">
          <span className="label">{t("Note (optional)")}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className="input" />
        </label>
      </div>
      {message ? <p className={message.ok ? "alert-success" : "alert-error"}>{message.text}</p> : null}
      <button type="submit" disabled={isLoading || !amount} className="btn-primary">
        {isLoading ? t("Saving...") : t("Save")}
      </button>
    </form>
  );
}
