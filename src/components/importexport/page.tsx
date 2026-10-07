import { useState } from "react";
import ImportModal from "./importmodel";
import { useT } from "@/lib/i18n";

export type ImportKind =
  | "unit"
  | "unit-membership"
  | "asset"
  | "migration-maintenance"
  | "migration-credits"
  | "migration-debits";

type Props = {
  kind: ImportKind;
  societyId: number;
  templateQuery?: string;
};

export default function ImportExportActions({ kind, societyId, templateQuery }: Props) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary"
      >
        {t("Import Excel")}
      </button>

      {open ? (
        <ImportModal
          kind={kind}
          societyId={societyId}
          templateQuery={templateQuery}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
