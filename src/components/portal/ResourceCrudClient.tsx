"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useCreateResourceMutation,
  useDeleteResourceMutation,
  useGetResourceListQuery,
  useExportFileMutation,
  useImportFileMutation,
  useUpdateResourceMutation,
  type ResourceRecord,
} from "@/lib/features/portal/portalApi";
import {
  RESOURCE_CONFIG_MAP,
  type ResourceConfig,
  type ResourceField,
} from "@/lib/features/portal/resourceConfig";
import { useAppSelector } from "@/lib/hooks";
import ImportExportActions from "@/components/importexport/page";

type Props = {
  resource: string;
};

type FormState = Record<string, string | boolean>;
type TableColumn = { name: string; label: string };

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
) => {
  if (relationResource === "society") {
    return String(item.name ?? item.city ?? "Society");
  }
  if (relationResource === "wing") {
    return String(item.name ?? "Wing");
  }
  if (relationResource === "unit") {
    return String(item.unitNumber ?? item.name ?? "Unit");
  }
  if (relationResource === "user") {
    return String(item.name ?? item.email ?? item.phone ?? "User");
  }
  if (relationResource === "unit-membership") {
    return String(
      item.userName ??
        item.type ??
        item.id ??
        item.unitId ??
        "Unit Membership",
    );
  }
  return String(item.name ?? "Record");
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
  const user = useAppSelector((state) => state.auth.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const needsSocietyCounts =
    resource === "wing" || resource === "unit" || resource === "society";
  const needsSocietySelector =
    isSuperAdmin && hasSocietyField && resource !== "society";
  const effectiveSocietyId =
    isSocietyAdmin && Number.isFinite(societyId)
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
    { skip: !(needsSocietySelector || (isSocietyAdmin && needsSocietyCounts)) },
  );

  const [createResource, { isLoading: isCreating }] =
    useCreateResourceMutation();
  const [updateResource, { isLoading: isUpdating }] =
    useUpdateResourceMutation();
  const [deleteResource, { isLoading: isDeleting }] =
    useDeleteResourceMutation();
  const [importFile] = useImportFileMutation();
  const [exportFile] = useExportFileMutation();

  const canWrite = useMemo(() => {
    if (isSuperAdmin) {
      return true;
    }
    if (isSocietyAdmin) {
      return true;
    }
    return false;
  }, [isSocietyAdmin, isSuperAdmin]);

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

  const canDelete = useMemo(() => {
    if (!canWrite) {
      return false;
    }
    if (isSocietyAdmin && resource === "society") {
      return false;
    }
    return true;
  }, [canWrite, isSocietyAdmin, resource]);

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

  const needsWingOptions = visibleFields.some(
    (field) => field.name === "wingId",
  );
  const needsUnitOptions = visibleFields.some(
    (field) => field.name === "unitId",
  );
  const needsUnitMembershipOptions = visibleFields.some(
    (field) => field.name === "unitMembershipId",
  );
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

  const tableColumns = useMemo(
    () => visibleFields.slice(0, 6),
    [visibleFields],
  );

  const currentSocietyRecord = useMemo(() => {
    if (!societies || societies.length === 0) {
      return undefined;
    }
    if (
      resource === "society" &&
      isSocietyAdmin &&
      Number.isFinite(societyId)
    ) {
      return societies.find((s) => Number(s.id) === societyId);
    }

    const targetSocietyId = effectiveSocietyId;
    if (!targetSocietyId) {
      return undefined;
    }
    return societies.find((s) => Number(s.id) === Number(targetSocietyId));
  }, [effectiveSocietyId, isSocietyAdmin, resource, societies, societyId]);

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
    isSuperAdmin,
    resource,
    selectedSocietyId,
    societyId,
  ]);

  const tableDisplayColumns = useMemo<TableColumn[]>(() => {
    const sample = scopedData[0];

    if (!sample) {
      return tableColumns.map((field) => ({
        name: field.name,
        label: field.label,
      }));
    }

    const sampleKeys = new Set(Object.keys(sample));
    const base: TableColumn[] = tableColumns
      .filter((field) => sampleKeys.has(field.name))
      .map((field) => ({
        name: field.name,
        label: field.label,
      }));

    const baseNames = new Set(base.map((field) => field.name));
    const extras: TableColumn[] = [];

    Object.keys(sample).forEach((key) => {
      if (
        key === "id" ||
        key === "createdAt" ||
        key === "updatedAt" ||
        baseNames.has(key)
      ) {
        return;
      }

      extras.push({
        name: key,
        label: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (c) => c.toUpperCase()),
      });
    });

    return [...base, ...extras];
  }, [scopedData, tableColumns]);

  if (!config) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-rose-600">
          Unknown resource
        </h2>
        <p className="text-slate-600">No configuration found for: {resource}</p>
      </section>
    );
  }

  if (!mounted) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-rose-600">
          {config.label}
        </h2>
        <p className="text-slate-600">Loading...</p>
      </section>
    );
  }

  const openCreate = () => {
    if (!canCreate) {
      return;
    }

    setFeedback("");
    setEditingId(null);
    setFormState({});
    setIsFormOpen(true);
  };

  const openEdit = (row: ResourceRecord) => {
    if (!canWrite) {
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
    visibleFields.forEach((field) => {
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

    if (editingId === null && (resource === "wing" || resource === "unit")) {
      const maxCount =
        resource === "wing"
          ? Number(currentSocietyRecord?.wingsCount ?? 0)
          : Number(currentSocietyRecord?.unitsCount ?? 0);
      const currentCount = scopedData.length;

      if (
        Number.isFinite(maxCount) &&
        maxCount >= 0 &&
        currentCount >= maxCount
      ) {
        setFeedback(
          `Cannot create more ${resource === "wing" ? "wings" : "units"} than configured count (${maxCount}).`,
        );
        return;
      }
    }

    try {
      if (editingId !== null) {
        await updateResource({ resource, id: editingId, payload }).unwrap();
        setFeedback("Updated successfully.");
      } else {
        await createResource({ resource, payload }).unwrap();
        setFeedback("Created successfully.");
      }
      closeForm();
    } catch {
      setFeedback("Request failed. Check field values and IDs.");
    }
  };

  const onDelete = async (id: number | string | undefined) => {
    if (!canDelete || id === undefined || id === null) {
      return;
    }

    try {
      await deleteResource({ resource, id }).unwrap();
      setFeedback("Deleted successfully.");
    } catch {
      setFeedback("Delete failed.");
    }
  };

  const handleMembershipImport = async (file: File) => {
    if (!effectiveSocietyId) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);

      await importFile({
        url: `/v1/unit-membership/import?societyId=${effectiveSocietyId}`,
        data: formData,
      }).unwrap();
    } catch {
      setFeedback("Import failed.");
    }
  };

  const handleMembershipExport = async () => {
    const blob = await exportFile("/unit-membership/export").unwrap();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unit-memberships.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleMembershipTemplateDownload = async () => {
    if (!effectiveSocietyId) {
      return;
    }
    const blob = await exportFile(
      `/v1/unit-membership/import/template?societyId=${effectiveSocietyId}`,
    ).unwrap();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "unit-memberships-template.xlsx";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-5 min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-rose-600">
            {config.label}
          </h2>
          <p className="text-sm text-slate-500">{config.description}</p>
        </div>
        {isApiEnabled ? (
          <div className="flex items-center gap-2">
            {resource === "unit-membership" ? (
              <ImportExportActions
                onImport={handleMembershipImport}
                onExport={handleMembershipExport}
                templateDownload={handleMembershipTemplateDownload}
              />
            ) : null}
            <button
              type="button"
              onClick={openCreate}
              disabled={!canCreate}
              className={`px-4 py-2 rounded-lg text-white ${
                canCreate
                  ? "bg-rose-500 hover:bg-rose-600"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              Add New
            </button>
          </div>
        ) : null}
      </div>

      {needsSocietySelector ? (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium mb-1">
            Select Society
          </label>
          <select
            value={selectedSocietyId}
            onChange={(e) => setSelectedSocietyId(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
          >
            <option value="">Select society</option>
            {(societies ?? []).map((society) => (
              <option key={String(society.id)} value={String(society.id)}>
                {String(society.name ?? `Society ${society.id}`)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!isApiEnabled ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4">
          Backend route is not available for this table yet.
        </div>
      ) : null}

      {isApiEnabled && !canWrite ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4">
          You have read-only access for this resource.
        </div>
      ) : null}

      {isApiEnabled && isFormOpen && canWrite ? (
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-xl shadow-sm p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-slate-700">
            {editingId !== null ? "Edit Record" : "Create Record"}
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {visibleFields.map((field) => {
              const currentValue =
                formState[field.name] ??
                (field.type === "checkbox" ? false : "");

              if (field.type === "textarea") {
                return (
                  <div key={field.name} className="text-left md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      {field.label}
                    </label>
                    <textarea
                      value={String(currentValue)}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      required={field.required}
                      className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                    />
                  </div>
                );
              }

              if (field.type === "select") {
                const options =
                  resource === "user" && isSocietyAdmin && field.name === "role"
                    ? (field.options ?? []).filter(
                        (option) => option.value !== "SUPER_ADMIN",
                      )
                    : (field.options ?? []);

                return (
                  <div key={field.name} className="text-left">
                    <label className="block text-sm font-medium mb-1">
                      {field.label}
                    </label>
                    <select
                      value={String(currentValue)}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      required={field.required}
                      className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                    >
                      <option value="">Select {field.label}</option>
                      {options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              const relationResource = RELATION_FIELD_TO_RESOURCE[field.name];
              if (field.type === "number" && relationResource) {
                const source =
                  relationResource === "wing"
                    ? (wingOptions ?? [])
                    : relationResource === "unit"
                      ? (unitOptions ?? [])
                      : relationResource === "unit-membership"
                        ? (unitMembershipOptions ?? [])
                      : relationResource === "user"
                        ? (userOptions ?? [])
                        : (societies ?? []);

                return (
                  <div key={field.name} className="text-left">
                    <label className="block text-sm font-medium mb-1">
                      {field.label}
                    </label>
                    <select
                      value={String(currentValue)}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      required={field.required}
                      className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                    >
                      <option value="">Select {field.label}</option>
                      {source.map((item) => {
                        const label = getRelationOptionLabel(
                          relationResource,
                          item,
                        );
                        return (
                          <option key={String(item.id)} value={String(item.id)}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              }

              if (field.type === "checkbox") {
                return (
                  <label
                    key={field.name}
                    className="flex items-center gap-3 text-slate-700 mt-6"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(currentValue)}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          [field.name]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                    {field.label}
                  </label>
                );
              }

              return (
                <div key={field.name} className="text-left">
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={String(currentValue)}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }))
                    }
                    required={field.required}
                    className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className={`px-4 py-2 rounded-lg text-white ${
                isCreating || isUpdating
                  ? "bg-rose-300 cursor-not-allowed"
                  : "bg-rose-500 hover:bg-rose-600"
              }`}
            >
              {isCreating || isUpdating
                ? "Saving..."
                : editingId !== null
                  ? "Update"
                  : "Create"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {feedback ? (
        <div className="bg-slate-100 text-slate-700 rounded-lg px-4 py-2 text-sm">
          {feedback}
        </div>
      ) : null}

      {isApiEnabled && isLoading ? (
        <p className="text-slate-600">Loading {config.label}...</p>
      ) : null}
      {isApiEnabled && isError ? (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
          <p className="text-red-600">Failed to load records.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      ) : null}

      {needsSocietySelector && !selectedSocietyId ? (
        <div className="bg-white rounded-xl shadow-sm p-6 text-slate-600">
          Select a society to view data.
        </div>
      ) : null}

      {isApiEnabled &&
      !isLoading &&
      !isError &&
      !(needsSocietySelector && !selectedSocietyId) ? (
        <div className="bg-white rounded-xl shadow-sm w-full max-w-full overflow-x-auto">
          <table className="w-full min-w-max text-sm table-auto">
            <thead className="bg-rose-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  ID
                </th>
                {tableDisplayColumns.map((field) => (
                  <th
                    key={field.name}
                    className="px-4 py-3 text-left font-semibold text-slate-700"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {scopedData.map((row, index) => (
                <tr
                  key={String(row.id ?? `row-${index}`)}
                  className="border-t border-slate-100"
                >
                  <td className="px-4 py-3 whitespace-nowrap">{String(row.id ?? "-")}</td>
                  {tableDisplayColumns.map((field) => (
                    <td
                      key={field.name}
                      className="px-4 py-3 max-w-[220px] whitespace-normal break-all"
                    >
                      {String(row[field.name] ?? "-")}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        disabled={!canWrite}
                        className={`px-3 py-1 rounded ${
                          canWrite
                            ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row.id)}
                        disabled={isDeleting || !canDelete}
                        className={`px-3 py-1 rounded text-white ${
                          isDeleting || !canDelete
                            ? "bg-slate-300"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {scopedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableDisplayColumns.length + 2}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No records found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
