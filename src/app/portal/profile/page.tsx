"use client";

import { useAppSelector } from "@/lib/hooks";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  SOCIETY_ADMIN: "Society admin",
  MEMBER: "Resident",
};

export default function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const name = user?.name || "User";

  const rows: [string, string][] = [
    ["Mobile", user?.phone ? `+91 ${user.phone}` : "—"],
    ["Email", user?.email ?? "—"],
    ["Role", ROLE_LABEL[user?.role ?? ""] ?? "—"],
    ["Society ID", user?.societyId ? String(user.societyId) : "—"],
  ];

  return (
    <section className="space-y-6 max-w-2xl">
      <h2 className="page-title">Profile</h2>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-slate-100 p-6">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-semibold text-brand-800">
            {name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-900">{name}</p>
            <p className="text-sm text-slate-500">{ROLE_LABEL[user?.role ?? ""] ?? ""}</p>
          </div>
        </div>
        <dl className="divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-3 gap-4 px-6 py-3.5 text-sm">
              <dt className="text-slate-500">{label}</dt>
              <dd className="col-span-2 text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="hint">
        To change your mobile or email, ask your society admin: you sign in with these details.
      </p>
    </section>
  );
}
