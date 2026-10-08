"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  useCreateResourceMutation,
  useDeleteResourceMutation,
  useResetUserPasswordMutation,
  useGetResourceListQuery,
  useUpdateResourceMutation,
  type ResourceRecord,
} from "@/lib/features/portal/portalApi";
import {
  RESOURCE_CONFIG_MAP,
  type ResourceConfig,
  type ResourceField,
  type TableColumn,
} from "@/lib/features/portal/resourceConfig";
import { useAppSelector } from "@/lib/hooks";
import { can } from "@/lib/permissions";
import ImportExportActions from "@/components/importexport/page";
import { errorMessage } from "@/lib/api";
import { useT, type TFunction } from "@/lib/i18n";

type Props = {
  resource: string;
};

type FormState = Record<string, string | boolean>;
const noopSubscribe = () => () => {};
const RELATION_FIELD_TO_RESOURCE: Record<string, string> = {
  societyId: "society",
  wingId: "wing",
  unitId: "unit",
  unitMembershipId: "unit-membership",
  userId: "user",
  raisedByUserId: "user",
  createdBy: "user",
};

const getRelationOptionLabel = (
  relationResource: string,
  item: ResourceRecord,
  t: TFunction,
) => {
  if (relationResource === "society") {
    return String(item.name ?? item.city ?? t("Society"));
  }
  if (relationResource === "wing") {
    return String(item.name ?? t("Wing"));
  }
  if (relationResource === "unit") {
    return String(item.unitNumber ?? item.name ?? t("Unit"));
  }
  if (relationResource === "user") {
    return String(item.name ?? item.email ?? item.phone ?? t("User"));
  }
  if (relationResource === "unit-membership") {
    const unit = [item.wingName, item.roomNo].filter(Boolean).join(" - ");
    return `${String(item.userName ?? t("Resident"))}${unit ? ` · ${unit}` : ""}${item.type ? ` (${String(item.type)})` : ""}`;
  }
  return String(item.name ?? t("Record"));
};

