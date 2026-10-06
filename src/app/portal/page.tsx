"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useGetOnboardingStatusQuery,
  useGetResourceListQuery,
} from "@/lib/features/portal/portalApi";
import { useAppSelector } from "@/lib/hooks";
import { errorMessage } from "@/lib/api";
import { useT } from "@/lib/i18n";

export default function PortalDashboardPage() {
  const t = useT();
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = isSuperAdmin || user?.role === "SOCIETY_ADMIN";

  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const { data: societies = [] } = useGetResourceListQuery(
    { resource: "society" },
    { skip: !isSuperAdmin },
  );
  const societyId = isSuperAdmin ? Number(selectedSocietyId) : Number(user?.societyId);

  const firstName = user?.name?.split(" ")[0] ?? t("there");

  if (!isAdmin) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="page-title">{t("Hello, {name}", { name: firstName })}</h2>
          <p className="page-subtitle">{t("What would you like to do today?")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
          {[
            ["/portal/maintenance-bill", "Monthly maintenance", "See what's due and what's paid."],
            ["/portal/complaint", "Raise a complaint", "Report an issue to your society office."],
          ].map(([href, title, text]) => (
            <Link key={href} href={href} className="card p-5 transition hover:border-brand-300 hover:shadow-md">
              <p className="section-title">{t(title)}</p>
              <p className="mt-1 text-sm text-slate-500">{t(text)}</p>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title">{t("Hello, {name}", { name: firstName })}</h2>
          <p className="page-subtitle">{t("Here's how your society's setup is going.")}</p>
        </div>
        {isSuperAdmin ? (
          <div className="flex items-center gap-3">
            <select
              value={selectedSocietyId}
              onChange={(e) => setSelectedSocietyId(e.target.value)}
              className="input w-64"
              aria-label={t("Society")}
            >
              <option value="">{t("Select a society")}</option>
              {societies.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {String(s.name ?? t("Society {id}", { id: String(s.id) }))}
                </option>
              ))}
            </select>
            <Link href="/portal/onboard-society" className="btn-primary whitespace-nowrap">
              {t("+ Onboard society")}
            </Link>
          </div>
        ) : null}
      </div>

      {societyId ? (
        <OnboardingStatusCard societyId={societyId} />
      ) : (
        <div className="card p-10 text-center">
          <p className="section-title">{t("Pick a society")}</p>
          <p className="mt-1 text-sm text-slate-500">
            {t("Choose one above to see its onboarding progress, or onboard a new one.")}
          </p>
        </div>
      )}
    </section>
  );
}

function OnboardingStatusCard({ societyId }: { societyId: number }) {
  const t = useT();
  const { data, isLoading, error, refetch } = useGetOnboardingStatusQuery(societyId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-24 animate-pulse bg-slate-50" />
        ))}
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="card p-6 space-y-3">
        <p className="alert-error">{errorMessage(error, t("Failed to load onboarding status."))}</p>
        <button type="button" onClick={() => refetch()} className="btn-secondary">
          {t("Try again")}
        </button>
      </div>
    );
  }

  const steps = [
    {
      done: data.steps.wingsCreated,
      title: "Create wings",
      detail: t("{count} wings", { count: data.wings }),
      href: "/portal/wing",
      action: "Open Wings → Add wing",
    },
    {
      done: data.steps.structureImported,
      title: "Add units",
      detail: t("{count} units", { count: data.units }),
      href: "/portal/unit",
      action: "Open Units → Import Excel",
    },
    {
      done: data.steps.residentsImported,
      title: "Import owners, tenants & family",
      detail: t("{occupied} occupied · {vacant} vacant · {people} people", {
        occupied: data.occupiedUnits,
        vacant: data.vacantUnits,
        people: data.familyMembers,
      }),
      href: "/portal/unit-membership",
      action: "Open Unit Memberships → Import Excel",
    },
    {
      done: data.steps.staffAdded,
      title: "Add committee & staff",
      detail: t("{count} added · President, Secretary, Treasurer…", { count: data.staff }),
      href: "/portal/staff",
      action: "Open Committee & Staff → Add",
    },
    {
      done: data.steps.loginsActivated,
      title: "Residents sign in",
      detail: t("{signedIn} of {total} people have signed in", { signedIn: data.activatedUsers, total: data.users }),
      href: null,
      action: "Share the portal link; residents sign in with their registered email.",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {[
          ["Units", data.units, t("{count} wings", { count: data.wings })],
          ["Occupied", data.occupiedUnits, t("{count} vacant", { count: data.vacantUnits })],
          ["People", data.familyMembers, t("owners, tenants & family")],
          ["Signed in", data.activatedUsers, t("of {count} users", { count: data.users })],
        ].map(([label, value, sub]) => (
          <article key={String(label)} className="card p-5">
            <p className="text-sm text-slate-500">{t(String(label))}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          </article>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <p className="section-title">{t("Setup checklist")}</p>
            <p className="text-sm text-slate-500">{data.society.name}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {t("{done} of {total} done", { done: doneCount, total: steps.length })}
            <span className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${(doneCount / steps.length) * 100}%` }}
              />
            </span>
          </div>
        </div>
        <ol className="divide-y divide-slate-100">
          {steps.map((step, i) => (
            <li key={step.title} className="flex items-start gap-4 p-5">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                  step.done ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-500"
                }`}
              >
                {step.done ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${step.done ? "text-slate-500" : "text-slate-900"}`}>{t(step.title)}</p>
                <p className="text-sm text-slate-500">{step.detail}</p>
              </div>
              {!step.done ? (
                step.href ? (
                  <Link href={step.href} className="btn-secondary btn-sm whitespace-nowrap">
                    {t(step.action.split(" → ")[0])}
                  </Link>
                ) : (
                  <p className="max-w-xs text-xs text-slate-500">{t(step.action)}</p>
                )
              ) : (
                <span className="badge bg-brand-50 text-brand-700">{t("Done")}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
