import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RESOURCE_CONFIG_MAP } from "./resourceConfig";

type ListResponse<T> = {
  success?: boolean;
  data?: T[];
  message?: string;
};

export type ResourceRecord = Record<string, unknown> & { id?: number | string };

export type DashboardStats = {
  societies: number;
  units: number;
  complaints: number;
  subscriptions: number;
};

export type ResourceMutationArg = {
  resource: string;
  id?: number | string;
  payload?: Record<string, unknown>;
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
};
export type UnitMembershipHistoryArg = {
  societyId: number;
  unitId: number;
};
export type UnitMembershipHistoryResponse = {
  unit?: ResourceRecord;
  currentOccupancy?: string;
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
  societyId: number;
  planName: string;
  price: number;
  startDate: string;
  endDate: string;
  status?: "ACTIVE" | "EXPIRED";
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

type ApiState = {
  auth: {
    token: string | null;
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

const buildListUrl = (resource: string, societyId?: number) => {
  const base = resolveResourceRoute(resource);
  if (needsSocietyInPath(resource) && societyId) {
    return `${base}/${societyId}`;
  }
  return base;
};

export const portalApi = createApi({
  reducerPath: "portalApi",
  tagTypes: ["Dashboard", "ResourceList"],
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as ApiState).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("content-type", "application/json");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      async queryFn(_arg, api, _extraOptions, baseQuery) {
        const state = api.getState() as ApiState;
        const userRole = String(state.auth.user?.role ?? "").toUpperCase();
        const userSocietyId = Number(state.auth.user?.societyId);

        const societyRes = await baseQuery({
          url: "/v1/society",
          method: "GET",
        });
        if (societyRes.error) {
          return { error: societyRes.error };
        }

        const societies = ((societyRes.data as ListResponse<ResourceRecord>)
          ?.data ?? []) as ResourceRecord[];
        const allSocietyIds = societies
          .map((item) => Number(item.id))
          .filter((id) => Number.isFinite(id));
        const scopedSocietyIds =
          userRole === "SUPER_ADMIN"
            ? allSocietyIds
            : Number.isFinite(userSocietyId)
              ? [userSocietyId]
              : [];

        if (scopedSocietyIds.length === 0) {
          return {
            data: {
              societies: societies.length,
              units: 0,
              complaints: 0,
              subscriptions: 0,
            },
          };
        }

        const requests = scopedSocietyIds.map((id) =>
          Promise.all([
            baseQuery({ url: buildListUrl("unit", id), method: "GET" }),
            baseQuery({ url: buildListUrl("complaint", id), method: "GET" }),
            baseQuery({ url: buildListUrl("subscription", id), method: "GET" }),
          ]),
        );
        const results = await Promise.all(requests);

        let units = 0;
        let complaints = 0;
        let subscriptions = 0;

        for (const [unitRes, complaintRes, subscriptionRes] of results) {
          if (unitRes.error) {
            return { error: unitRes.error };
          }
          if (complaintRes.error) {
            return { error: complaintRes.error };
          }
          if (subscriptionRes.error) {
            return { error: subscriptionRes.error };
          }
          units += ((unitRes.data as ListResponse<unknown>)?.data ?? []).length;
          complaints += (
            (complaintRes.data as ListResponse<unknown>)?.data ?? []
          ).length;
          subscriptions += (
            (subscriptionRes.data as ListResponse<unknown>)?.data ?? []
          ).length;
        }

        return {
          data: {
            societies: societies.length,
            units,
            complaints,
            subscriptions,
          },
        };
      },
      providesTags: ["Dashboard"],
    }),
    getResourceList: builder.query<ResourceRecord[], ResourceListArg>({
      query: ({ resource, societyId }) => ({
        url: buildListUrl(resource, societyId),
        method: "GET",
      }),
      transformResponse: (response: ListResponse<ResourceRecord>) =>
        response.data ?? [],
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
      invalidatesTags: [
        { type: "ResourceList", id: "unit-membership" },
        "Dashboard",
      ],
    }),
    updateResource: builder.mutation<ResourceRecord, ResourceMutationArg>({
      query: ({ resource, id, payload }) => ({
        url: `${resolveResourceRoute(resource)}/${id}`,
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
        query: ({ resource, id }) => ({
          url: `${resolveResourceRoute(resource)}/${id}`,
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
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetResourceListQuery,
  useGetUnitMembershipHistoryQuery,
  useCreateResourceMutation,
  useCreateUnitMembershipMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  usePurchaseSubscriptionMutation,
} = portalApi;
