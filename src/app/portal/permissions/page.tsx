"use client";

import { useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { errorMessage } from "@/lib/api";
import { useT } from "@/lib/i18n";
import {
  useGetResourceListQuery,
  useUpdateResourceMutation,
} from "@/lib/features/portal/portalApi";
import { RESOURCE_CONFIG_MAP } from "@/lib/features/portal/resourceConfig";
import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  type PermissionAction,
  type Permissions,
} from "@/lib/permissions";

const ACTION_LABEL: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

/** Society admin decides, per member, which tabs they see and what they can do there. */
export default function PermissionsPage() {
  const t = useT();
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [selectedSocietyId, setSelectedSocietyId] = useState("");
  const societyId = isSuperAdmin ? Number(selectedSocietyId) : Number(user?.societyId);

  const { data: societies = [] } = useGetResourceListQuery({ resource: "society" }, { skip: !isSuperAdmin });
  const { data: users = [], isLoading } = useGetResourceListQuery(
    { resource: "user", societyId },
    { skip: !societyId },
  );
  // Admins always have every right, so only members are listed.
  const members = users.filter((u) => u.role === "MEMBER");

  const [memberId, setMemberId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Permissions>({});
  const [feedback, setFeedback] = useState("");
  const [updateUser, { isLoading: isSaving }] = useUpdateResourceMutation();

  const pickMember = (id: number) => {
    const member = members.find((m) => Number(m.id) === id);
    setMemberId(id);
    setDraft(structuredClone((member?.permissions as Permissions) ?? {}));
    setFeedback("");
  };

  // A tab can't be used without seeing it: any action turns "view" on, removing "view" clears the tab.
  const toggle = (module: string, action: PermissionAction) => {
    setDraft((prev) => {
      const current = new Set(prev[module] ?? []);
      if (current.has(action)) {
        if (action === "view") {
          current.clear();
        } else {
          current.delete(action);
        }
      } else {
        current.add(action).add("view");
      }
      return { ...prev, [module]: PERMISSION_ACTIONS.filter((a) => current.has(a)) };
    });
  };

  const save = async () => {
    if (memberId === null) {
      return;
    }
    try {
      await updateUser({
        resource: "user",
        id: memberId,
        payload: { permissions: draft },
        societyId: isSuperAdmin ? societyId : undefined,
      }).unwrap();
      setFeedback(t("Permissions saved. The member sees them on their next sign-in."));
    } catch (error) {
      setFeedback(errorMessage(error, t("Couldn't save permissions.")));
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="page-title">{t("Roles & permissions")}</h2>
        <p className="page-subtitle">
          {t("Choose which tabs each member sees and what they can do there. Admins always have full access.")}
        </p>
      </div>

      {isSuperAdmin ? (
        <select
          value={selectedSocietyId}
          onChange={(e) => {
            setSelectedSocietyId(e.target.value);
            setMemberId(null);
          }}
          className="input max-w-xs"
          aria-label={t("Society")}
        >
          <option value="">{t("Select a society")}</option>
          {societies.map((s) => (
            <option key={String(s.id)} value={String(s.id)}>
              {String(s.name)}
            </option>
          ))}
        </select>
      ) : null}

      {!societyId ? null : isLoading ? (
        <div className="card h-40 animate-pulse bg-slate-50" />
      ) : (
        <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
          <div className="card p-2 max-h-[70vh] overflow-y-auto">
            {members.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">{t("No members yet.")}</p>
            ) : (
              members.map((m) => (
                <button
                  key={String(m.id)}
                  type="button"
                  onClick={() => pickMember(Number(m.id))}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                    Number(m.id) === memberId
                      ? "bg-brand-50 text-brand-800 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {String(m.name ?? m.phone ?? m.email ?? m.id)}
                </button>
              ))
            )}
          </div>

          {memberId === null ? (
            <div className="card p-10 text-center">
              <p className="section-title">{t("Pick a member")}</p>
            </div>
          ) : (
            <div className="card w-full max-w-full overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("Tab")}</th>
                      {PERMISSION_ACTIONS.map((a) => (
                        <th key={a} className="text-center">
                          {t(ACTION_LABEL[a])}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_MODULES.map((module) => (
                      <tr key={module}>
                        <td>{t(RESOURCE_CONFIG_MAP[module]?.label ?? module)}</td>
                        {PERMISSION_ACTIONS.map((a) => (
                          <td key={a} className="text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(draft[module]?.includes(a))}
                              onChange={() => toggle(module, a)}
                              aria-label={`${t(RESOURCE_CONFIG_MAP[module]?.label ?? module)}: ${t(ACTION_LABEL[a])}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">
                {feedback ? <p className="mr-auto text-sm text-slate-600">{feedback}</p> : null}
                <button type="button" onClick={save} disabled={isSaving} className="btn-primary">
                  {isSaving ? t("Saving...") : t("Save changes")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
