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
  staff: number;
  steps: {
    wingsCreated: boolean;
    structureImported: boolean;
    residentsImported: boolean;
    staffAdded: boolean;
    loginsActivated: boolean;
    previousDataMigrated: boolean;
  };
  nextStep: string | null;
};

/** Response of POST /v1/unit/import and /v1/unit-membership/import. */
export type ImportResult = {
  dryRun: boolean;
  skipped: { rowNumber: number; reason: string }[];
  // unit import
  insertedCount?: number;
  // resident import
  membershipsCreated?: number;
  usersCreated?: number;
  familyMembersCreated?: number;
  // debits history import
  vendorPayments?: number;
  expenses?: number;
};

export type ImportArg = {
  path:
    | "/v1/unit/import"
    | "/v1/unit-membership/import"
    | "/v1/asset/import"
    | "/v1/migration/maintenance/import"
    | "/v1/migration/credits/import"
    | "/v1/migration/debits/import";
  societyId: number;
  file: File;
  dryRun: boolean;
};

/** A fee on the maintenance setup form or a month's list. */
export type FeeHead = { name: string; amount: string };
export type MaintenanceItem = FeeHead & { id?: number; paid: boolean };
export type MaintenanceStatus = "PAID" | "PARTIAL" | "UNPAID";

/** GET /v1/maintenance-bill?month=YYYY-MM: every unit with its status for the month. */
export type MaintenanceSheet = {
  month: string;
  heads: FeeHead[];
  society: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    rules: string | null;
  };
  totals: { units: number; paid: number; partial: number; unpaid: number; due: number; collected: number };
  units: {
    unitId: number;
    wingName: string;
    unitNumber: string;
    floor: string;
    ownerName: string | null;
    tenantName: string | null;
    billId: number | null;
    billDate: string | null;
    amount: number;
    paidAmount: number;
    status: MaintenanceStatus;
    items: MaintenanceItem[];
  }[];
};

export type MaintenanceCredits = {
  from: string;
  to: string;
  credits: { category: string; amount: number }[];
  total: number;
};

/** A row of GET /v1/vendor/:societyId. */
export type Vendor = {
  id: number;
  serviceType: string;
  vendorType: "COMPANY" | "INDIVIDUAL";
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  paymentFrequency: "MONTHLY" | "QUARTERLY" | "YEARLY";
  paymentAmount: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
};

/** A debit entry (vendor payment or asset purchase), GET /v1/vendor/payments. */
export type DebitEntry = {
  id: number;
  vendorId: number | null;
  assetId?: number | null;
  amount: string;
  paymentDate: string;
  period: string | null;
  paymentMode: string | null;
  reference: string | null;
  note: string | null;
};

export type LedgerSource = "MAINTENANCE" | "OTHER_INCOME" | "EXPENSE" | "VENDOR_PAYMENT" | "ASSET_PURCHASE";

/** A line of GET /v1/ledger/credits or /debits; id is null for maintenance (one line per flat + fee). */
export type LedgerEntry = {
  source: LedgerSource;
  id: number | null;
  category: string;
  title: string;
  amount: number;
  date: string;
  // Credits: the flat ("A - 101") and its owner when the entry was saved.
  unit?: string | null;
  ownerName?: string | null;
};

type LedgerGroups = {
  groups: { source: LedgerSource; category: string; amount: number; count: number }[];
  total: number;
};

/** GET /v1/ledger/summary: the balance sheet. */
export type LedgerSummary = { from: string; to: string; credits: LedgerGroups; debits: LedgerGroups; net: number };

type LedgerArg = { societyId: number; from: string; to: string };