const toInputValue = (
  value: unknown,
  type: ResourceField["type"],
): string | boolean => {
  if (type === "checkbox") {
    return Boolean(value);
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

const toPayloadValue = (
  value: string | boolean,
  type: ResourceField["type"],
) => {
  if (type === "checkbox") {
    return Boolean(value);
  }
  if (type === "number") {
    if (value === "") {
      return null;
    }
    return Number(value);
  }
  if (value === "") {
    return null;
  }
  return value;
};

export default function ResourceCrudClient({ resource }: Props) {
  const config: ResourceConfig | undefined = RESOURCE_CONFIG_MAP[resource];
  const t = useT();
  const user = useAppSelector((state) => state.auth.user);
  // false on the server and during hydration, true after: same as a mounted flag without a setState-in-effect.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const role = String(user?.role ?? "").toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isSocietyAdmin = role === "SOCIETY_ADMIN";
  const societyId = Number(user?.societyId);

  const [selectedSocietyId, setSelectedSocietyId] = useState<string>("");
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>({});
  const [feedback, setFeedback] = useState<string>("");
  const hasSocietyField = Boolean(
    config?.fields.some((field) => field.name === "societyId"),
  );
  const needsSocietySelector =
    isSuperAdmin && hasSocietyField && resource !== "society";
  // Everyone except SUPER_ADMIN works inside their own society (the backend enforces it too).
  const effectiveSocietyId =
    !isSuperAdmin && Number.isFinite(societyId)
      ? societyId
      : needsSocietySelector && selectedSocietyId
        ? Number(selectedSocietyId)
        : undefined;

  const isApiEnabled = Boolean(config?.apiRoute);
  const { data, isLoading, isError, refetch } = useGetResourceListQuery(
    {
      resource,
      societyId: effectiveSocietyId,
    },
    {
      skip: !isApiEnabled || (needsSocietySelector && !selectedSocietyId),
    },
  );
  const { data: societies } = useGetResourceListQuery(
    { resource: "society" },
    { skip: !needsSocietySelector },
  );

  const [createResource, { isLoading: isCreating }] =
    useCreateResourceMutation();
  const [updateResource, { isLoading: isUpdating }] =
    useUpdateResourceMutation();
  const [deleteResource, { isLoading: isDeleting }] =
    useDeleteResourceMutation();
  const [resetUserPassword] = useResetUserPasswordMutation();

  // Admins can do everything; members what the society admin granted on this tab.
  const canWrite = can(user, resource, "create");

  const canCreate = useMemo(() => {
    if (!canWrite) {
      return false;
    }
    if (needsSocietySelector && !selectedSocietyId) {
      return false;
    }
    if (isSocietyAdmin && resource === "society") {
      return false;
    }
    return true;
  }, [
    canWrite,
    isSocietyAdmin,
    needsSocietySelector,
    resource,
    selectedSocietyId,
  ]);

  const canEdit = can(user, resource, "edit");
  const canDelete = can(user, resource, "delete") && !(isSocietyAdmin && resource === "society");

  const visibleFields = useMemo(() => {
    if (!config) {
      return [];
    }

    return config.fields.filter((field) => {
      if (
        (isSocietyAdmin || needsSocietySelector) &&
        field.name === "societyId"
      ) {
        return false;
      }
      return true;
    });
  }, [config, isSocietyAdmin, needsSocietySelector]);

  const formFields =
    editingId !== null ? visibleFields.filter((field) => !field.createOnly) : visibleFields;

  const columnAndFieldNames = [
    ...visibleFields.map((field) => field.name),
    ...(config?.columns ?? []).map((column) => column.name),
  ];
  const needsWingOptions = columnAndFieldNames.includes("wingId");
  const needsUnitOptions = columnAndFieldNames.includes("unitId");
  const needsUnitMembershipOptions = columnAndFieldNames.includes("unitMembershipId");
  const needsUserOptions = visibleFields.some((field) =>
    ["userId", "raisedByUserId", "createdBy"].includes(field.name),
  );

  const { data: wingOptions } = useGetResourceListQuery(
    { resource: "wing", societyId: effectiveSocietyId },
    { skip: !needsWingOptions || !effectiveSocietyId },
  );
  const { data: unitOptions } = useGetResourceListQuery(
    { resource: "unit", societyId: effectiveSocietyId },
    { skip: !needsUnitOptions || !effectiveSocietyId },
  );
  const { data: unitMembershipOptions } = useGetResourceListQuery(
    { resource: "unit-membership", societyId: effectiveSocietyId },
    { skip: !needsUnitMembershipOptions || !effectiveSocietyId },
  );
  const { data: userOptions } = useGetResourceListQuery(
    { resource: "user", societyId: effectiveSocietyId },
    { skip: !needsUserOptions || !effectiveSocietyId },
  );

  const scopedData = useMemo(() => {
    const records = data ?? [];

    if (needsSocietySelector) {
      if (!selectedSocietyId) {
        return [];
      }
      return records.filter(
        (row) => Number(row.societyId) === Number(selectedSocietyId),
      );
    }

    if (isSocietyAdmin && Number.isFinite(societyId)) {
      return records.filter((row) => {
        if (resource === "society") {
          return Number(row.id) === societyId;
        }
        if ("societyId" in row) {
          return Number(row.societyId) === societyId;
        }
        return true;
      });
    }

    return records;
  }, [
    data,
    isSocietyAdmin,
    needsSocietySelector,
    resource,
    selectedSocietyId,
    societyId,
  ]);

  const tableDisplayColumns = useMemo<TableColumn[]>(
    () =>
      config?.columns ??
      visibleFields
        .filter((field) => field.type !== "textarea")
        .slice(0, 6)
        .map((field) => ({ name: field.name, label: field.label })),
    [config, visibleFields],
  );

  // Relation ids (unitId, userId, unitMembershipId…) are shown by name.
  const relationOptions: Record<string, ResourceRecord[] | undefined> = {
    society: societies,
    wing: wingOptions,
    unit: unitOptions,
    "unit-membership": unitMembershipOptions,
    user: userOptions,
  };
  const cellText = (row: ResourceRecord, column: TableColumn) => {
    if (column.value) {
      return column.value(row) || "—";
    }
    const raw = row[column.name];
    if (raw === null || raw === undefined || raw === "") {
      return "—";
    }
    const relationResource = RELATION_FIELD_TO_RESOURCE[column.name];
    if (relationResource) {
      const item = relationOptions[relationResource]?.find((o) => String(o.id) === String(raw));
      return item ? getRelationOptionLabel(relationResource, item, t) : "—";
    }
    return String(raw);
  };

  if (!config) {
    return (
      <section className="space-y-4">
        <h2 className="page-title">
          {t("Unknown resource")}
        </h2>
        <p className="text-slate-600">{t("No configuration found for: {resource}", { resource })}</p>
      </section>
    );
  }

  if (!mounted) {
    return (
      <section className="space-y-4">
        <h2 className="page-title">
          {t(config.label)}
        </h2>
        <p className="text-slate-600">{t("Loading...")}</p>
      </section>
    );
  }

  const openCreate = () => {
    if (!canCreate) {
      return;
    }

    setFeedback("");
    setEditingId(null);
    // New records start active; an unticked box would save them as inactive.
    setFormState(visibleFields.some((f) => f.name === "isActive") ? { isActive: true } : {});
    setIsFormOpen(true);
  };

  const openEdit = (row: ResourceRecord) => {
    if (!canEdit) {
      return;
    }

    const nextState: FormState = {};
    visibleFields.forEach((field) => {
      nextState[field.name] = toInputValue(row[field.name], field.type);
    });
    setFeedback("");
    setEditingId(row.id ?? null);
    setFormState(nextState);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormState({});
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");

    const payload: Record<string, unknown> = {};
    formFields.forEach((field) => {
      const current = formState[field.name];
      payload[field.name] = toPayloadValue(current ?? "", field.type);
    });

    if (needsSocietySelector) {
      if (!selectedSocietyId) {
        setFeedback("Please select a society first.");
        return;
      }
      payload.societyId = Number(selectedSocietyId);
    } else if (
      isSocietyAdmin &&
      Number.isFinite(societyId) &&
      resource !== "society"
    ) {
      payload.societyId = societyId;
    }

    if (resource === "user") {
      const currentName = String(payload.name ?? "").trim();
      const firstName = String(payload.firstName ?? "").trim();
      const middleName = String(payload.middleName ?? "").trim();
      const lastName = String(payload.lastName ?? "").trim();
      if (!currentName) {
        payload.name = [firstName, middleName, lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
      }
      if (!String(payload.name ?? "").trim()) {
        setFeedback("Provide Name or First Name and Last Name.");
        return;
      }
    }

    if (resource === "unit-membership") {
      const membershipType = String(payload.type ?? "");
      if (membershipType !== "OWNER" && membershipType !== "TENANT") {
        setFeedback("Unit membership type must be OWNER or TENANT.");
        return;
      }
      const userName = String(payload.userName ?? "").trim();
      if (!userName) {
        setFeedback("User Name is required.");
        return;
      }

      const primaryFirstName = String(payload.primaryFirstName ?? "").trim();
      const primaryLastName = String(payload.primaryLastName ?? "").trim();
      if (!primaryFirstName || !primaryLastName) {
        setFeedback("Primary family first name and last name are required.");
        return;
      }

      payload.user = {
        name: userName,
        phone: String(payload.userPhone ?? "").trim() || undefined,
        email: String(payload.userEmail ?? "").trim() || undefined,
        role: "MEMBER",
        isActive: payload.isActive !== false,
      };
      payload.primaryFamily = {
        firstName: primaryFirstName,
        middleName: String(payload.primaryMiddleName ?? "").trim() || undefined,
        lastName: primaryLastName,
        familyName: String(payload.primaryFamilyName ?? "").trim() || undefined,
      };

      delete payload.userName;
      delete payload.userPhone;
      delete payload.userEmail;
      delete payload.primaryFirstName;
      delete payload.primaryMiddleName;
      delete payload.primaryLastName;
      delete payload.primaryFamilyName;
    }

    // Wing/unit limits (0 = no limit) are enforced by the backend; its message is shown below.
    try {
      if (editingId !== null) {
        await updateResource({ resource, id: editingId, payload, societyId: effectiveSocietyId }).unwrap();
        setFeedback("Updated successfully.");
      } else {
        await createResource({ resource, payload }).unwrap();
        setFeedback("Created successfully.");
      }
      closeForm();
    } catch (error) {
      setFeedback(errorMessage(error, "Request failed. Check field values and IDs."));
    }
  };

  const onDelete = async (id: number | string | undefined) => {
    if (!canDelete || id === undefined || id === null) {
      return;
    }

    try {
      await deleteResource({ resource, id, societyId: effectiveSocietyId }).unwrap();
      setFeedback("Deleted successfully.");
    } catch (error) {
      setFeedback(errorMessage(error, "Delete failed."));
    }
  };

  const setField = (name: string, value: string | boolean) =>
    setFormState((prev) => ({ ...prev, [name]: value }));

  const renderField = (field: ResourceField) => {
    const currentValue = formState[field.name] ?? (field.type === "checkbox" ? false : "");
    const label = (
      <label className="label" htmlFor={`f-${field.name}`}>
        {t(field.label)}
        </label>
    );

    if (field.type === "checkbox") {
      return (
        <label
          key={field.name}
          className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 self-end"
        >
          <input
            type="checkbox"
            checked={Boolean(currentValue)}
            onChange={(e) => setField(field.name, e.target.checked)}
          />
          {t(field.label)}
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.name} className="md:col-span-2">
          {label}
          <textarea
            id={`f-${field.name}`}
            value={String(currentValue)}
            onChange={(e) => setField(field.name, e.target.value)}
            required={field.required}
            className="input"
          />
        </div>
      );
    }

    const relationResource = RELATION_FIELD_TO_RESOURCE[field.name];
    if (field.type === "select" || (field.type === "number" && relationResource)) {
      const options: { value: string; label: string }[] =
        field.type === "select"
          ? resource === "user" && isSocietyAdmin && field.name === "role"
            ? (field.options ?? []).filter((option) => option.value !== "SUPER_ADMIN")
            : (field.options ?? [])
          : (relationResource === "wing"
              ? (wingOptions ?? [])
              : relationResource === "unit"
                ? (unitOptions ?? [])
                : relationResource === "unit-membership"
                  ? (unitMembershipOptions ?? [])
                  : relationResource === "user"
                    ? (userOptions ?? [])
                    : (societies ?? [])
            ).map((item) => ({
              value: String(item.id),
              label: getRelationOptionLabel(relationResource, item, t),
            }));

      return (
        <div key={field.name}>
          {label}
          <select
            id={`f-${field.name}`}
            value={String(currentValue)}
            onChange={(e) => setField(field.name, e.target.value)}
            required={field.required}
            className="input"
          >
            <option value="">{t("Select {label}", { label: t(field.label).toLowerCase() })}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {field.type === "select" ? t(option.label) : option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={field.name}>
        {label}
        <input
          id={`f-${field.name}`}
          type={field.type}
          value={String(currentValue)}
          onChange={(e) => setField(field.name, e.target.value)}
          required={field.required}
          className="input"
          list={field.suggestions ? `s-${field.name}` : undefined}
        />
        {field.suggestions ? (
          // Built-in suggestions plus whatever this list already uses (e.g. a service type the admin added).
          <datalist id={`s-${field.name}`}>
            {[...new Set([...field.suggestions, ...(data ?? []).map((r) => String(r[field.name] ?? ""))])]
              .filter(Boolean)
              .map((s) => (
                <option key={s} value={s} />
              ))}
          </datalist>
        ) : null}
      </div>
    );
  };

  const confirmResetPassword = async (row: ResourceRecord) => {
    if (row.id === undefined || !window.confirm(t("Reset {name}'s password to pass@123?", { name: String(row.name ?? "") }))) {
      return;
    }
    try {
      await resetUserPassword({ id: row.id, societyId: isSuperAdmin ? effectiveSocietyId : undefined }).unwrap();
      setFeedback("Password reset successfully. They must set a new one at next login.");
    } catch (error) {
      setFeedback(errorMessage(error, "Password reset failed."));
    }
  };

  const confirmDelete = (id: number | string | undefined) => {
    if (window.confirm(t("Delete this record? This cannot be undone."))) {
      onDelete(id);
    }
  };

  const isSaving = isCreating || isUpdating;
  const showTable =
    isApiEnabled && !isLoading && !isError && !(needsSocietySelector && !selectedSocietyId);
  const singular = config.label.replace(/ies$/, "y").replace(/s$/, "").toLowerCase();

  return (
    <section className="space-y-6 min-w-0">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="page-title">{t(config.label)}</h2>
          <p className="page-subtitle">{t(config.description)}</p>
        </div>
        {isApiEnabled ? (
          <div className="flex items-center gap-2">
            {resource === "unit-membership" && effectiveSocietyId ? (
              <ImportExportActions kind="unit-membership" societyId={effectiveSocietyId} />
            ) : null}
            {resource === "asset" && canEdit && effectiveSocietyId ? (
              <ImportExportActions kind="asset" societyId={effectiveSocietyId} />
            ) : null}
            {resource === "society" ? (
              isSuperAdmin ? (
                <Link href="/portal/onboard-society" className="btn-primary">
                  {t("+ Onboard society")}
                </Link>
              ) : null
            ) : canWrite ? (
              <button type="button" onClick={openCreate} disabled={!canCreate} className="btn-primary">
                {t("+ Add {item}", { item: t(singular) })}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {needsSocietySelector ? (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600" htmlFor="society-picker">
            {t("Society")}
          </label>
          <select
            id="society-picker"
            value={selectedSocietyId}
            onChange={(e) => setSelectedSocietyId(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">{t("Select a society")}</option>
            {(societies ?? []).map((society) => (
              <option key={String(society.id)} value={String(society.id)}>
                {String(society.name ?? t("Society {id}", { id: String(society.id) }))}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!isApiEnabled ? <p className="alert-warn">{t("This section isn't available yet.")}</p> : null}

      {feedback ? (
        <p className={/success/i.test(feedback) ? "alert-success" : "alert-error"}>{t(feedback)}</p>
      ) : null}

      {isApiEnabled && isLoading ? (
        <div className="card p-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : null}

      {isApiEnabled && isError ? (
        <div className="card p-6 space-y-3">
          <p className="alert-error">{t("Couldn't load {items}.", { items: t(config.label).toLowerCase() })}</p>
          <button type="button" onClick={() => refetch()} className="btn-secondary">
            {t("Try again")}
          </button>
        </div>
      ) : null}

      {needsSocietySelector && !selectedSocietyId ? (
        <div className="card p-10 text-center">
          <p className="section-title">{t("Pick a society")}</p>
          <p className="mt-1 text-sm text-slate-500">
            {t("Choose a society above to see its {items}.", { items: t(config.label).toLowerCase() })}
          </p>
        </div>
      ) : null}

      {showTable ? (
        <div className="card w-full max-w-full overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table min-w-max">
              <thead>
                <tr>
                  {tableDisplayColumns.map((field) => (
                    <th key={field.name}>{t(field.label)}</th>
                  ))}
                  {canEdit || canDelete ? <th className="text-right">{t("Actions")}</th> : null}
                </tr>
              </thead>
              <tbody>
                {scopedData.map((row, index) => (
                  <tr key={String(row.id ?? `row-${index}`)}>
                    {tableDisplayColumns.map((field) => (
                      <td key={field.name} className="max-w-[240px] whitespace-normal break-words">
                        {typeof row[field.name] === "boolean" ? (
                          <span className={`badge ${row[field.name] ? "bg-brand-50 text-brand-700" : ""}`}>
                            {row[field.name] ? t("Yes") : t("No")}
                          </span>
                        ) : (
                          cellText(row, field)
                        )}
                      </td>
                    ))}
                    {canEdit || canDelete ? (
                      <td className="whitespace-nowrap text-right">
                        <div className="inline-flex gap-2">
                          {canEdit ? (
                            <button type="button" onClick={() => openEdit(row)} className="btn-secondary btn-sm">
                              {t("Edit")}
                            </button>
                          ) : null}
                          {resource === "user" && (row.email || row.phone) ? (
                            <button
                              type="button"
                              onClick={() => confirmResetPassword(row)}
                              className="btn-secondary btn-sm"
                            >
                              {t("Reset password")}
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => confirmDelete(row.id)}
                              disabled={isDeleting}
                              className="btn-danger btn-sm"
                            >
                              {t("Delete")}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {scopedData.length === 0 ? (
            <div className="p-10 text-center">
              <p className="section-title">{t("Nothing here yet")}</p>
              <p className="mt-1 text-sm text-slate-500">
                {!canCreate
                  ? t("Records will appear here once they are added.")
                  : resource === "unit-membership"
                    ? t("Import residents from Excel or add them one by one.")
                    : t("Add the first one with the button above.")}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {isApiEnabled && isFormOpen && (canWrite || canEdit) ? (
        <div className="modal-backdrop" onClick={closeForm}>
          <form onSubmit={onSubmit} className="modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId !== null ? t("Edit {item}", { item: t(singular) }) : t("New {item}", { item: t(singular) })}
              </h3>
              <button type="button" onClick={closeForm} className="btn-ghost btn-sm" aria-label={t("Close")}>
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">{formFields.map(renderField)}</div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={closeForm} className="btn-secondary">
                {t("Cancel")}
              </button>
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving ? t("Saving...") : editingId !== null ? t("Save changes") : t("Create")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
