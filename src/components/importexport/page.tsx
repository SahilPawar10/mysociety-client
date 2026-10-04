import { useState } from "react";
import ImportModal from "./importmodel";

export type ImportKind = "unit" | "unit-membership";

type Props = {
  kind: ImportKind;
  societyId: number;
};

export default function ImportExportActions({ kind, societyId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary"
      >
        Import Excel
      </button>

      {open ? (
        <ImportModal kind={kind} societyId={societyId} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
