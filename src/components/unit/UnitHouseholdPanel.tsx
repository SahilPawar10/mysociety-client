"use client";

import { useState } from "react";
import {
  useCreateResourceMutation,
  useCreateUnitMembershipMutation,
  useEndMembershipMutation,
  useGetUnitMembershipHistoryQuery,
  useRenewTenancyMutation,
  useReplaceHouseholdMutation,
  type ResourceRecord,
} from "@/lib/features/portal/portalApi";
import { errorMessage } from "@/lib/api";

type Props = { societyId: number; unitId: number };

type Membership = ResourceRecord & {
  id: number;
  type: "OWNER" | "TENANT";
  userName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  expired?: boolean;
  daysLeft?: number | null;
};

type Mode =
  | { kind: "overview" }
  | { kind: "history" }
  | { kind: "person"; type: "OWNER" | "TENANT"; replace: boolean }
  | { kind: "renew"; membership: Membership }
  | { kind: "end"; membership: Membership }
  | { kind: "family" };

const today = () => new Date().toLocaleDateString("en-CA");
const fmt = (date?: string | null) =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
// Most Indian rental agreements run 11 months.
const plusMonths = (date: string, months: number) => {
  const d = new Date(`${date}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
};
const fullName = (m: ResourceRecord) =>
  [m.firstName, m.middleName, m.lastName].filter(Boolean).join(" ") || String(m.userName ?? "—");

function tenancyStatus(t: Membership) {
  if (t.expired) {
    return { label: "Agreement expired", className: "bg-red-50 text-red-700" };
  }
  if (t.daysLeft !== null && t.daysLeft !== undefined && t.daysLeft <= 30) {
    return { label: `Ends in ${t.daysLeft} days`, className: "bg-amber-50 text-amber-700" };
  }
  return { label: "Active", className: "bg-brand-50 text-brand-700" };
}

/**
 * Who owns and who lives in a unit, and every change to that:
 * add owner/tenant, transfer ownership, renew / end / replace a tenancy, add family, history.
 */
export default function UnitHouseholdPanel({ societyId, unitId }: Props) {
  const { data, isLoading, error } = useGetUnitMembershipHistoryQuery({ societyId, unitId });
  const [mode, setMode] = useState<Mode>({ kind: "overview" });
  const [notice, setNotice] = useState("");

  if (isLoading) {
    return <div className="h-40 rounded-xl bg-slate-50 animate-pulse" />;
  }
  if (error) {
    return <p className="alert-error">{errorMessage(error, "Could not load residents.")}</p>;
  }

  const owner = (data?.currentOwner as Membership | null) ?? null;
  const tenant = (data?.currentTenant as Membership | null) ?? null;
  const residents = data?.currentFamilyMembers ?? [];
  const residentMembershipId = data?.currentResidentMembershipId ?? null;
  const done = (message: string) => {
    setNotice(message);
    setMode({ kind: "overview" });
  };
  const back = () => setMode({ kind: "overview" });

  if (mode.kind === "person") {
    return <PersonForm societyId={societyId} unitId={unitId} mode={mode} onDone={done} onCancel={back} />;
  }
  if (mode.kind === "renew" || mode.kind === "end") {
    return <DateForm societyId={societyId} mode={mode} onDone={done} onCancel={back} />;
  }
  if (mode.kind === "family" && residentMembershipId) {
    return (
      <FamilyForm
        societyId={societyId}
        membershipId={residentMembershipId}
        onDone={done}
        onCancel={back}
      />
    );
  }
  if (mode.kind === "history") {
    return <History data={data} onBack={back} />;
  }

  const occupancy = tenant ? "Rented out" : owner ? "Owner-occupied" : "Vacant";

  return (
    <div className="space-y-4">
      {notice ? <p className="alert-success">{notice}</p> : null}

      <div className="flex items-center justify-between">
        <span className={`badge ${tenant ? "bg-sky-50 text-sky-700" : owner ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"}`}>
          {occupancy}
        </span>
        <button type="button" onClick={() => setMode({ kind: "history" })} className="link text-sm">
          View history
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Owner */}
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Owner</p>
          {owner ? (
            <>
              <p className="mt-1 font-semibold text-slate-900">{owner.userName ?? "—"}</p>
              <p className="text-sm text-slate-500">
                Since {fmt(owner.startDate)}
                {tenant ? " · not living here (rented out)" : ""}
              </p>
              <button
                type="button"
                onClick={() => setMode({ kind: "person", type: "OWNER", replace: true })}
                className="btn-secondary btn-sm mt-3"
              >
                Transfer ownership
              </button>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-500">No owner recorded.</p>
              <button
                type="button"
                onClick={() => setMode({ kind: "person", type: "OWNER", replace: false })}
                className="btn-primary btn-sm mt-3"
              >
                Add owner
              </button>
            </>
          )}
        </div>

        {/* Tenant */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tenant</p>
            {tenant ? <span className={`badge ${tenancyStatus(tenant).className}`}>{tenancyStatus(tenant).label}</span> : null}
          </div>
          {tenant ? (
            <>
              <p className="mt-1 font-semibold text-slate-900">{tenant.userName ?? "—"}</p>
              <p className="text-sm text-slate-500">
                {fmt(tenant.startDate)} → {fmt(tenant.endDate)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setMode({ kind: "renew", membership: tenant })} className="btn-secondary btn-sm">
                  Renew
                </button>
                <button
                  type="button"
                  onClick={() => setMode({ kind: "person", type: "TENANT", replace: true })}
                  className="btn-secondary btn-sm"
                >
                  New tenant
                </button>
                <button type="button" onClick={() => setMode({ kind: "end", membership: tenant })} className="btn-danger btn-sm">
                  End tenancy
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-500">Not rented out.</p>
              <button
                type="button"
                onClick={() => setMode({ kind: "person", type: "TENANT", replace: false })}
                className="btn-secondary btn-sm mt-3"
              >
                Add tenant
              </button>
            </>
          )}
        </div>
      </div>

      {/* Residents */}
      <div className="rounded-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="section-title">Living here</p>
            <p className="text-xs text-slate-500">
              {data?.currentResidentType === "TENANT"
                ? "Tenant's household"
                : data?.currentResidentType === "OWNER"
                  ? "Owner's household"
                  : "Nobody yet"}
            </p>
          </div>
          {residentMembershipId ? (
            <button type="button" onClick={() => setMode({ kind: "family" })} className="btn-secondary btn-sm">
              + Family member
            </button>
          ) : null}
        </div>
        {residents.length ? (
          <ul className="divide-y divide-slate-100">
            {residents.map((member) => (
              <li key={String(member.id)} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="font-medium text-slate-800">{fullName(member)}</span>
                <span className="text-slate-500">
                  {String(member.relation ?? "—")}
                  {member.phone ? ` · ${String(member.phone)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-slate-500">No residents recorded.</p>
        )}
      </div>
    </div>
  );
}

function FormShell({
  title,
  hint,
  error,
  busy,
  submitLabel,
  onSubmit,
  onCancel,
  children,
}: {
  title: string;
  hint?: string;
  error: string;
  busy: boolean;
  submitLabel: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h4 className="section-title">{title}</h4>
        {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
      {error ? <p className="alert-error">{error}</p> : null}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function PersonForm({
  societyId,
  unitId,
  mode,
  onDone,
  onCancel,
}: {
  societyId: number;
  unitId: number;
  mode: { type: "OWNER" | "TENANT"; replace: boolean };
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const isTenant = mode.type === "TENANT";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(plusMonths(today(), 11));
  const [error, setError] = useState("");
  const [create, { isLoading: creating }] = useCreateUnitMembershipMutation();
  const [replace, { isLoading: replacing }] = useReplaceHouseholdMutation();

  const title = mode.replace
    ? isTenant
      ? "New tenant (ends the current tenancy)"
      : "Transfer ownership"
    : isTenant
      ? "Add tenant"
      : "Add owner";
  const hint = mode.replace
    ? isTenant
      ? "The current tenant's tenancy ends on the move-in date below and moves to history."
      : "The current owner's ownership ends on the transfer date and moves to history; their family leaves with them."
    : isTenant
      ? "A tenancy is an agreement with a start and an end date. Renew it before it ends."
      : undefined;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!phone.trim() && !email.trim()) {
      setError("Add a mobile number or email: the person logs in with it.");
      return;
    }
    const body = {
      societyId,
      unitId,
      type: mode.type,
      startDate: from,
      endDate: isTenant ? to : null,
      isPrimary: true,
      user: { name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined },
    };
    try {
      if (mode.replace) {
        await replace({ ...body, effectiveDate: from }).unwrap();
        onDone(isTenant ? "New tenant added; previous tenancy moved to history." : "Ownership transferred.");
      } else {
        await create(body).unwrap();
        onDone(isTenant ? "Tenant added." : "Owner added.");
      }
    } catch (err) {
      setError(errorMessage(err, "Could not save."));
    }
  };

  return (
    <FormShell
      title={title}
      hint={hint}
      error={error}
      busy={creating || replacing}
      submitLabel={mode.replace ? (isTenant ? "Start new tenancy" : "Transfer") : "Save"}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <div className="md:col-span-2">
        <label className="label">{isTenant ? "Tenant name" : mode.replace ? "New owner name" : "Owner name"}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
      </div>
      <div>
        <label className="label">Mobile</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className="input" />
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
      </div>
      <div>
        <label className="label">
          {mode.replace ? (isTenant ? "Moves in on" : "Transfer date") : isTenant ? "Agreement from" : "Owner since"}
        </label>
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            if (isTenant && e.target.value) {
              setTo(plusMonths(e.target.value, 11));
            }
          }}
          required
          className="input"
        />
      </div>
      {isTenant ? (
        <div>
          <label className="label">Agreement to</label>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} required className="input" />
          <p className="hint">Defaults to an 11-month agreement.</p>
        </div>
      ) : null}
    </FormShell>
  );
}

function DateForm({
  societyId,
  mode,
  onDone,
  onCancel,
}: {
  societyId: number;
  mode: { kind: "renew" | "end"; membership: Membership };
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const isRenew = mode.kind === "renew";
  const currentEnd = mode.membership.endDate ?? today();
  const [date, setDate] = useState(isRenew ? plusMonths(currentEnd > today() ? currentEnd : today(), 11) : today());
  const [error, setError] = useState("");
  const [renew, { isLoading: renewing }] = useRenewTenancyMutation();
  const [end, { isLoading: ending }] = useEndMembershipMutation();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      if (isRenew) {
        await renew({ id: mode.membership.id, societyId, endDate: date }).unwrap();
        onDone(`Tenancy renewed until ${fmt(date)}.`);
      } else {
        await end({ id: mode.membership.id, societyId, endDate: date }).unwrap();
        onDone("Tenancy ended and moved to history.");
      }
    } catch (err) {
      setError(errorMessage(err, "Could not save."));
    }
  };

  return (
    <FormShell
      title={isRenew ? `Renew tenancy · ${mode.membership.userName ?? ""}` : `End tenancy · ${mode.membership.userName ?? ""}`}
      hint={
        isRenew
          ? `Current agreement ends on ${fmt(mode.membership.endDate)}. Pick the new end date.`
          : "The tenant and their family move to the unit's history and lose portal access (unless they live in another unit)."
      }
      error={error}
      busy={renewing || ending}
      submitLabel={isRenew ? "Renew" : "End tenancy"}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <div>
        <label className="label">{isRenew ? "New agreement end date" : "Move-out date"}</label>
        <input
          type="date"
          value={date}
          min={isRenew ? (mode.membership.endDate ?? undefined) : (mode.membership.startDate ?? undefined)}
          onChange={(e) => setDate(e.target.value)}
          required
          className="input"
        />
      </div>
    </FormShell>
  );
}

function FamilyForm({
  societyId,
  membershipId,
  onDone,
  onCancel,
}: {
  societyId: number;
  membershipId: number;
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ firstName: "", lastName: "", relation: "", phone: "", age: "", gender: "" });
  const [error, setError] = useState("");
  const [create, { isLoading }] = useCreateResourceMutation();
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await create({
        resource: "family-member",
        payload: {
          societyId,
          unitMembershipId: membershipId,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          relation: form.relation.trim(),
          phone: form.phone.trim() || undefined,
          age: form.age ? Number(form.age) : undefined,
          gender: form.gender || undefined,
          isActive: true,
        },
      }).unwrap();
      onDone(`${form.firstName.trim()} added to the household.`);
    } catch (err) {
      setError(errorMessage(err, "Could not add family member."));
    }
  };

  return (
    <FormShell
      title="Add family member"
      hint="Added to the household currently living here."
      error={error}
      busy={isLoading}
      submitLabel="Add"
      onSubmit={submit}
      onCancel={onCancel}
    >
      <div>
        <label className="label">First name</label>
        <input value={form.firstName} onChange={set("firstName")} required className="input" />
      </div>
      <div>
        <label className="label">Last name</label>
        <input value={form.lastName} onChange={set("lastName")} required className="input" />
      </div>
      <div>
        <label className="label">Relation</label>
        <input value={form.relation} onChange={set("relation")} required list="relations" className="input" placeholder="e.g. Spouse" />
        <datalist id="relations">
          {["Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Other"].map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="label">Mobile</label>
        <input type="tel" value={form.phone} onChange={set("phone")} className="input" />
        <p className="hint">With a mobile they can log in too.</p>
      </div>
      <div>
        <label className="label">Age</label>
        <input type="number" min="0" value={form.age} onChange={set("age")} className="input" />
      </div>
      <div>
        <label className="label">Gender</label>
        <select value={form.gender} onChange={set("gender")} className="input">
          <option value="">—</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
    </FormShell>
  );
}

function History({
  data,
  onBack,
}: {
  data: { allMemberships?: ResourceRecord[]; previousFamilyMembers?: ResourceRecord[] } | undefined;
  onBack: () => void;
}) {
  const memberships = (data?.allMemberships ?? []) as Membership[];
  const formerFamily = data?.previousFamilyMembers ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="section-title">Ownership & tenancy history</h4>
        <button type="button" onClick={onBack} className="btn-secondary btn-sm">
          Back
        </button>
      </div>

      {memberships.length ? (
        <ol className="relative space-y-3 border-l border-slate-200 pl-5">
          {memberships.map((m) => (
            <li key={m.id} className="relative">
              <span
                className={`absolute -left-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                  m.isActive ? "bg-brand-500" : "bg-slate-300"
                }`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${m.type === "OWNER" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700"}`}>
                  {m.type === "OWNER" ? "Owner" : "Tenant"}
                </span>
                <span className="font-medium text-slate-800">{m.userName ?? "—"}</span>
                {m.isActive ? <span className="badge">Current</span> : null}
              </div>
              <p className="text-sm text-slate-500">
                {fmt(m.startDate)} → {m.isActive && m.type === "OWNER" ? "present" : fmt(m.endDate)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-slate-500">No owners or tenants recorded yet.</p>
      )}

      {formerFamily.length ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">Former residents</p>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
            {formerFamily.map((member) => (
              <li key={String(member.id)} className="flex justify-between px-4 py-2">
                <span>{fullName(member)}</span>
                <span className="text-slate-500">{String(member.relation ?? "—")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
