"use client";

import { useMemo, useState } from "react";
import {
  useCreateResourceMutation,
  useCreateUnitMembershipMutation,
  useGetResourceListQuery,
  useGetUnitMembershipHistoryQuery,
  useUpdateResourceMutation,
  type ResourceRecord,
} from "@/lib/features/portal/portalApi";
import { useAppSelector } from "@/lib/hooks";
import { useDispatch } from "react-redux";
import { portalApi } from "@/lib/features/portal/portalApi";

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
  const dispatch = useDispatch();
  const role = String(user?.role ?? "").toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isSocietyAdmin = role === "SOCIETY_ADMIN";

  const [selectedSocietyId, setSelectedSocietyId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [unitModalView, setUnitModalView] = useState<
    "list" | "form" | "family-form" | "create-unit" | "edit-unit" | "history"
  >("list");
  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberType, setMemberType] = useState("OWNER");
  const [memberRelation, setMemberRelation] = useState("");
  const [memberPrimary, setMemberPrimary] = useState(false);
  const [memberActive, setMemberActive] = useState(true);
  const [memberStartDate, setMemberStartDate] = useState("");
  const [memberEndDate, setMemberEndDate] = useState("");
  const [familyMembershipId, setFamilyMembershipId] = useState("");
  const [familyMemberFirstName, setFamilyMemberFirstName] = useState("");
  const [familyMemberMiddleName, setFamilyMemberMiddleName] = useState("");
  const [familyMemberLastName, setFamilyMemberLastName] = useState("");
  const [familyMemberFamilyName, setFamilyMemberFamilyName] = useState("");
  const [familyMemberRelation, setFamilyMemberRelation] = useState("");
  const [familyMemberAge, setFamilyMemberAge] = useState("");
  const [familyMemberGender, setFamilyMemberGender] = useState("");
  const [familyMemberPhone, setFamilyMemberPhone] = useState("");
  const [familyMemberEmail, setFamilyMemberEmail] = useState("");
  const [familyMemberActive, setFamilyMemberActive] = useState(true);
  const [familyFirstName, setFamilyFirstName] = useState("");
  const [familyMiddleName, setFamilyMiddleName] = useState("");
  const [familyLastName, setFamilyLastName] = useState("");
  const [familyName, setFamilyName] = useState("");
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

  const { data: units = [], isLoading } = useGetResourceListQuery(
    { resource: "unit", societyId: effectiveSocietyId || undefined },
    { skip: !effectiveSocietyId },
  );

  const { data: wings = [] } = useGetResourceListQuery(
    { resource: "wing", societyId: effectiveSocietyId || undefined },
    { skip: !effectiveSocietyId },
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
  const [createResource, { isLoading: isAddingMember }] =
    useCreateUnitMembershipMutation();
  const [createUnitResource, { isLoading: isCreatingUnit }] =
    useCreateResourceMutation();
  const [createFamilyMemberResource, { isLoading: isAddingFamilyMember }] =
    useCreateResourceMutation();
  const [updateResource, { isLoading: isUpdatingUnit }] =
    useUpdateResourceMutation();

  const selectedSociety = useMemo(
    () => societies.find((s) => toNumber(s.id) === effectiveSocietyId),
    [societies, effectiveSocietyId],
  );

  const unitsCount = toNumber(selectedSociety?.unitsCount);

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

  const selectedMembers = useMemo(() => {
    if (!selectedUnitId) {
      return [];
    }
    return selectedUnitId ? (membersByUnitId.get(selectedUnitId) ?? []) : [];
  }, [membersByUnitId, selectedUnitId]);
  const selectedUnitIdNumber = toNumber(selectedUnit?.id);
  const { data: residentHistoryData, isLoading: isHistoryLoading } =
    useGetUnitMembershipHistoryQuery(
      {
        societyId: effectiveSocietyId,
        unitId: selectedUnitIdNumber,
      },
      {
        skip: !effectiveSocietyId || !selectedUnit || !selectedUnitIdNumber,
      },
    );

  const residentHistory = residentHistoryData?.allMemberships ?? [];
  const currentFamilyMembers = residentHistoryData?.currentFamilyMembers ?? [];
  const previousFamilyMembers =
    residentHistoryData?.previousFamilyMembers ?? [];
  const currentOccupancy = String(residentHistoryData?.currentOccupancy ?? "-");
  const currentOwnerName = String(
    residentHistoryData?.currentOwner?.userName ??
      residentHistoryData?.currentOwner?.name ??
      "-",
  );
  const currentTenantName = String(
    residentHistoryData?.currentTenant?.userName ??
      residentHistoryData?.currentTenant?.name ??
      "-",
  );
  const canEditUnit = isSuperAdmin || isSocietyAdmin;
  const hasActiveMembership = selectedMembers.length > 0;
  const canAddUnitMember = !hasActiveMembership;
  const activeMembershipForFamily = useMemo(() => {
    if (selectedMembers.length === 0) {
      return undefined;
    }
    return (
      selectedMembers.find((item) => Boolean(item.membership.isPrimary)) ??
      selectedMembers.find(
        (item) => String(item.membership.type) === "OWNER",
      ) ??
      selectedMembers.find(
        (item) => String(item.membership.type) === "TENANT",
      ) ??
      selectedMembers[0]
    );
  }, [selectedMembers]);

  const onAddMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const selectedUnitIdNumber = Number(selectedUnitId);

    if (
      !selectedUnitId ||
      !Number.isFinite(selectedUnitIdNumber) ||
      !effectiveSocietyId
    ) {
      setMessage("Select a valid unit and member.");
      return;
    }
    if (!memberName.trim()) {
      setMessage("Member name is required.");
      return;
    }
    if (!familyFirstName.trim() || !familyLastName.trim()) {
      setMessage("Primary family first name and last name are required.");
      return;
    }

    try {
      await createResource({
        societyId: effectiveSocietyId,
        unitId: selectedUnitIdNumber,
        type: memberType as "OWNER" | "TENANT",
        relation: memberRelation || null,
        isPrimary: memberPrimary,
        isActive: memberActive,
        startDate: memberStartDate || null,
        endDate: memberEndDate || null,
        user: {
          name: memberName.trim(),
          phone: memberPhone.trim() || undefined,
          email: memberEmail.trim() || undefined,
          role: "MEMBER",
          isActive: memberActive,
        },
        primaryFamily: {
          firstName: familyFirstName.trim(),
          middleName: familyMiddleName.trim() || undefined,
          lastName: familyLastName.trim(),
          familyName: familyName.trim() || undefined,
        },
      }).unwrap();

      setMessage("Member added successfully.");
      setMemberName("");
      setMemberPhone("");
      setMemberEmail("");
      setMemberType("OWNER");
      setMemberRelation("");
      setMemberPrimary(false);
      setMemberActive(true);
      setMemberStartDate("");
      setMemberEndDate("");
      setFamilyFirstName("");
      setFamilyMiddleName("");
      setFamilyLastName("");
      setFamilyName("");
      setUnitModalView("list");
      // refetch the data again
      dispatch(
        portalApi.util.invalidateTags([
          { type: "ResourceList", id: "user" },
          { type: "ResourceList", id: "unit-membership" },
          { type: "ResourceList", id: "unit-membership-history" },
        ]),
      );
    } catch (error) {
      setMessage(error as string);
    }
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
          parkingSlots: newUnitParkingSlots
            ? Number(newUnitParkingSlots)
            : null,
          areaSqft: newUnitAreaSqft ? Number(newUnitAreaSqft) : null,
        },
      }).unwrap();

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
      setMessage("Unit created successfully.");
    } catch {
      setMessage("Failed to create unit.");
    }
  };

  const onAddFamilyMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const selectedUnitMembershipId = Number(
      familyMembershipId || toId(activeMembershipForFamily?.membership.id),
    );
    if (
      !effectiveSocietyId ||
      !Number.isFinite(selectedUnitMembershipId) ||
      !familyMemberFirstName.trim() ||
      !familyMemberLastName.trim()
    ) {
      setMessage(
        "Select membership and provide family member first name and last name.",
      );
      return;
    }

    try {
      await createFamilyMemberResource({
        resource: "family-member",
        payload: {
          societyId: effectiveSocietyId,
          unitMembershipId: selectedUnitMembershipId,
          firstName: familyMemberFirstName.trim(),
          middleName: familyMemberMiddleName.trim() || null,
          lastName: familyMemberLastName.trim(),
          familyName: familyMemberFamilyName.trim() || null,
          relation: familyMemberRelation.trim() || null,
          age: familyMemberAge ? Number(familyMemberAge) : null,
          gender:
            familyMemberGender === "MALE" ||
            familyMemberGender === "FEMALE" ||
            familyMemberGender === "OTHER"
              ? familyMemberGender
              : null,
          phone: familyMemberPhone.trim() || null,
          email: familyMemberEmail.trim() || null,
          isActive: familyMemberActive,
        },
      }).unwrap();

      setFamilyMembershipId(toId(activeMembershipForFamily?.membership.id));
      setFamilyMemberFirstName("");
      setFamilyMemberMiddleName("");
      setFamilyMemberLastName("");
      setFamilyMemberFamilyName("");
      setFamilyMemberRelation("");
      setFamilyMemberAge("");
      setFamilyMemberGender("");
      setFamilyMemberPhone("");
      setFamilyMemberEmail("");
      setFamilyMemberActive(true);
      setUnitModalView("list");
      setMessage("Family member added successfully.");
    } catch {
      setMessage("Failed to add family member.");
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
        payload: {
          societyId: effectiveSocietyId,
          wingId: wingIdNumber,
          floorNumber,
          unitNumber: editUnitNumber.trim(),
          parkingSlots: editUnitParkingSlots
            ? Number(editUnitParkingSlots)
            : null,
          areaSqft: editUnitAreaSqft ? Number(editUnitAreaSqft) : null,
        },
      }).unwrap();
      setUnitModalView("list");
      setMessage("Unit updated successfully.");
    } catch {
      setMessage("Failed to update unit.");
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-rose-600">Units</h2>
          <p className="text-sm text-slate-500">
            Home-style view based on society unit count.
          </p>
        </div>
      </div>

      {isSuperAdmin ? (
        <div className="bg-white rounded-xl shadow-sm p-4 max-w-md">
          <label className="block text-sm font-medium mb-1">
            Select Society
          </label>
          <select
            value={selectedSocietyId}
            onChange={(e) => {
              setSelectedSocietyId(e.target.value);
              setSelectedUnitId(null);
              setUnitModalView("list");
            }}
            className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
          >
            <option value="">Select society</option>
            {societies.map((s) => (
              <option key={String(s.id)} value={String(s.id)}>
                {String(s.name ?? `Society ${s.id}`)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!effectiveSocietyId ? (
        <div className="bg-white rounded-xl shadow-sm p-6 text-slate-600">
          Select a society to view homes.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-slate-600">
            Planned units: <span className="font-semibold">{unitsCount}</span> |
            Created units:{" "}
            <span className="font-semibold">{sortedUnits.length}</span>
          </div>

          {isLoading ? (
            <p className="text-slate-600">Loading homes...</p>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
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
                    setUnitModalView("list");
                    setMessage("");
                  }}
                  className={`text-left bg-white rounded-xl shadow-sm p-3 border-2 transition ${
                    selectedUnitId === unitId && unitId
                      ? "border-rose-500"
                      : "border-transparent hover:border-rose-200"
                  }`}
                >
                  <div className="text-2xl">🏠</div>
                  <p className="font-semibold text-slate-800 mt-2">
                    {unit
                      ? String(unit.unitNumber ?? `Unit ${unit.id}`)
                      : `Home ${slot}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {unit
                      ? (wingNameById.get(toNumber(unit.wingId)) ?? "No wing")
                      : "Blank slot"}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Floor: {unit ? String(unit.floorNumber ?? "-") : "-"} |
                    Parking: {unit ? String(unit.parkingSlots ?? "-") : "-"}
                  </p>
                  <p className="text-xs text-rose-600 mt-1">
                    {unit
                      ? String(
                          primaryMembership?.membership.type ?? "No membership",
                        )
                      : "Available"}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
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
              className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center"
              onClick={() => {
                setSelectedUnitId(null);
                setUnitModalView("list");
              }}
            >
              <div
                className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-700">
                    Unit Members
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUnitId(null);
                      setUnitModalView("list");
                    }}
                    className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>

                <div className="text-sm text-slate-600">
                  Unit:{" "}
                  <span className="font-semibold">
                    {selectedUnit
                      ? String(selectedUnit.unitNumber ?? selectedUnit.id)
                      : selectedSlotNumber
                        ? `Home ${selectedSlotNumber}`
                        : "-"}
                  </span>{" "}
                  | Wing:{" "}
                  <span className="font-semibold">
                    {selectedUnit
                      ? (wingNameById.get(toNumber(selectedUnit.wingId)) ?? "-")
                      : "-"}
                  </span>
                  {" | "}Floor:{" "}
                  <span className="font-semibold">
                    {selectedUnit
                      ? String(selectedUnit.floorNumber ?? "-")
                      : "-"}
                  </span>
                  {" | "}Parking:{" "}
                  <span className="font-semibold">
                    {selectedUnit
                      ? String(selectedUnit.parkingSlots ?? "-")
                      : "-"}
                  </span>
                </div>

                {unitModalView === "list" ? (
                  <>
                    {selectedMembers.length === 0 ? (
                      <p className="text-slate-500">
                        No active members assigned.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedMembers.map((item, idx) => (
                          <div
                            key={`${toNumber(item.membership.id)}-${idx}`}
                            className="border border-slate-200 rounded-lg p-3"
                          >
                            <p className="font-medium text-slate-700">
                              {String(item.user?.name ?? "Unknown Member")}
                            </p>
                            <p className="text-sm text-slate-500">
                              Type: {String(item.membership.type ?? "-")} |
                              Relation:{" "}
                              {String(item.membership.relation ?? "-")}
                            </p>
                            <p className="text-sm text-slate-500">
                              Phone: {String(item.user?.phone ?? "-")} | Email:{" "}
                              {String(item.user?.email ?? "-")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pt-2">
                      {selectedUnit ? (
                        <div className="flex gap-2">
                          {canAddUnitMember ? (
                            <button
                              type="button"
                              onClick={() => {
                                setUnitModalView("form");
                                setMessage("");
                              }}
                              className="px-4 py-2 rounded-lg text-white bg-rose-500 hover:bg-rose-600"
                            >
                              Add Member
                            </button>
                          ) : null}
                          {hasActiveMembership ? (
                            <button
                              type="button"
                              onClick={() => {
                                const activeMembershipId = toId(
                                  activeMembershipForFamily?.membership.id,
                                );
                                setFamilyMembershipId(activeMembershipId);
                                setUnitModalView("family-form");
                                setMessage("");
                              }}
                              className="px-4 py-2 rounded-lg text-white bg-rose-500 hover:bg-rose-600"
                            >
                              Add Family Member
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setUnitModalView("history");
                              setMessage("");
                            }}
                            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
                          >
                            View History
                          </button>
                          {canEditUnit ? (
                            <button
                              type="button"
                              onClick={openEditUnitForm}
                              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
                            >
                              Edit Unit
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUnitModalView("create-unit");
                            setMessage("");
                            setNewUnitNumber(
                              selectedSlotNumber
                                ? `Home ${selectedSlotNumber}`
                                : "",
                            );
                          }}
                          className="px-4 py-2 rounded-lg text-white bg-rose-500 hover:bg-rose-600"
                        >
                          Add New Unit
                        </button>
                      )}
                    </div>
                    {message ? (
                      <p className="text-sm text-slate-600">{message}</p>
                    ) : null}
                  </>
                ) : unitModalView === "family-form" ? (
                  <form
                    onSubmit={onAddFamilyMember}
                    className="border-t pt-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-700">
                        Add Family Member
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setUnitModalView("list");
                          setMessage("");
                        }}
                        className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100"
                      >
                        Back to list
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1">
                          Active Membership ID
                        </label>
                        <input
                          type="text"
                          value={String(
                            familyMembershipId ||
                              toId(activeMembershipForFamily?.membership.id),
                          )}
                          readOnly
                          className="w-full px-3 py-2 border-b-2 border-slate-300 bg-slate-100 text-slate-700"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Linked to{" "}
                          {String(
                            activeMembershipForFamily?.membership.type ?? "-",
                          )}{" "}
                          -{" "}
                          {String(
                            activeMembershipForFamily?.user?.name ?? "Unknown",
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Relation</label>
                        <input
                          type="text"
                          value={familyMemberRelation}
                          onChange={(e) =>
                            setFamilyMemberRelation(e.target.value)
                          }
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">First Name</label>
                        <input
                          type="text"
                          value={familyMemberFirstName}
                          onChange={(e) =>
                            setFamilyMemberFirstName(e.target.value)
                          }
                          required
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Middle Name
                        </label>
                        <input
                          type="text"
                          value={familyMemberMiddleName}
                          onChange={(e) =>
                            setFamilyMemberMiddleName(e.target.value)
                          }
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Last Name</label>
                        <input
                          type="text"
                          value={familyMemberLastName}
                          onChange={(e) =>
                            setFamilyMemberLastName(e.target.value)
                          }
                          required
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Family Name
                        </label>
                        <input
                          type="text"
                          value={familyMemberFamilyName}
                          onChange={(e) =>
                            setFamilyMemberFamilyName(e.target.value)
                          }
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Age</label>
                        <input
                          type="number"
                          value={familyMemberAge}
                          onChange={(e) => setFamilyMemberAge(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Gender</label>
                        <select
                          value={familyMemberGender}
                          onChange={(e) =>
                            setFamilyMemberGender(e.target.value)
                          }
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        >
                          <option value="">Select Gender</option>
                          <option value="MALE">MALE</option>
                          <option value="FEMALE">FEMALE</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Phone</label>
                        <input
                          type="text"
                          value={familyMemberPhone}
                          onChange={(e) => setFamilyMemberPhone(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input
                          type="email"
                          value={familyMemberEmail}
                          onChange={(e) => setFamilyMemberEmail(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm mt-6">
                        <input
                          type="checkbox"
                          checked={familyMemberActive}
                          onChange={(e) =>
                            setFamilyMemberActive(e.target.checked)
                          }
                        />
                        Active
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={isAddingFamilyMember}
                      className={`px-4 py-2 rounded-lg text-white ${
                        isAddingFamilyMember
                          ? "bg-rose-300 cursor-not-allowed"
                          : "bg-rose-500 hover:bg-rose-600"
                      }`}
                    >
                      {isAddingFamilyMember ? "Adding..." : "Add Family Member"}
                    </button>
                    {message ? (
                      <p className="text-sm text-slate-600">{message}</p>
                    ) : null}
                  </form>
                ) : unitModalView === "history" ? (
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-700">
                        Resident History
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setUnitModalView("list");
                          setMessage("");
                        }}
                        className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100"
                      >
                        Back to list
                      </button>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                      <p>
                        Occupancy:{" "}
                        <span className="font-semibold text-slate-700">
                          {currentOccupancy}
                        </span>
                      </p>
                      <p>
                        Current Owner:{" "}
                        <span className="font-semibold text-slate-700">
                          {currentOwnerName}
                        </span>
                      </p>
                      <p>
                        Current Tenant:{" "}
                        <span className="font-semibold text-slate-700">
                          {currentTenantName}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600 space-y-2">
                      <p className="font-semibold text-slate-700">
                        Current Family Members
                      </p>
                      {currentFamilyMembers.length === 0 ? (
                        <p className="text-slate-500">
                          No active family members.
                        </p>
                      ) : (
                        currentFamilyMembers.map((member, idx) => (
                          <div
                            key={`${toNumber(member.id)}-${idx}`}
                            className="border border-slate-100 rounded p-2"
                          >
                            <p className="font-medium text-slate-700">
                              {`${String(member.firstName ?? "")} ${String(
                                member.middleName ?? "",
                              )} ${String(member.lastName ?? "")}`
                                .replace(/\s+/g, " ")
                                .trim() || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Relation: {String(member.relation ?? "-")} |
                              Phone: {String(member.phone ?? "-")} | Email:{" "}
                              {String(member.email ?? "-")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600 space-y-2">
                      <p className="font-semibold text-slate-700">
                        Previous Family Members
                      </p>
                      {previousFamilyMembers.length === 0 ? (
                        <p className="text-slate-500">
                          No previous family members.
                        </p>
                      ) : (
                        previousFamilyMembers.map((member, idx) => (
                          <div
                            key={`${toNumber(member.id)}-prev-${idx}`}
                            className="border border-slate-100 rounded p-2"
                          >
                            <p className="font-medium text-slate-700">
                              {`${String(member.firstName ?? "")} ${String(
                                member.middleName ?? "",
                              )} ${String(member.lastName ?? "")}`
                                .replace(/\s+/g, " ")
                                .trim() || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Relation: {String(member.relation ?? "-")} |
                              Phone: {String(member.phone ?? "-")} | Email:{" "}
                              {String(member.email ?? "-")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    {isHistoryLoading ? (
                      <p className="text-slate-600">Loading history...</p>
                    ) : residentHistory.length === 0 ? (
                      <p className="text-slate-500">
                        No resident history found.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {residentHistory.map((item, idx) => {
                          const name = String(
                            item.userName ??
                              (item.user as ResourceRecord | undefined)?.name ??
                              item.name ??
                              "Unknown Member",
                          );
                          const type = String(item.type ?? "-");
                          const relation = String(item.relation ?? "-");
                          const startDate = String(
                            item.startDate ?? item.start_date ?? "-",
                          );
                          const endDate = String(
                            item.endDate ?? item.end_date ?? "-",
                          );
                          const activeValue =
                            item.isActive ??
                            item.is_active ??
                            item.status ??
                            "-";

                          return (
                            <div
                              key={`${toNumber(item.id)}-${idx}`}
                              className="border border-slate-200 rounded-lg p-3"
                            >
                              <p className="font-medium text-slate-700">
                                {name}
                              </p>
                              <p className="text-sm text-slate-500">
                                Type: {type} | Relation: {relation}
                              </p>
                              <p className="text-sm text-slate-500">
                                Start: {startDate} | End: {endDate}
                              </p>
                              <p className="text-sm text-slate-500">
                                Status: {String(activeValue)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : unitModalView === "edit-unit" ? (
                  <form
                    onSubmit={onUpdateUnit}
                    className="border-t pt-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-700">Edit Unit</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setUnitModalView("list");
                          setMessage("");
                        }}
                        className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100"
                      >
                        Back to list
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Wing</label>
                        <select
                          value={editUnitWingId}
                          onChange={(e) => setEditUnitWingId(e.target.value)}
                          required
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
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
                        <label className="block text-sm mb-1">
                          Floor Number
                        </label>
                        <input
                          type="number"
                          value={editUnitFloorNumber}
                          onChange={(e) =>
                            setEditUnitFloorNumber(e.target.value)
                          }
                          required
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Unit Number
                        </label>
                        <input
                          type="text"
                          value={editUnitNumber}
                          onChange={(e) => setEditUnitNumber(e.target.value)}
                          required
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Parking Slots
                        </label>
                        <input
                          type="number"
                          value={editUnitParkingSlots}
                          onChange={(e) =>
                            setEditUnitParkingSlots(e.target.value)
                          }
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Area (Sqft)
                        </label>
                        <input
                          type="number"
                          value={editUnitAreaSqft}
                          onChange={(e) => setEditUnitAreaSqft(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isUpdatingUnit}
                      className={`px-4 py-2 rounded-lg text-white ${
                        isUpdatingUnit
                          ? "bg-rose-300 cursor-not-allowed"
                          : "bg-rose-500 hover:bg-rose-600"
                      }`}
                    >
                      {isUpdatingUnit ? "Updating..." : "Update Unit"}
                    </button>
                    {message ? (
                      <p className="text-sm text-slate-600">{message}</p>
                    ) : null}
                  </form>
                ) : unitModalView === "create-unit" ? (
                  <form
                    onSubmit={onCreateUnit}
                    className="border-t pt-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-700">
                        Add New Unit
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setUnitModalView("list");
                          setMessage("");
                        }}
                        className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100"
                      >
                        Back to list
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Wing</label>
                        <select
                          value={newUnitWingId}
                          onChange={(e) => setNewUnitWingId(e.target.value)}
                          required
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
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
                        <label className="block text-sm mb-1">
                          Floor Number
                        </label>
                        <input
                          type="number"
                          value={newUnitFloorNumber}
                          onChange={(e) =>
                            setNewUnitFloorNumber(e.target.value)
                          }
                          required
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Unit Number
                        </label>
                        <input
                          type="text"
                          value={newUnitNumber}
                          onChange={(e) => setNewUnitNumber(e.target.value)}
                          required
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Parking Slots
                        </label>
                        <input
                          type="number"
                          value={newUnitParkingSlots}
                          onChange={(e) =>
                            setNewUnitParkingSlots(e.target.value)
                          }
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Area (Sqft)
                        </label>
                        <input
                          type="number"
                          value={newUnitAreaSqft}
                          onChange={(e) => setNewUnitAreaSqft(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isCreatingUnit}
                      className={`px-4 py-2 rounded-lg text-white ${
                        isCreatingUnit
                          ? "bg-rose-300 cursor-not-allowed"
                          : "bg-rose-500 hover:bg-rose-600"
                      }`}
                    >
                      {isCreatingUnit ? "Creating..." : "Create Unit"}
                    </button>
                    {message ? (
                      <p className="text-sm text-slate-600">{message}</p>
                    ) : null}
                  </form>
                ) : (
                  <form
                    onSubmit={onAddMember}
                    className="border-t pt-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-700">Add Member</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setUnitModalView("list");
                          setMessage("");
                        }}
                        className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-100"
                      >
                        Back to list
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Name</label>
                        <input
                          type="text"
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          required
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Phone</label>
                        <input
                          type="text"
                          value={memberPhone}
                          onChange={(e) => setMemberPhone(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input
                          type="email"
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Type</label>
                        <select
                          value={memberType}
                          onChange={(e) => setMemberType(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        >
                          <option value="OWNER">OWNER</option>
                          <option value="TENANT">TENANT</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Relation</label>
                        <input
                          type="text"
                          value={memberRelation}
                          onChange={(e) => setMemberRelation(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div className="md:col-span-2 rounded-lg border border-rose-100 bg-rose-50/40 p-3">
                        <p className="text-sm font-medium text-rose-700 mb-2">
                          Primary Family Details
                        </p>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={familyFirstName}
                              onChange={(e) =>
                                setFamilyFirstName(e.target.value)
                              }
                              required
                              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1">
                              Middle Name
                            </label>
                            <input
                              type="text"
                              value={familyMiddleName}
                              onChange={(e) =>
                                setFamilyMiddleName(e.target.value)
                              }
                              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={familyLastName}
                              onChange={(e) =>
                                setFamilyLastName(e.target.value)
                              }
                              required
                              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                            />
                          </div>
                          <div>
                            <label className="block text-sm mb-1">
                              Family Name
                            </label>
                            <input
                              type="text"
                              value={familyName}
                              onChange={(e) => setFamilyName(e.target.value)}
                              className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Start Date</label>
                        <input
                          type="date"
                          value={memberStartDate}
                          onChange={(e) => setMemberStartDate(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">End Date</label>
                        <input
                          type="date"
                          value={memberEndDate}
                          onChange={(e) => setMemberEndDate(e.target.value)}
                          className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm mt-6">
                        <input
                          type="checkbox"
                          checked={memberPrimary}
                          onChange={(e) => setMemberPrimary(e.target.checked)}
                        />
                        Primary
                      </label>
                      <label className="flex items-center gap-2 text-sm mt-6">
                        <input
                          type="checkbox"
                          checked={memberActive}
                          onChange={(e) => setMemberActive(e.target.checked)}
                        />
                        Active
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={isAddingMember}
                      className={`px-4 py-2 rounded-lg text-white ${
                        isAddingMember
                          ? "bg-rose-300 cursor-not-allowed"
                          : "bg-rose-500 hover:bg-rose-600"
                      }`}
                    >
                      {isAddingMember ? "Adding..." : "Add Member"}
                    </button>
                    {message ? (
                      <p className="text-sm text-slate-600">{message}</p>
                    ) : null}
                  </form>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
