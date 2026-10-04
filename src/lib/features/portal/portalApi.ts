import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/api";
import { RESOURCE_CONFIG_MAP } from "./resourceConfig";

export type ResourceRecord = Record<string, unknown> & { id?: number | string };

/** GET /v1/society/:id/onboarding-status */
export type OnboardingStatus = {
  society: { id: number; name: string; wingsCount: number };
  wings: number;
  units: number;
  occupiedUnits: number;
  vacantUnits: number;
  users: number;
  activatedUsers: number;
  familyMembers: number;
  familyMembersWithLogin: number;
  steps: {
    structureImported: boolean;
    residentsImported: boolean;
    loginsActivated: boolean;
  };
  nextStep: string | null;
};

/** Response of POST /v1/unit/import and /v1/unit-membership/import. */
export type ImportResult = {
  dryRun: boolean;
  skipped: { rowNumber: number; reason: string }[];
  // unit import
  insertedCount?: number;
  wingsCreated?: string[];
  // resident import
  membershipsCreated?: number;
  usersCreated?: number;
  familyMembersCreated?: number;
};

export type ImportArg = {
  path: "/v1/unit/import" | "/v1/unit-membership/import";
  societyId: number;
  file: File;
  dryRun: boolean;
};

export type SetupSocietyPayload = {
  subscriptionId: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  wingsCount?: number;
  admin: { name: string; phone?: string; email?: string };
};

export type ResourceMutationArg = {
  resource: string;
  id?: number | string;
  payload?: Record<string, unknown>;
  // Needed by SUPER_ADMIN on update/delete: the backend can't tell which society the id belongs to.
  societyId?: number;
};
export type CreateUnitMembershipArg = {
  societyId: number;
  unitId: number;
  type: "OWNER" | "TENANT";
  relation?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  user?: {
    name: string;
    phone?: string;
    email?: string;
    role?: "MEMBER" | "SOCIETY_ADMIN" | "SUPER_ADMIN";
    isActive?: boolean;
  };
  primaryFamily?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    familyName?: string;
  };
};

export type ResourceListArg = {
  resource: string;
  societyId?: number;
  wingId?: number;
};
export type UnitMembershipHistoryArg = {
  societyId: number;
  unitId: number;
};
export type UnitMembershipHistoryResponse = {
  unit?: ResourceRecord;
  currentOccupancy?: string;
  currentResidentType?: "OWNER" | "TENANT" | null;
  currentResidentMembershipId?: number | null;
  currentOwner?: ResourceRecord | null;
  currentTenant?: ResourceRecord | null;
  currentFamilyMembers?: ResourceRecord[];
  previousFamilyMembers?: ResourceRecord[];
  allFamilyMembers?: ResourceRecord[];
  previousOwners?: ResourceRecord[];
  previousTenants?: ResourceRecord[];
  allMemberships?: ResourceRecord[];
};

export type PurchasePayload = {
  planName: string;
  price: number;
  startDate: string;
  endDate: string;
  status?: "ACTIVE" | "EXPIRED";
};

type ApiState = {
  auth: {
    user?: {
      role?: string | null;
      societyId?: number | null;
    } | null;
  };
};

const resolveResourceRoute = (resource: string) => {
  const route = RESOURCE_CONFIG_MAP[resource]?.apiRoute;
  if (!route) {
    throw new Error(`No API route configured for resource: ${resource}`);
  }
  return route;
};

const needsSocietyInPath = (resource: string) => {
  if (resource === "society") {
    return false;
  }
  return RESOURCE_CONFIG_MAP[resource]?.fields.some(
    (field) => field.name === "societyId",
  );
};

const buildListUrl = (
  resource: string,
  societyId?: number,
  wingId?: number,
) => {
  const base = resolveResourceRoute(resource);
  // Units are listed per society (GET /unit) or per wing (GET /unit/:wingId); the society always
  // goes in the query because the path segment is the wing.
  if (resource === "unit") {
    const query = societyId ? `?societyId=${societyId}` : "";
    return wingId ? `${base}/${wingId}${query}` : `${base}${query}`;
  }
  if (needsSocietyInPath(resource) && societyId) {
    return `${base}/${societyId}`;
  }
  return base;
};

// Anything that changes who lives in a unit refreshes these lists.
const HOUSEHOLD_TAGS = [
  { type: "ResourceList" as const, id: "unit-membership" },
  { type: "ResourceList" as const, id: "unit-membership-history" },
  { type: "ResourceList" as const, id: "user" },
  { type: "ResourceList" as const, id: "family-member" },
  "Dashboard" as const,
];

