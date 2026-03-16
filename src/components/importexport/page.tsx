import { useState } from "react";
import ImportModal from "./importmodel";

type Props = {
  onImport: (file: File) => Promise<void>;
  onExport?: () => Promise<void>;
  templateDownload?: () => Promise<void>;
};

export default function ImportExportActions({
  onExport,
  onImport,
  templateDownload,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-400 transition"
        >
          Import
        </button>

        {onExport && (
          <button
            onClick={onExport}
            className="px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition"
          >
            Export
          </button>
        )}
      </div>

      <ImportModal
        open={open}
        onClose={() => setOpen(false)}
        onImport={onImport}
        templateDownload={templateDownload}
      />
    </>
  );
}
