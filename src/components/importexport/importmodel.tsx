import { useState } from "react";
import {
  useExportFileMutation,
  useImportFileMutation,
  type ImportResult,
} from "@/lib/features/portal/portalApi";
import { downloadBlob, errorMessage } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { ImportKind } from "./page";

const IMPORTS = {
  unit: {
    title: "Import Units",
    path: "/v1/unit/import",
    template: "/v1/unit/import/template",
    templateFile: "unit-import-template.xlsx",
    help: "One row per flat. New wing names are created automatically.",
  },
  "unit-membership": {
    title: "Import Residents",
    path: "/v1/unit-membership/import",
    template: "/v1/unit-membership/import/template",
    templateFile: "resident-import-template.xlsx",
    help: "One row per person. relation SELF (or empty) = owner/tenant, who needs a phone or email to log in. Wife, Son… = their family. startDate = the day the owner bought / tenant moved in (blank = from the beginning).",
  },
  asset: {
    title: "Import Assets",
    path: "/v1/asset/import",
    template: "/v1/asset/import/template",
    templateFile: "asset-import-template.xlsx",
    help: "Assets the society already owns, one row each. Only name is required. These are not added to debits.",
  },
  "migration-maintenance": {
    title: "Import past maintenance",
    path: "/v1/migration/maintenance/import",
    template: "/v1/migration/maintenance/template",
    templateFile: "maintenance-history-template.xlsx",
    help: "One row per unit per month, one column per fee: write the amount paid, blank = unpaid. ownerName blank = the owner on that date (from owner start dates).",
  },
  "migration-credits": {
    title: "Import past credits",
    path: "/v1/migration/credits/import",
    template: "/v1/migration/credits/template",
    templateFile: "credits-history-template.xlsx",
    help: "Money received other than maintenance. date, category and amount are required; a unit is optional.",
  },
  "migration-debits": {
    title: "Import past debits",
    path: "/v1/migration/debits/import",
    template: "/v1/migration/debits/template",
    templateFile: "debits-history-template.xlsx",
    help: "With vendorName = a payment to the vendor serving on that date; without it = a society expense.",
  },
} as const;

type Props = {
  kind: ImportKind;
  societyId: number;
  onClose: () => void;
  // Extra template query, e.g. "month=2025-04" for the maintenance history sheet.
  templateQuery?: string;
};

/** Pick file → Preview (dry run, nothing saved) → Import → result. */
export default function ImportModal({ kind, societyId, onClose, templateQuery }: Props) {
  const config = IMPORTS[kind];
  const t = useT();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const [importFile, { isLoading }] = useImportFileMutation();
  const [exportFile] = useExportFileMutation();

  const run = async (dryRun: boolean) => {
    if (!file) {
      return;
    }
    setError("");
    try {
      const data = await importFile({ path: config.path, societyId, file, dryRun }).unwrap();
      if (dryRun) {
        setPreview(data);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(errorMessage(err, "Import failed."));
    }
  };

  const downloadTemplate = async () => {
    setError("");
    try {
      const blob = await exportFile(
        `${config.template}?societyId=${societyId}${templateQuery ? `&${templateQuery}` : ""}`,
      ).unwrap();
      downloadBlob(blob, config.templateFile);
    } catch (err) {
      setError(errorMessage(err, "Template download failed."));
    }
  };

  const shown = result ?? preview;
  const willImport = (r: ImportResult) =>
    (r.insertedCount ?? 0) + (r.membershipsCreated ?? 0) + (r.familyMembersCreated ?? 0);

  const INSERTED_LABEL: Partial<Record<ImportKind, string>> = {
    unit: "units",
    asset: "assets",
    "migration-maintenance": "monthly entries",
    "migration-credits": "credits",
  };
  const summary = (r: ImportResult) =>
    kind === "unit-membership"
      ? [
          [r.membershipsCreated ?? 0, "owners / tenants"],
          [r.familyMembersCreated ?? 0, "family members"],
          [r.skipped.length, "skipped"],
        ]
      : kind === "migration-debits"
        ? [
            [r.vendorPayments ?? 0, "vendor payments"],
            [r.expenses ?? 0, "expenses"],
            [r.skipped.length, "skipped"],
          ]
        : [
            [r.insertedCount ?? 0, INSERTED_LABEL[kind] ?? "records"],
            [r.skipped.length, "skipped"],
          ];

  const step = result ? 3 : preview ? 2 : 1;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t(config.title)}</h2>
            <p className="mt-1 text-sm text-slate-500">{t(config.help)}</p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm" aria-label={t("Close")}>
            ✕
          </button>
        </div>

        <ol className="mt-5 flex items-center gap-2 text-xs">
          {["Choose file", "Preview", "Done"].map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full font-semibold ${
                  step > i ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {i + 1}
              </span>
              <span className={step > i ? "text-slate-800" : "text-slate-400"}>{t(label)}</span>
              {i < 2 ? <span className="mx-1 h-px w-6 bg-slate-200" /> : null}
            </li>
          ))}
        </ol>

        {!result ? (
          <div className="mt-5 space-y-2">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setPreview(null);
                setError("");
              }}
              className="file-input"
            />
            <p className="hint">
              {t("Don't have the sheet?")}{" "}
              <button type="button" onClick={downloadTemplate} className="link">
                {t("Download the template")}
              </button>{" "}
              {t("(already filled with your society's data).")}
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-4 alert-error">{t(error)}</p> : null}

        {shown ? (
          <div className="mt-5 space-y-4">
            <p className={result ? "alert-success" : "alert-warn"}>
              {result
                ? t("Import finished.")
                : t("Preview only: nothing is saved until you click Import.")}
            </p>

            <div className="grid grid-cols-3 gap-3">
              {summary(shown).map(([value, label]) => (
                <div key={label} className="rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-2xl font-semibold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{t(String(label))}</p>
                </div>
              ))}
            </div>

            {shown.skipped.length ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="table">
                    <thead className="sticky top-0">
                      <tr>
                        <th className="w-24">{t("Excel row")}</th>
                        <th>{t("Why it was skipped")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.skipped.map((s) => (
                        <tr key={`${s.rowNumber}-${s.reason}`}>
                          <td className="font-mono text-slate-500">{s.rowNumber}</td>
                          <td>{s.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            {result ? t("Close") : t("Cancel")}
          </button>

          {!result && !preview ? (
            <button
              type="button"
              onClick={() => run(true)}
              disabled={!file || isLoading}
              className="btn-primary"
            >
              {isLoading ? t("Checking...") : t("Preview")}
            </button>
          ) : null}

          {!result && preview ? (
            <button
              type="button"
              onClick={() => run(false)}
              disabled={isLoading || willImport(preview) === 0}
              className="btn-primary"
            >
              {isLoading ? t("Importing...") : t("Import {count} records", { count: willImport(preview) })}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