export const portalApi = createApi({
  reducerPath: "portalApi",
  tagTypes: ["Dashboard", "ResourceList"],
  baseQuery,
  endpoints: (builder) => ({
    getOnboardingStatus: builder.query<OnboardingStatus, number>({
      query: (societyId) => `/v1/society/${societyId}/onboarding-status`,
      transformResponse: (response: { data: OnboardingStatus }) => response.data,
      providesTags: ["Dashboard"],
    }),
    getResourceList: builder.query<ResourceRecord[], ResourceListArg>({
      async queryFn({ resource, societyId, wingId }, api, _extraOptions, baseQuery) {
        const user = (api.getState() as ApiState).auth.user;
        // GET /v1/society lists every society and is super-admin only; others read their own.
        const url =
          resource === "society" && user?.role !== "SUPER_ADMIN"
            ? `/v1/society/${user?.societyId}`
            : buildListUrl(resource, societyId, wingId);
        const result = await baseQuery(url);
        if (result.error) {
          return { error: result.error };
        }
        const data = (result.data as { data?: ResourceRecord | ResourceRecord[] }).data;
        return { data: Array.isArray(data) ? data : data ? [data] : [] };
      },
      providesTags: (_result, _error, arg) => [
        { type: "ResourceList", id: arg.resource },
      ],
    }),
    getUnitMembershipHistory: builder.query<
      UnitMembershipHistoryResponse,
      UnitMembershipHistoryArg
    >({
      query: ({ societyId, unitId }) => ({
        url: `/v1/unit-membership/${societyId}/unit/${unitId}/history`,
        method: "GET",
      }),
      transformResponse: (
        response:
          | { success?: boolean; data?: UnitMembershipHistoryResponse }
          | UnitMembershipHistoryResponse
          | ResourceRecord[],
      ) => {
        if (Array.isArray(response)) {
          return { allMemberships: response };
        }

        let res: UnitMembershipHistoryResponse;

        if ("data" in response) {
          res = response.data ?? {};
        } else {
          res = response as UnitMembershipHistoryResponse;
        }

        return {
          unit: res.unit ?? {},
          currentOccupancy: res.currentOccupancy,
          currentResidentType: res.currentResidentType ?? null,
          currentResidentMembershipId: res.currentResidentMembershipId ?? null,
          currentOwner: res.currentOwner ?? null,
          currentTenant: res.currentTenant ?? null,
          currentFamilyMembers: res.currentFamilyMembers ?? [],
          previousFamilyMembers: res.previousFamilyMembers ?? [],
          allFamilyMembers: res.allFamilyMembers ?? [],
          previousOwners: res.previousOwners ?? [],
          previousTenants: res.previousTenants ?? [],
          allMemberships: res.allMemberships ?? [],
        };
      },
      providesTags: (_result, _error, arg) => [
        { type: "ResourceList", id: "unit-membership-history" },
        { type: "ResourceList", id: `unit-membership-history-${arg.unitId}` },
      ],
    }),
    createResource: builder.mutation<ResourceRecord, ResourceMutationArg>({
      query: ({ resource, payload }) => ({
        url: resolveResourceRoute(resource),
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: { data?: ResourceRecord }) =>
        response.data ?? {},
      invalidatesTags: (_result, _error, arg) => {
        const tags: Array<{ type: "ResourceList"; id: string } | "Dashboard"> =
          [{ type: "ResourceList", id: arg.resource }, "Dashboard"];
        if (arg.resource === "family-member") {
          tags.push({ type: "ResourceList", id: "unit-membership-history" });
        }
        return tags;
      },
    }),
    createUnitMembership: builder.mutation<
      ResourceRecord,
      CreateUnitMembershipArg
    >({
      query: (arg) => ({
        url: resolveResourceRoute("unit-membership"),
        method: "POST",
        body: {
          societyId: arg.societyId,
          unitId: arg.unitId,
          type: arg.type,
          relation: arg.relation ?? null,
          isPrimary: Boolean(arg.isPrimary),
          isActive: arg.isActive ?? true,
          startDate: arg.startDate ?? null,
          endDate: arg.endDate ?? null,
          user: arg.user,
          primaryFamily: arg.primaryFamily,
        },
      }),
      transformResponse: (response: { data?: ResourceRecord }) =>
        response.data ?? {},
      invalidatesTags: HOUSEHOLD_TAGS,
    }),
    updateResource: builder.mutation<ResourceRecord, ResourceMutationArg>({
      query: ({ resource, id, payload, societyId }) => ({
        url: `${resolveResourceRoute(resource)}/${id}${societyId ? `?societyId=${societyId}` : ""}`,
        method: "PUT",
        body: payload,
      }),
      transformResponse: (response: { data?: ResourceRecord }) =>
        response.data ?? {},
      invalidatesTags: (_result, _error, arg) => {
        const tags: Array<{ type: "ResourceList"; id: string }> = [
          { type: "ResourceList", id: arg.resource },
        ];
        if (arg.resource === "family-member") {
          tags.push({ type: "ResourceList", id: "unit-membership-history" });
        }
        return tags;
      },
    }),
    deleteResource: builder.mutation<{ success: boolean }, ResourceMutationArg>(
      {
        query: ({ resource, id, societyId }) => ({
          url: `${resolveResourceRoute(resource)}/${id}${societyId ? `?societyId=${societyId}` : ""}`,
          method: "DELETE",
        }),
        transformResponse: () => ({ success: true }),
        invalidatesTags: (_result, _error, arg) => {
          const tags: Array<
            { type: "ResourceList"; id: string } | "Dashboard"
          > = [{ type: "ResourceList", id: arg.resource }, "Dashboard"];
          if (arg.resource === "family-member") {
            tags.push({ type: "ResourceList", id: "unit-membership-history" });
          }
          return tags;
        },
      },
    ),
    purchaseSubscription: builder.mutation<ResourceRecord, PurchasePayload>({
      query: (payload) => ({
        url: "/v1/subscription/purchase",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: { data?: ResourceRecord }) =>
        response.data ?? {},
      invalidatesTags: [
        { type: "ResourceList", id: "subscription" },
        "Dashboard",
      ],
    }),
    /** Tenant moves out / owner leaves (kept in history). */
    endMembership: builder.mutation<ResourceRecord, { id: number; societyId: number; endDate: string }>({
      query: ({ id, societyId, endDate }) => ({
        url: `/v1/unit-membership/${id}/end?societyId=${societyId}`,
        method: "POST",
        body: { endDate },
      }),
      invalidatesTags: HOUSEHOLD_TAGS,
    }),
    /** Extend a tenancy agreement to a new end date. */
    renewTenancy: builder.mutation<ResourceRecord, { id: number; societyId: number; endDate: string }>({
      query: ({ id, societyId, endDate }) => ({
        url: `/v1/unit-membership/${id}/renew?societyId=${societyId}`,
        method: "POST",
        body: { endDate },
      }),
      invalidatesTags: HOUSEHOLD_TAGS,
    }),
    /** Ownership transfer / new tenant: ends the current one on effectiveDate, starts the new one. */
    replaceHousehold: builder.mutation<ResourceRecord, CreateUnitMembershipArg & { effectiveDate: string }>({
      query: (body) => ({
        url: `/v1/unit-membership/replace?societyId=${body.societyId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: HOUSEHOLD_TAGS,
    }),
    setupSociety: builder.mutation<ResourceRecord, SetupSocietyPayload>({
      query: (payload) => ({
        url: "/v1/society/setup",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: { data?: ResourceRecord }) =>
        response.data ?? {},
      invalidatesTags: ["ResourceList", "Dashboard"],
    }),
    importFile: builder.mutation<ImportResult, ImportArg>({
      query: ({ path, societyId, file, dryRun }) => {
        const body = new FormData();
        body.append("file", file);
        return {
          url: `${path}?societyId=${societyId}&dryRun=${dryRun}`,
          method: "POST",
          body,
        };
      },
      transformResponse: (response: { data: ImportResult }) => response.data,
      // An import touches wings, units, users and memberships: refresh every list.
      invalidatesTags: (_result, _error, arg) =>
        arg.dryRun ? [] : ["ResourceList", "Dashboard"],
    }),
    exportFile: builder.mutation<Blob, string>({
      query: (url) => ({
        url,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetOnboardingStatusQuery,
  useGetResourceListQuery,
  useGetUnitMembershipHistoryQuery,
  useCreateResourceMutation,
  useCreateUnitMembershipMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  usePurchaseSubscriptionMutation,
  useSetupSocietyMutation,
  useEndMembershipMutation,
  useRenewTenancyMutation,
  useReplaceHouseholdMutation,
  useImportFileMutation,
  useExportFileMutation,
} = portalApi;
