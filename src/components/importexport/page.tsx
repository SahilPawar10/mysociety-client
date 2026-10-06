import { useState } from "react";
import ImportModal from "./importmodel";
import { useT } from "@/lib/i18n";

export type ImportKind = "unit" | "unit-membership" | "asset";

type Props = {
  kind: ImportKind;
  societyId: number;
};

export default function ImportExportActions({ kind, societyId }: Props) {
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
        <ImportModal kind={kind} societyId={societyId} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
