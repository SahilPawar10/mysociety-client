"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  useGetLedgerQuery,
  useGetLedgerSummaryQuery,
  useGetOnboardingStatusQuery,
  useGetPlatformStatsQuery,
  useGetResourceListQuery,
  type OnboardingStatus,
} from "@/lib/features/portal/portalApi";
import { useAppSelector } from "@/lib/hooks";
import { errorMessage } from "@/lib/api";
import { useT } from "@/lib/i18n";

const today = () => new Date().toLocaleDateString("en-CA");
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toLocaleDateString("en-CA");
const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const num = (n: number) => n.toLocaleString("en-IN");
const shortDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
/** Financial year (Apr–Mar) containing today. */
const currentFy = () => {
  const [y, m] = today().split("-").map(Number);
  const start = m >= 4 ? y : y - 1;
  return { from: `${start}-04-01`, to: `${start + 1}-03-31`, years: `${start}-${String(start + 1).slice(2)}` };
};

const ICONS: Record<string, ReactNode> = {
  wings: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  units: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  members: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  wallet: <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
  society: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  active: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></>,
  in: <><line x1="17" y1="7" x2="7" y2="17" /><polyline points="17 17 7 17 7 7" /></>,
  out: <><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></>,
};

function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {ICONS[name]}
    </svg>
  );
}

const TONES = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
};

