import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  templateDownload?: () => Promise<void>;
};

export default function ImportModal({
  open,
  onClose,
  onImport,
  templateDownload,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      await onImport(file);
    } catch (error) {
      setLoading(false);
    }
    // setLoading(true);
    // await onImport(file);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[450px] p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Import Excel File
          </h2>

          {templateDownload && (
            <button
              onClick={templateDownload}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Download Template
            </button>
          )}
        </div>

        {/* File Upload */}
        <div className="mt-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-gray-100 file:text-gray-700
            hover:file:bg-gray-200"
          />
        </div>

        {file && (
          <p className="text-xs text-gray-500 mt-2">Selected: {file.name}</p>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleImport}
            disabled={!file || loading}
            className={`px-4 py-2 rounded-lg text-white font-medium transition ${
              !file || loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