// The ledger reads maintenance, vendor payments, expenses and assets: any change there refreshes it.
const LEDGER_TAGS = [
  "Ledger" as const,
  "Debit" as const,
  "Maintenance" as const,
  { type: "ResourceList" as const, id: "society-expense" },
  { type: "ResourceList" as const, id: "asset" },
];

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
  tagTypes: ["Dashboard", "ResourceList", "Maintenance", "Debit", "Ledger"],
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
        const tags: Array<{ type: "ResourceList"; id: string } | "Dashboard" | "Debit"> =
          [{ type: "ResourceList", id: arg.resource }, "Dashboard"];
        if (arg.resource === "family-member") {
          tags.push({ type: "ResourceList", id: "unit-membership-history" });
        }
        // An asset bought with "Record as debit" adds a debit entry.
        if (arg.resource === "asset") {
          tags.push("Debit");
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
      // An import touches wings, units, users, memberships or (history imports) the accounts.
      invalidatesTags: (_result, _error, arg) =>
        arg.dryRun ? [] : ["ResourceList", "Dashboard", "Maintenance", "Debit", "Ledger"],
    }),
    /** Last year's closing balance, saved as an "Opening Balance" credit (a deficit as a debit). */
    setOpeningBalance: builder.mutation<
      unknown,
      { societyId: number; amount: string; date: string; title?: string; note?: string }
    >({
      query: ({ societyId, ...body }) => ({
        url: `/v1/migration/opening-balance?societyId=${societyId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Ledger", "Dashboard"],
    }),
    getMaintenanceSheet: builder.query<MaintenanceSheet, { societyId: number; month: string }>({
      query: ({ societyId, month }) => `/v1/maintenance-bill?societyId=${societyId}&month=${month}`,
      transformResponse: (response: { data: MaintenanceSheet }) => response.data,
      providesTags: ["Maintenance"],
    }),
    getFeeHeads: builder.query<FeeHead[], number>({
      query: (societyId) => `/v1/maintenance-bill/heads?societyId=${societyId}`,
      transformResponse: (response: { data: FeeHead[] }) => response.data,
      providesTags: ["Maintenance"],
    }),
    getMaintenanceCredits: builder.query<MaintenanceCredits, { societyId: number; from: string; to: string }>({
      query: ({ societyId, from, to }) =>
        `/v1/maintenance-bill/credits?societyId=${societyId}&from=${from}&to=${to}`,
      transformResponse: (response: { data: MaintenanceCredits }) => response.data,
      providesTags: ["Maintenance"],
    }),
    /** Saves the setup form (with receipt rules), or (with month) that month's own fee list; [] for a month resets it. */
    setFeeHeads: builder.mutation<
      unknown,
      { societyId: number; month?: string; heads: FeeHead[]; rules?: string }
    >({
      query: ({ societyId, month, heads, rules }) => ({
        url: `/v1/maintenance-bill/${month ? `month/${month}/heads` : "heads"}?societyId=${societyId}`,
        method: "PUT",
        body: { heads, rules },
      }),
      invalidatesTags: ["Maintenance"],
    }),
    saveMaintenanceEntry: builder.mutation<
      unknown,
      { societyId: number; unitId: number; month: string; items: MaintenanceItem[] }
    >({
      query: ({ societyId, ...body }) => ({
        url: `/v1/maintenance-bill?societyId=${societyId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Maintenance"],
    }),
    deleteMaintenanceEntry: builder.mutation<unknown, { societyId: number; id: number }>({
      query: ({ societyId, id }) => ({
        url: `/v1/maintenance-bill/${id}?societyId=${societyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Maintenance"],
    }),
    getDebitEntries: builder.query<DebitEntry[], number>({
      query: (societyId) => `/v1/vendor/payments?societyId=${societyId}`,
      transformResponse: (response: { data: DebitEntry[] }) => response.data,
      providesTags: ["Debit"],
    }),
    saveDebitEntry: builder.mutation<DebitEntry, Omit<DebitEntry, "id"> & { societyId: number }>({
      query: ({ societyId, ...body }) => ({
        url: `/v1/vendor/payments?societyId=${societyId}`,
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: DebitEntry }) => response.data,
      invalidatesTags: ["Debit"],
    }),
    deleteDebitEntry: builder.mutation<unknown, { societyId: number; id: number }>({
      query: ({ societyId, id }) => ({
        url: `/v1/vendor/payments/${id}?societyId=${societyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Debit"],
    }),
    getLedger: builder.query<LedgerEntry[], LedgerArg & { side: "credits" | "debits" }>({
      query: ({ societyId, side, from, to }) =>
        `/v1/ledger/${side}?societyId=${societyId}&from=${from}&to=${to}`,
      transformResponse: (response: { data: LedgerEntry[] }) => response.data,
      providesTags: LEDGER_TAGS,
    }),
    getLedgerSummary: builder.query<LedgerSummary, LedgerArg>({
      query: ({ societyId, from, to }) => `/v1/ledger/summary?societyId=${societyId}&from=${from}&to=${to}`,
      transformResponse: (response: { data: LedgerSummary }) => response.data,
      providesTags: LEDGER_TAGS,
    }),
    getLedgerCategories: builder.query<{ credits: string[]; debits: string[] }, number>({
      query: (societyId) => `/v1/ledger/categories?societyId=${societyId}`,
      transformResponse: (response: { data: { credits: string[]; debits: string[] } }) => response.data,
      providesTags: LEDGER_TAGS,
    }),
    saveCreditEntry: builder.mutation<unknown, { societyId: number; [field: string]: string | number }>({
      query: ({ societyId, ...body }) => ({
        url: `/v1/ledger/credits?societyId=${societyId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ledger"],
    }),
    deleteCreditEntry: builder.mutation<unknown, { societyId: number; id: number }>({
      query: ({ societyId, id }) => ({
        url: `/v1/ledger/credits/${id}?societyId=${societyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ledger"],
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
  useSetOpeningBalanceMutation,
  useExportFileMutation,
  useGetMaintenanceSheetQuery,
  useGetFeeHeadsQuery,
  useGetMaintenanceCreditsQuery,
  useSetFeeHeadsMutation,
  useSaveMaintenanceEntryMutation,
  useDeleteMaintenanceEntryMutation,
  useGetDebitEntriesQuery,
  useSaveDebitEntryMutation,
  useDeleteDebitEntryMutation,
  useGetLedgerQuery,
  useGetLedgerSummaryQuery,
  useGetLedgerCategoriesQuery,
  useSaveCreditEntryMutation,
  useDeleteCreditEntryMutation,
} = portalApi;
