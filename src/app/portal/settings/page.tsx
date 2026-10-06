"use client";

import { useT } from "@/lib/i18n";

export default function SettingsPage() {
  const t = useT();
  return (
    <section className="space-y-4">
      <h2 className="page-title">{t("Settings")}</h2>
      <div className="card p-6 space-y-2 max-w-xl">
        <p className="text-slate-700">{t("No settings routes are available in backend yet.")}</p>
        <p className="text-sm text-slate-500">
          {t("Add routes in backend (for example `/v1/user-settings`) and then I will wire this page with RTK Query.")}
        </p>
      </div>
    </section>
  );
}