function StatCard(props: { icon: string; tone: keyof typeof TONES; label: string; value: ReactNode; sub?: ReactNode; href?: string; cta?: string }) {
  const t = useT();
  return (
    <article className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{t(props.label)}</p>
          <p className="mt-2 truncate text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{props.value}</p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${TONES[props.tone]}`}>
          <Icon name={props.icon} />
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-slate-500">{props.sub}</span>
        {props.href ? (
          <Link href={props.href} className="link whitespace-nowrap after:absolute after:inset-0">
            {t(props.cta ?? "View all")} →
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function Panel({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  const t = useT();
  return (
    <div className={`card flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <p className="section-title">{t(title)}</p>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const Skeleton = ({ className }: { className: string }) => <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;

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
          <p className="page-subtitle">
            {isSuperAdmin ? t("Everything across the platform, at a glance.") : t("Here's what's happening in your society.")}
          </p>
        </div>
        {isSuperAdmin ? (
          <Link href="/portal/onboard-society" className="btn-primary whitespace-nowrap">
            {t("+ Onboard society")}
          </Link>
        ) : null}
      </div>

      {isSuperAdmin ? <PlatformOverview selectedId={selectedSocietyId} onPick={setSelectedSocietyId} /> : null}

      {isSuperAdmin ? (
        <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
          <div>
            <p className="section-title">{t("Society dashboard")}</p>
            <p className="text-sm text-slate-500">{t("Pick a society to see its numbers and setup progress.")}</p>
          </div>
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
        </div>
      ) : null}

      {societyId ? <SocietyDashboard societyId={societyId} /> : null}
    </section>
  );
}

function PlatformOverview({ selectedId, onPick }: { selectedId: string; onPick: (id: string) => void }) {
  const t = useT();
  const { data, isLoading, error, refetch } = useGetPlatformStatsQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="card p-6 space-y-3">
        <p className="alert-error">{errorMessage(error, t("Failed to load platform stats."))}</p>
        <button type="button" onClick={() => refetch()} className="btn-secondary">{t("Try again")}</button>
      </div>
    );
  }

  const { totals } = data;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard icon="society" tone="brand" label="Total societies" value={num(totals.societies)} sub={t("onboarded on the platform")} />
        <StatCard
          icon="units"
          tone="sky"
          label="Total units"
          value={num(totals.units)}
          sub={t("{pct}% occupied", { pct: pct(totals.occupiedUnits, totals.units) })}
        />
        <StatCard icon="members" tone="violet" label="Total members" value={num(totals.members)} sub={t("owners, tenants & family")} />
        <StatCard
          icon="active"
          tone="amber"
          label="Active users"
          value={num(totals.activeUsers)}
          sub={t("{pct}% of {count} users signed in", { pct: pct(totals.activeUsers, totals.users), count: num(totals.users) })}
        />
      </div>

      <Panel title="Societies" action={<span className="text-xs text-slate-500">{t("{count} total", { count: totals.societies })}</span>}>
        {data.societies.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">{t("Society")}</th>
                  <th className="px-5 py-3 font-medium text-right">{t("Units")}</th>
                  <th className="px-5 py-3 font-medium">{t("Occupancy")}</th>
                  <th className="px-5 py-3 font-medium text-right">{t("Members")}</th>
                  <th className="px-5 py-3 font-medium text-right">{t("Active users")}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.societies.map((s) => {
                  const occ = pct(s.occupiedUnits, s.units);
                  const selected = selectedId === String(s.id);
                  return (
                    <tr key={s.id} className={selected ? "bg-brand-50/60" : "hover:bg-slate-50"}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{s.name}</p>
                        {s.city ? <p className="text-xs text-slate-500">{s.city}</p> : null}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{num(s.units)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                            <span className="block h-full rounded-full bg-brand-500" style={{ width: `${occ}%` }} />
                          </span>
                          <span className="text-xs tabular-nums text-slate-500">{occ}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{num(s.members)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {num(s.activeUsers)} <span className="text-xs text-slate-400">/ {num(s.users)}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button type="button" onClick={() => onPick(String(s.id))} className="btn-secondary btn-sm" disabled={selected}>
                          {selected ? t("Viewing") : t("View")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-slate-500">{t("No societies yet. Onboard the first one.")}</p>
        )}
      </Panel>
    </div>
  );
}

function SocietyDashboard({ societyId }: { societyId: number }) {
  const t = useT();
  const { data, isLoading, error, refetch } = useGetOnboardingStatusQuery(societyId);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
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

  const { wingsCreated, structureImported, residentsImported, staffAdded } = data.steps;
  // The society is "live" once its structure, residents and committee are in; the rest is optional polish.
  return wingsCreated && structureImported && residentsImported && staffAdded ? (
    <SocietyOverview societyId={societyId} data={data} />
  ) : (
    <OnboardingChecklist data={data} />
  );
}

function SocietyOverview({ societyId, data }: { societyId: number; data: OnboardingStatus }) {
  const t = useT();
  const fy = currentFy();
  const { data: allTime } = useGetLedgerSummaryQuery({ societyId, from: "2000-01-01", to: today() });
  const { data: year } = useGetLedgerSummaryQuery({ societyId, from: fy.from, to: fy.to });

  const pending = [
    !data.steps.loginsActivated && { text: "Residents haven't signed in yet. Share the portal link.", href: null },
    !data.steps.previousDataMigrated && { text: "Add last year's closing balance to get an accurate balance.", href: "/portal/migration" },
  ].filter(Boolean) as { text: string; href: string | null }[];

  return (
    <div className="space-y-6">
      {pending.map((p) => (
        <div key={p.text} className="alert-warn flex items-center justify-between gap-3">
          <span>{t(p.text)}</span>
          {p.href ? <Link href={p.href} className="link whitespace-nowrap">{t("Open")} →</Link> : null}
        </div>
      ))}

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard icon="wings" tone="brand" label="Wings" value={num(data.wings)} sub={data.society.name} href="/portal/wing" />
        <StatCard
          icon="units"
          tone="sky"
          label="Units"
          value={num(data.units)}
          sub={t("{count} occupied", { count: num(data.occupiedUnits) })}
          href="/portal/unit"
        />
        <StatCard
          icon="members"
          tone="violet"
          label="Members"
          value={num(data.familyMembers)}
          sub={t("{count} signed in", { count: num(data.activatedUsers) })}
          href="/portal/unit-membership"
        />
        <StatCard
          icon="wallet"
          tone={allTime && allTime.net < 0 ? "rose" : "amber"}
          label="Total balance"
          value={allTime ? money(allTime.net) : "—"}
          sub={t("all credits minus debits")}
          href="/portal/accounts"
          cta="View details"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <OccupancyPanel data={data} />
        <Panel
          title="This year"
          action={<span className="badge bg-slate-100 text-slate-600">{t("FY {years}", { years: fy.years })}</span>}
          className="lg:col-span-2"
        >
          {year ? (
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              {[
                { label: "Income", value: year.credits.total, icon: "in", tone: "text-emerald-700 bg-emerald-50" },
                { label: "Expenses", value: year.debits.total, icon: "out", tone: "text-rose-700 bg-rose-50" },
                { label: year.net >= 0 ? "Surplus" : "Deficit", value: Math.abs(year.net), icon: "wallet", tone: "text-brand-700 bg-brand-50" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className={`grid h-7 w-7 place-items-center rounded-lg ${m.tone}`}>
                      <Icon name={m.icon} className="h-4 w-4" />
                    </span>
                    {t(m.label)}
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{money(m.value)}</p>
                </div>
              ))}
              <IncomeExpenseBar income={year.credits.total} expense={year.debits.total} />
            </div>
          ) : (
            <div className="p-5"><Skeleton className="h-28" /></div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTransactions societyId={societyId} />
        <RecentMembers societyId={societyId} />
      </div>
    </div>
  );
}

function IncomeExpenseBar({ income, expense }: { income: number; expense: number }) {
  const t = useT();
  const total = income + expense;
  return (
    <div className="sm:col-span-3">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
        <span className="bg-emerald-500" style={{ width: `${pct(income, total)}%` }} />
        <span className="bg-rose-400" style={{ width: `${pct(expense, total)}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {total
          ? t("Expenses are {pct}% of income this year.", { pct: pct(expense, income || 1) })
          : t("No entries this year yet.")}
      </p>
    </div>
  );
}

function OccupancyPanel({ data }: { data: OnboardingStatus }) {
  const t = useT();
  const occ = pct(data.occupiedUnits, data.units);
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <Panel title="Unit occupancy" action={<Link href="/portal/unit" className="link text-xs">{t("View units")} →</Link>}>
      <div className="flex items-center gap-6 p-5">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" strokeWidth="12" className="stroke-brand-100" />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(occ / 100) * c} ${c}`}
              className="stroke-brand-600 transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <p className="text-3xl font-semibold tracking-tight text-slate-900">{occ}%</p>
            <p className="text-xs text-slate-500">{t("Occupied")}</p>
          </div>
        </div>
        <ul className="flex-1 space-y-3 text-sm">
          {[
            { label: "Occupied", value: data.occupiedUnits, dot: "bg-brand-600" },
            { label: "Vacant", value: data.vacantUnits, dot: "bg-brand-100" },
          ].map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-slate-600">
                <span className={`h-2.5 w-2.5 rounded-full ${row.dot}`} />
                {t(row.label)}
              </span>
              <span className="font-semibold tabular-nums text-slate-900">{num(row.value)}</span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <span className="text-slate-600">{t("Total")}</span>
            <span className="font-semibold tabular-nums text-slate-900">{num(data.units)}</span>
          </li>
        </ul>
      </div>
    </Panel>
  );
}

function RecentTransactions({ societyId }: { societyId: number }) {
  const t = useT();
  // ponytail: last 90 days only, so the dashboard never pulls a whole year of per-flat maintenance lines.
  const range = { societyId, from: daysAgo(90), to: today() };
  const credits = useGetLedgerQuery({ ...range, side: "credits" });
  const debits = useGetLedgerQuery({ ...range, side: "debits" });

  const rows = [
    ...(credits.data ?? []).map((e) => ({ ...e, credit: true })),
    ...(debits.data ?? []).map((e) => ({ ...e, credit: false })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <Panel title="Recent transactions" action={<Link href="/portal/accounts" className="link text-xs">{t("View all")} →</Link>}>
      {credits.isLoading || debits.isLoading ? (
        <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : rows.length ? (
        <ul className="divide-y divide-slate-100">
          {rows.map((e, i) => (
            <li key={`${e.source}-${e.id ?? i}-${e.date}-${i}`} className="flex items-center gap-3 px-5 py-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                  e.credit ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                <Icon name={e.credit ? "in" : "out"} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{e.title || e.category}</p>
                <p className="truncate text-xs text-slate-500">
                  {shortDate(e.date)} · {e.unit ? `${e.unit} · ` : ""}{e.category}
                </p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${e.credit ? "text-emerald-700" : "text-rose-600"}`}>
                {e.credit ? "+" : "−"}{money(e.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-8 text-center text-sm text-slate-500">{t("No transactions in the last 90 days.")}</p>
      )}
    </Panel>
  );
}

const AVATAR_TONES = ["bg-brand-100 text-brand-800", "bg-sky-100 text-sky-800", "bg-violet-100 text-violet-800", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-800"];

function RecentMembers({ societyId }: { societyId: number }) {
  const t = useT();
  const { data = [], isLoading } = useGetResourceListQuery({ resource: "unit-membership", societyId });
  // No createdAt on the list; the newest memberships have the highest ids.
  const rows = data
    .filter((m) => m.isActive)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 6);

  return (
    <Panel title="Recent members" action={<Link href="/portal/unit-membership" className="link text-xs">{t("View all")} →</Link>}>
      {isLoading ? (
        <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : rows.length ? (
        <ul className="divide-y divide-slate-100">
          {rows.map((m) => {
            const name = String(m.userName ?? "—");
            const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            const owner = m.type === "OWNER";
            return (
              <li key={String(m.id)} className="flex items-center gap-3 px-5 py-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${AVATAR_TONES[Number(m.id) % AVATAR_TONES.length]}`}>
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[m.wingName, m.roomNo].filter(Boolean).join(" - ") || "—"}
                    {m.startDate ? ` · ${t("since {date}", { date: shortDate(String(m.startDate)) })}` : ""}
                  </p>
                </div>
                <span className={`badge ${owner ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700"}`}>
                  {t(owner ? "Owner" : "Tenant")}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="p-8 text-center text-sm text-slate-500">{t("No members yet.")}</p>
      )}
    </Panel>
  );
}

function OnboardingChecklist({ data }: { data: OnboardingStatus }) {
  const t = useT();
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
      detail: t("{saved} of {total} units added", { saved: data.savedUnits, total: data.units }),
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
    {
      done: data.steps.previousDataMigrated,
      title: "Migrate previous data",
      detail: t("Last year's closing balance, past maintenance, credits & debits"),
      href: "/portal/migration",
      action: "Open Previous Data → Import",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard icon="wings" tone="brand" label="Wings" value={num(data.wings)} sub={t("{count} units", { count: data.units })} />
        <StatCard icon="units" tone="sky" label="Occupied" value={num(data.occupiedUnits)} sub={t("{count} vacant", { count: data.vacantUnits })} />
        <StatCard icon="members" tone="violet" label="People" value={num(data.familyMembers)} sub={t("owners, tenants & family")} />
        <StatCard icon="active" tone="amber" label="Signed in" value={num(data.activatedUsers)} sub={t("of {count} users", { count: data.users })} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <p className="section-title">{t("Setup checklist")}</p>
            <p className="text-sm text-slate-500">
              {data.society.name} · {t("Finish the first 4 steps to unlock the full dashboard.")}
            </p>
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
