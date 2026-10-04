"use client";

import { useMemo, useState } from "react";
import {
  useCreateResourceMutation,
  useGetResourceListQuery,
  useUpdateResourceMutation,
  type ResourceRecord,
} from "@/lib/features/portal/portalApi";
import { useAppSelector } from "@/lib/hooks";
import ImportExportActions from "@/components/importexport/page";
import UnitHouseholdPanel from "@/components/unit/UnitHouseholdPanel";
import { errorMessage } from "@/lib/api";

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toId = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

const getRelatedId = (value: unknown) => {
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return toId(record.id);
  }
  return toId(value);
};

const isActiveMembership = (membership: ResourceRecord) => {
  const value =
    membership.isActive ??
    membership.is_active ??
    membership.active ??
    membership.status;

  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "inactive" ||
    normalized === "disabled" ||
    normalized === "expired"
  ) {
    return false;
  }
  return true;
};

export default function UnitHomesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const role = String(user?.role ?? "").toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isSocietyAdmin = role === "SOCIETY_ADMIN";

  const [selectedSocietyId, setSelectedSocietyId] = useState<string>("");
  const [selectedWingId, setSelectedWingId] = useState<string>("");

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [unitModalView, setUnitModalView] = useState<
    "list" | "create-unit" | "edit-unit"
  >("list");
  const [newUnitWingId, setNewUnitWingId] = useState("");
  const [newUnitFloorNumber, setNewUnitFloorNumber] = useState("");
  const [newUnitNumber, setNewUnitNumber] = useState("");
  const [newUnitParkingSlots, setNewUnitParkingSlots] = useState("");
  const [newUnitAreaSqft, setNewUnitAreaSqft] = useState("");
  const [editUnitWingId, setEditUnitWingId] = useState("");
  const [editUnitFloorNumber, setEditUnitFloorNumber] = useState("");
  const [editUnitNumber, setEditUnitNumber] = useState("");
  const [editUnitParkingSlots, setEditUnitParkingSlots] = useState("");
  const [editUnitAreaSqft, setEditUnitAreaSqft] = useState("");
  const [message, setMessage] = useState("");

  const ownSocietyId = toNumber(user?.societyId);
  const effectiveSocietyId = isSocietyAdmin
    ? ownSocietyId
    : selectedSocietyId
      ? Number(selectedSocietyId)
      : 0;

  const { data: societies = [] } = useGetResourceListQuery(
    { resource: "society" },
    { skip: false },
  );

  const { data: wings = [] } = useGetResourceListQuery(
    { resource: "wing", societyId: effectiveSocietyId || undefined },
    { skip: !effectiveSocietyId },
  );

  const {
    data: units = [],
    refetch: refetchUnits,
  } = useGetResourceListQuery(
    {
      resource: "unit",
      societyId: effectiveSocietyId || undefined,
      wingId: Number(selectedWingId) || undefined,
    },
    { skip: !selectedWingId || !effectiveSocietyId },
  );

  // const { data: membershipsScoped = [] } = useGetResourceListQuery(
  //   { resource: "unit-membership", societyId: effectiveSocietyId || undefined },
  //   { skip: !effectiveSocietyId },
  // );

  const { data: membershipsAll = [] } = useGetResourceListQuery(
    { resource: "unit-membership", societyId: effectiveSocietyId || undefined },
    { skip: !effectiveSocietyId },
  );

  const memberships = useMemo(() => {
    if (!effectiveSocietyId) {
      return [];
    }
    return membershipsAll.filter((m) => {
      const societyId = toNumber(
        m.societyId ?? m.society_id ?? getRelatedId(m.society),
      );
      return societyId === 0 || societyId === effectiveSocietyId;
    });
  }, [effectiveSocietyId, membershipsAll]);

  const { data: usersAll = [] } = useGetResourceListQuery(
    { resource: "user", societyId: effectiveSocietyId || undefined },
    { skip: !effectiveSocietyId },
  );

  const users = useMemo(() => {
    if (!effectiveSocietyId) {
      return [];
    }

    return usersAll.filter((u) => {
      const societyId = toNumber(
        u.societyId ?? u.society_id ?? getRelatedId(u.society),
      );
      return societyId === 0 || societyId === effectiveSocietyId;
    });
  }, [effectiveSocietyId, usersAll]);

  const [createUnitResource, { isLoading: isCreatingUnit }] =
    useCreateResourceMutation();
  const [updateResource, { isLoading: isUpdatingUnit }] =
    useUpdateResourceMutation();

  const selectedWing = useMemo(() => {
    return wings.find((w) => Number(w.id) === Number(selectedWingId));
  }, [wings, selectedWingId]);

  const unitsCount = toNumber(selectedWing?.unitCount);

  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => toNumber(a.id) - toNumber(b.id));
  }, [units]);

  const homeSlots = useMemo(() => {
    const limit = Math.max(unitsCount, sortedUnits.length);
    return Array.from({ length: limit }, (_, index) => ({
      slot: index + 1,
      unit: sortedUnits[index] ?? null,
    }));
  }, [sortedUnits, unitsCount]);

  const wingNameById = useMemo(() => {
    const map = new Map<number, string>();
    wings.forEach((wing) => {
      map.set(toNumber(wing.id), String(wing.name ?? `Wing ${wing.id}`));
    });
    return map;
  }, [wings]);

  const membersByUnitId = useMemo(() => {
    const usersMap = new Map<number, ResourceRecord>();
    users.forEach((u) => usersMap.set(toNumber(u.id), u));

    const map = new Map<
      string,
      Array<{ membership: ResourceRecord; user: ResourceRecord | undefined }>
    >();
    memberships
      .filter((m) => isActiveMembership(m))
      .forEach((membership) => {
        const unitId = getRelatedId(
          membership.unitId ?? membership.unit_id ?? membership.unit,
        );
        if (!unitId) {
          return;
        }
        const userId = toNumber(
          getRelatedId(
            membership.userId ?? membership.user_id ?? membership.user,
          ),
        );
        const existing = map.get(unitId) ?? [];
        existing.push({ membership, user: usersMap.get(userId) });
        map.set(unitId, existing);
      });

    return map;
  }, [memberships, users]);

  const selectedUnit = useMemo(
    () => sortedUnits.find((u) => toId(u.id) === selectedUnitId),
    [sortedUnits, selectedUnitId],
  );
  const selectedSlotNumber = useMemo(() => {
    if (!selectedUnitId || !selectedUnitId.startsWith("slot-")) {
      return null;
    }
    const slot = Number(selectedUnitId.replace("slot-", ""));
    return Number.isFinite(slot) ? slot : null;
  }, [selectedUnitId]);

  const canEditUnit = isSuperAdmin || isSocietyAdmin;

  // An empty planned slot opens the unit details form directly; saving creates the unit.
  const openUnitDetailsForm = () => {
    setNewUnitWingId(selectedWingId);
    setNewUnitFloorNumber("");
    setNewUnitNumber("");
    setNewUnitParkingSlots("");
    setNewUnitAreaSqft("");
    setUnitModalView("create-unit");
    setMessage("");
  };

  const onCreateUnit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const wingIdNumber = Number(newUnitWingId);
    const floorNumber = Number(newUnitFloorNumber);
    if (
      !effectiveSocietyId ||
      !Number.isFinite(wingIdNumber) ||
      !Number.isFinite(floorNumber) ||
      !newUnitNumber.trim()
    ) {
      setMessage("Select wing, floor number and unit number.");
      return;
    }

    try {
      const created = await createUnitResource({
        resource: "unit",
        payload: {
          societyId: effectiveSocietyId,
          wingId: wingIdNumber,
          floorNumber,
          unitNumber: newUnitNumber.trim(),
          parkingSlots: newUnitParkingSlots.trim() || null,
          areaSqft: newUnitAreaSqft ? Number(newUnitAreaSqft) : null,
        },
      }).unwrap();

      // Reload first so the saved unit (and its details) is in the list when the popup shows it.
      await refetchUnits();
      const createdId = toId(created.id);
      if (createdId) {
        setSelectedUnitId(createdId);
      }
      setUnitModalView("list");
      setNewUnitWingId("");
      setNewUnitFloorNumber("");
      setNewUnitNumber("");
      setNewUnitParkingSlots("");
      setNewUnitAreaSqft("");
      setMessage("Unit details saved successfully.");
    } catch (error) {
      setMessage(errorMessage(error, "Failed to create unit."));
    }
  };

  const openEditUnitForm = () => {
    if (!selectedUnit || !canEditUnit) {
      return;
    }
    setEditUnitWingId(toId(selectedUnit.wingId));
    setEditUnitFloorNumber(String(selectedUnit.floorNumber ?? ""));
    setEditUnitNumber(String(selectedUnit.unitNumber ?? ""));
    setEditUnitParkingSlots(String(selectedUnit.parkingSlots ?? ""));
    setEditUnitAreaSqft(String(selectedUnit.areaSqft ?? ""));
    setUnitModalView("edit-unit");
    setMessage("");
  };

  const onUpdateUnit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!selectedUnit?.id) {
      setMessage("No unit selected.");
      return;
    }

    const wingIdNumber = Number(editUnitWingId);
    const floorNumber = Number(editUnitFloorNumber);
    if (
      !effectiveSocietyId ||
      !Number.isFinite(wingIdNumber) ||
      !Number.isFinite(floorNumber) ||
      !editUnitNumber.trim()
    ) {
      setMessage("Select wing, floor number and unit number.");
      return;
    }

    try {
      await updateResource({
        resource: "unit",
        id: selectedUnit.id,
        societyId: effectiveSocietyId,
        payload: {
          societyId: effectiveSocietyId,
          wingId: wingIdNumber,
          floorNumber,
          unitNumber: editUnitNumber.trim(),
          parkingSlots: editUnitParkingSlots.trim() || null,
          areaSqft: editUnitAreaSqft ? Number(editUnitAreaSqft) : null,
        },
      }).unwrap();
      await refetchUnits();
      setUnitModalView("list");
      setMessage("Unit details updated successfully.");
    } catch (error) {
      setMessage(errorMessage(error, "Failed to update unit."));
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Units</h2>
          <p className="page-subtitle">Pick a wing to see its flats. Click a flat to manage owners, tenants and family.</p>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        {/* Society Dropdown */}
        {isSuperAdmin && (
          <div className="card p-4 flex-1 min-w-[250px]">
            <label className="label">
              Select Society
            </label>
            <select
              value={selectedSocietyId}
              onChange={(e) => {
                setSelectedSocietyId(e.target.value);
                setUnitModalView("list");
              }}
              className="input"
            >
              <option value="">Select society</option>
              {societies.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {String(s.name ?? `Society ${s.id}`)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Wing Dropdown */}
        {effectiveSocietyId ? (
          <>
            <div className="card p-4 flex-1 min-w-[250px]">
              <label className="label">
                Select Wing
              </label>
              <select
                value={selectedWingId}
                onChange={(e) => {
                  setSelectedWingId(e.target.value);
                  setSelectedUnitId(null);
                  setUnitModalView("list");
                }}
                className="input"
              >
                <option value="">Select Wing</option>
                {wings.map((w) => (
                  <option key={String(w.id)} value={String(w.id)}>
                    {String(w.name ?? `Wing ${w.id}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Import creates the wings too, so it must not wait for a wing to be selected. */}
            <div className="card p-4 flex items-end">
              <ImportExportActions kind="unit" societyId={effectiveSocietyId} />
            </div>
          </>
        ) : null}
      </div>
      {effectiveSocietyId && wings.length === 0 ? (
        <p className="alert-warn">
          No wings yet. Use Import Excel to add all units at once (wings are created automatically).
        </p>
      ) : null}
      {selectedWingId ? (
        <>
          {" "}
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Stats Card */}
            <div className="card px-4 py-3 text-sm text-slate-600">
              Planned units: <span className="font-semibold">{unitsCount}</span>
              <span className="mx-2 text-slate-400">|</span>
              Created units:{" "}
              <span className="font-semibold">{sortedUnits.length}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {homeSlots.map(({ slot, unit }) => {
              const unitId = toId(unit?.id);
              const membershipList = unitId
                ? (membersByUnitId.get(unitId) ?? [])
                : [];
              const primaryMembership =
                membershipList.find((m) => Boolean(m.membership.isPrimary)) ??
                membershipList[0];

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    setSelectedUnitId(unitId || `slot-${slot}`);
                    if (unit) {
                      setUnitModalView("list");
                      setMessage("");
                    } else {
                      openUnitDetailsForm();
                    }
                    }}
                  className={`group text-left card p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                    selectedUnitId === unitId && unitId
                      ? "ring-2 ring-brand-500"
                      : unit
                        ? "hover:border-brand-300"
                        : "border-dashed bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`badge ${
                        !unit
                          ? ""
                          : primaryMembership
                            ? "bg-brand-50 text-brand-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {!unit ? "Empty slot" : primaryMembership ? "Occupied" : "Vacant"}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold tracking-tight text-slate-900">
                    {unit
                      ? String(unit.unitNumber ?? `Unit ${unit.id}`)
                      : `Home ${slot}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {unit
                      ? (wingNameById.get(toNumber(unit.wingId)) ?? "No wing")
                      : "Blank slot"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Floor {unit ? String(unit.floorNumber ?? "-") : "-"} · Parking{" "}
                    {unit ? String(unit.parkingSlots ?? "-") : "-"}
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                    {unit
                      ? String(
                          primaryMembership?.membership.type ?? "No membership",
                        )
                      : "Available"}
                  </p>
                  <p className="text-sm text-slate-700 truncate">
                    {unit
                      ? `Owner: ${
                          membershipList.find(
                            (m) => String(m.membership.type) === "OWNER",
                          )?.user?.name ??
                          primaryMembership?.user?.name ??
                          "-"
                        }`
                      : "Owner: -"}
                  </p>
                </button>
              );
            })}
          </div>
          {selectedUnitId ? (
            <div
              className="modal-backdrop"
              onClick={() => {
                setSelectedUnitId(null);
                setUnitModalView("list");
              }}
            >
              <div
                className="modal max-w-3xl space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedUnit
                      ? `Flat ${String(selectedUnit.unitNumber ?? "")}`
                      : `Planned unit ${selectedSlotNumber ?? ""}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUnitId(null);
                      setUnitModalView("list");
                    }}
                    className="btn-secondary btn-sm"
                  >
                    Close
                  </button>
                </div>

                {selectedUnit ? (
                  <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                    {[
                      ["Unit", String(selectedUnit.unitNumber ?? "—")],
                      ["Wing", wingNameById.get(toNumber(selectedUnit.wingId)) ?? "—"],
                      ["Floor", String(selectedUnit.floorNumber ?? "—")],
                      ["Parking", String(selectedUnit.parkingSlots || "—")],
                      ["Area", selectedUnit.areaSqft ? `${String(selectedUnit.areaSqft)} sq ft` : "—"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-slate-500">{label}</dt>
                        <dd className="font-medium text-slate-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-slate-500">
                    This planned unit has no details yet. Fill them in to create it.
                  </p>
                )}

                {unitModalView === "edit-unit" ? (
                  <form
                    onSubmit={onUpdateUnit}
                    className="border-t border-slate-100 pt-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="section-title">Edit unit details</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setUnitModalView("list");
                          setMessage("");
                        }}
                        className="btn-secondary btn-sm"
                      >
                        Back to list
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Wing</label>
                        <select
                          value={editUnitWingId}
                          onChange={(e) => setEditUnitWingId(e.target.value)}
                          required
                          className="input"
                        >
                          <option value="">Select Wing</option>
                          {wings.map((wing) => (
                            <option
                              key={String(wing.id)}
                              value={String(wing.id)}
                            >
                              {String(wing.name ?? `Wing ${wing.id}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">
                          Floor
                        </label>
                        <input
                          type="number"
                          value={editUnitFloorNumber}
                          onChange={(e) =>
                            setEditUnitFloorNumber(e.target.value)
                          }
                          required
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">
                          Unit Number
                        </label>
                        <input
                          type="text"
                          value={editUnitNumber}
                          onChange={(e) => setEditUnitNumber(e.target.value)}
                          required
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">
                          Parking
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. P-12, B1-04"
                          value={editUnitParkingSlots}
                          onChange={(e) =>
                            setEditUnitParkingSlots(e.target.value)
                          }
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">
                          Area (sq ft)
                        </label>
                        <input
                          type="number"
                          value={editUnitAreaSqft}
                          onChange={(e) => setEditUnitAreaSqft(e.target.value)}
                          className="input"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isUpdatingUnit}
                      className="btn-primary"
                    >
                      {isUpdatingUnit ? "Saving..." : "Save changes"}
                    </button>
                    {message ? (
                      <p className={/success/i.test(message) ? "alert-success" : "alert-error"}>{message}</p>
                    ) : null}
                  </form>
                ) : unitModalView === "create-unit" ? (
                  <form
                    onSubmit={onCreateUnit}
                    className="border-t border-slate-100 pt-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="section-title">
                        Unit details{selectedSlotNumber ? ` · planned unit ${selectedSlotNumber}` : ""}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setUnitModalView("list");
                          setMessage("");
                        }}
                        className="btn-secondary btn-sm"
                      >
                        Back to list
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Wing</label>
                        <select
                          value={newUnitWingId}
                          onChange={(e) => setNewUnitWingId(e.target.value)}
                          required
                          className="input"
                        >
                          <option value="">Select Wing</option>
                          {wings.map((wing) => (
                            <option
                              key={String(wing.id)}
                              value={String(wing.id)}
                            >
                              {String(wing.name ?? `Wing ${wing.id}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">
                          Floor
                        </label>
                        <input
                          type="number"
                          value={newUnitFloorNumber}
                          onChange={(e) =>
                            setNewUnitFloorNumber(e.target.value)
                          }
                          required
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">
                          Unit Number
                        </label>
                        <input
                          type="text"
                          value={newUnitNumber}
                          onChange={(e) => setNewUnitNumber(e.target.value)}
                          required
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">
                          Parking
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. P-12, B1-04"
                          value={newUnitParkingSlots}
                          onChange={(e) =>
                            setNewUnitParkingSlots(e.target.value)
                          }
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">
                          Area (sq ft)
                        </label>
                        <input
                          type="number"
                          value={newUnitAreaSqft}
                          onChange={(e) => setNewUnitAreaSqft(e.target.value)}
                          className="input"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isCreatingUnit}
                      className="btn-primary"
                    >
                      {isCreatingUnit ? "Saving..." : "Save unit"}
                    </button>
                    {message ? (
                      <p className={/success/i.test(message) ? "alert-success" : "alert-error"}>{message}</p>
                    ) : null}
                  </form>
                ) : selectedUnit ? (
                  <>
                    {canEditUnit ? (
                      <div className="flex justify-end">
                        <button type="button" onClick={openEditUnitForm} className="btn-secondary btn-sm">
                          Edit unit details
                        </button>
                      </div>
                    ) : null}
                    <UnitHouseholdPanel
                      key={toId(selectedUnit.id)}
                      societyId={effectiveSocietyId}
                      unitId={toNumber(selectedUnit.id)}
                    />
                  </>
                ) : (
                  <button type="button" onClick={openUnitDetailsForm} className="btn-primary">
                    Add unit details
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
