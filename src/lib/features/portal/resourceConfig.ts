export type FieldType =
  | "text"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "checkbox";

export type FieldOption = {
  label: string;
  value: string;
};

export type ResourceField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOption[];
  /** Text field: values offered while typing; anything else can still be typed. */
  suggestions?: string[];
};

export type TableColumn = {
  name: string;
  label: string;
  /** Computed cell text; otherwise the row value (relation ids are shown by name). */
  value?: (row: Record<string, unknown>) => string;
};

export type ResourceConfig = {
  key: string;
  label: string;
  path: string;
  description: string;
  apiRoute?: string;
  fields: ResourceField[];
  /** Table columns; defaults to the first form fields. */
  columns?: TableColumn[];
};

export const RESOURCE_CONFIGS: ResourceConfig[] = [
  {
    key: "society",
    label: "Societies",
    path: "/portal/society",
    description: "Manage society information.",
    apiRoute: "/v1/society",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "address", label: "Address", type: "textarea" },
      { name: "city", label: "City", type: "text" },
      { name: "state", label: "State", type: "text" },
      { name: "pincode", label: "Pincode", type: "text" },
      {
        name: "wingsCount",
        label: "Wings Count",
        type: "number",
        required: true,
      },
      // {
      //   name: "floorsCount",
      //   label: "Floors Count",
      //   type: "number",
      //   required: true,
      // },
      // {
      //   name: "unitsCount",
      //   label: "Units Count",
      //   type: "number",
      //   required: true,
      // },
    ],
  },
  {
    key: "subscription",
    label: "Subscriptions",
    path: "/portal/subscription",
    description: "Manage subscriptions per society.",
    apiRoute: "/v1/subscription",
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      { name: "planName", label: "Plan Name", type: "text", required: true },
      { name: "price", label: "Price", type: "number", required: true },
      { name: "startDate", label: "Start Date", type: "date", required: true },
      { name: "endDate", label: "End Date", type: "date", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { label: "ACTIVE", value: "ACTIVE" },
          { label: "EXPIRED", value: "EXPIRED" },
        ],
      },
    ],
  },
  {
    key: "wing",
    label: "Wings",
    path: "/portal/wing",
    description: "Manage wings for societies.",
    apiRoute: "/v1/wing",
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      { name: "name", label: "Wing Name", type: "text", required: true },
      { name: "floorsCount", label: "Floors", type: "number" },
      { name: "unitCount", label: "Max units (0 = no limit)", type: "number" },
    ],
  },
  {
    key: "unit",
    label: "Units",
    path: "/portal/unit",
    description: "Manage unit information.",
    apiRoute: "/v1/unit",
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      { name: "wingId", label: "Wing", type: "number", required: true },
      {
        name: "unitNumber",
        label: "Unit Number",
        type: "text",
        required: true,
      },
      { name: "floorNumber", label: "Floor (1, Ground, Parking…)", type: "text", required: true },
      { name: "parkingSlots", label: "Parking Slots", type: "text" },
      { name: "areaSqft", label: "Area (Sqft)", type: "number" },
    ],
  },
  {
    key: "unit-membership",
    label: "Unit Memberships",
    path: "/portal/unit-membership",
    description: "Manage unit memberships.",
    apiRoute: "/v1/unit-membership",
    columns: [
      { name: "userName", label: "Resident" },
      { name: "unit", label: "Unit", value: (r) => [r.wingName, r.roomNo].filter(Boolean).join(" - ") || "—" },
      { name: "type", label: "Type" },
      { name: "startDate", label: "From" },
      { name: "endDate", label: "To" },
      { name: "isActive", label: "Current" },
    ],
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      { name: "unitId", label: "Unit", type: "number", required: true },
      { name: "userName", label: "User Name", type: "text", required: true },
      { name: "userPhone", label: "Mobile (for login)", type: "text" },
      { name: "userEmail", label: "Email (if no mobile)", type: "text" },
      {
        name: "type",
        label: "Membership Type",
        type: "select",
        required: true,
        options: [
          { label: "OWNER", value: "OWNER" },
          { label: "TENANT", value: "TENANT" },
        ],
      },
      { name: "startDate", label: "From (owner since / agreement start)", type: "date" },
      { name: "endDate", label: "To (tenant agreement end)", type: "date" },
      { name: "relation", label: "Relation", type: "text" },
      {
        name: "primaryFirstName",
        label: "First Name",
        type: "text",
        required: true,
      },
      { name: "primaryMiddleName", label: "Middle Name", type: "text" },
      {
        name: "primaryLastName",
        label: "Last Name",
        type: "text",
        required: true,
      },
      { name: "primaryFamilyName", label: "Family Name", type: "text" },
      { name: "isPrimary", label: "Primary", type: "checkbox" },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
  },
  {
    key: "family-member",
    label: "Family Members",
    path: "/portal/family-member",
    description: "Manage family members linked to owner/tenant memberships.",
    apiRoute: "/v1/family-member",
    columns: [
      { name: "name", label: "Name", value: (r) => [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ") },
      { name: "relation", label: "Relation" },
      { name: "unitMembershipId", label: "Household" },
      { name: "phone", label: "Mobile" },
      { name: "age", label: "Age" },
      { name: "isActive", label: "Active" },
    ],
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      {
        name: "unitMembershipId",
        label: "Unit Membership",
        type: "number",
        required: true,
      },
      { name: "firstName", label: "First Name", type: "text", required: true },
      { name: "middleName", label: "Middle Name", type: "text" },
      { name: "lastName", label: "Last Name", type: "text", required: true },
      { name: "familyName", label: "Family Name", type: "text" },
      { name: "relation", label: "Relation", type: "text" },
      { name: "age", label: "Age", type: "number" },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: [
          { label: "MALE", value: "MALE" },
          { label: "FEMALE", value: "FEMALE" },
          { label: "OTHER", value: "OTHER" },
        ],
      },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "startDate", label: "Start Date", type: "date" },
      { name: "endDate", label: "End Date", type: "date" },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
  },
  {
    key: "maintenance-bill",
    label: "Monthly Maintenance",
    path: "/portal/maintenance-bill",
    description: "Monthly maintenance collection per unit (own page: app/portal/maintenance-bill).",
    apiRoute: "/v1/maintenance-bill",
    fields: [],
  },
  {
    key: "essential-service",
    label: "Essential Services",
    path: "/portal/essential-service",
    description: "Payments to vendors (own page: app/portal/essential-service).",
    fields: [],
  },
  {
    key: "vendor",
    label: "Vendors",
    path: "/portal/vendor",
    description:
      "Who provides the society's essential services. Changing a vendor? Set an end date and untick Active on the old one, then add the new one: old payments stay with the old vendor.",
    apiRoute: "/v1/vendor",
    columns: [
      { name: "serviceType", label: "Service" },
      { name: "name", label: "Name" },
      { name: "vendorType", label: "Type" },
      { name: "phone", label: "Mobile" },
      { name: "paymentFrequency", label: "Pays" },
      { name: "paymentAmount", label: "Amount" },
      { name: "period", label: "Period", value: (r) => `${r.startDate ?? "—"} → ${r.endDate ?? "now"}` },
      { name: "isActive", label: "Active" },
    ],
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      {
        name: "serviceType",
        label: "Service type (Water, Security…)",
        type: "text",
        required: true,
        suggestions: ["Water", "Security", "Housekeeping", "Electricity", "Lift", "Garden", "Pest Control", "Garbage Collection"],
      },
      {
        name: "vendorType",
        label: "Vendor type",
        type: "select",
        required: true,
        options: [
          { label: "Company", value: "COMPANY" },
          { label: "Single person", value: "INDIVIDUAL" },
        ],
      },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "phone", label: "Contact number", type: "text" },
      { name: "email", label: "Contact email", type: "text" },
      { name: "address", label: "Address", type: "textarea" },
      {
        name: "paymentFrequency",
        label: "Payment type",
        type: "select",
        required: true,
        options: [
          { label: "Monthly", value: "MONTHLY" },
          { label: "Quarterly", value: "QUARTERLY" },
          { label: "Yearly", value: "YEARLY" },
        ],
      },
      { name: "paymentAmount", label: "Payment amount", type: "number", required: true },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
  },
  {
    key: "society-expense",
    label: "Society Expenses",
    path: "/portal/society-expense",
    description: "Manage society expenses.",
    apiRoute: "/v1/society-expense",
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "category", label: "Category", type: "text" },
      { name: "amount", label: "Amount", type: "number", required: true },
      {
        name: "expenseDate",
        label: "Expense Date",
        type: "date",
        required: true,
      },
    ],
  },
  {
    key: "staff",
    label: "Committee & Staff",
    path: "/portal/staff",
    description: "Pick a person of this society and give them any title: President, Secretary, Treasurer…",
    apiRoute: "/v1/staff",
    // Name/mobile/email are copied from the picked person when saved.
    columns: [
      { name: "name", label: "Name" },
      { name: "designation", label: "Designation" },
      { name: "phone", label: "Mobile", value: (r) => String(r.phone ?? "—") },
      { name: "email", label: "Email", value: (r) => String(r.email ?? "—") },
      { name: "isActive", label: "Active" },
    ],
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      { name: "userId", label: "Person", type: "number", required: true },
      { name: "designation", label: "Designation (President, Secretary…)", type: "text", required: true },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
  },
  {
    key: "complaint",
    label: "Complaints",
    path: "/portal/complaint",
    description: "Manage complaints and status.",
    apiRoute: "/v1/complaint",
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      { name: "unitId", label: "Unit", type: "number", required: true },
      { name: "category", label: "Category", type: "text", required: true },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { label: "OPEN", value: "OPEN" },
          { label: "IN_PROGRESS", value: "IN_PROGRESS" },
          { label: "RESOLVED", value: "RESOLVED" },
        ],
      },
      { name: "adminRemark", label: "Admin Remark", type: "textarea" },
    ],
  },
  {
    key: "user",
    label: "Users",
    path: "/portal/user",
    description: "Manage society users.",
    apiRoute: "/v1/user",
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      { name: "name", label: "Full Name", type: "text", required: true },
      // The person logs in with this phone (OTP) or email; one of them is required.
      { name: "phone", label: "Mobile", type: "text" },
      { name: "email", label: "Email", type: "text" },
      {
        name: "role",
        label: "Role",
        type: "select",
        required: true,
        options: [
          { label: "SUPER_ADMIN", value: "SUPER_ADMIN" },
          { label: "SOCIETY_ADMIN", value: "SOCIETY_ADMIN" },
          { label: "MEMBER", value: "MEMBER" },
        ],
      },
      { name: "isActive", label: "Active", type: "checkbox" },
    ],
  },
];

export const RESOURCE_CONFIG_MAP = Object.fromEntries(
  RESOURCE_CONFIGS.map((item) => [item.key, item]),
) as Record<string, ResourceConfig>;

export const API_RESOURCE_KEYS = RESOURCE_CONFIGS.filter((r) =>
  Boolean(r.apiRoute),
).map((r) => r.key) as string[];
