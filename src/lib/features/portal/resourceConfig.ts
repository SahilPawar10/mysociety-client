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
};

export type ResourceConfig = {
  key: string;
  label: string;
  path: string;
  description: string;
  apiRoute?: string;
  fields: ResourceField[];
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
      {
        name: "floorsCount",
        label: "Floors Count",
        type: "number",
        required: true,
      },
      {
        name: "unitsCount",
        label: "Units Count",
        type: "number",
        required: true,
      },
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
        name: "floorNumber",
        label: "Floor Number",
        type: "number",
        required: true,
      },
      {
        name: "unitNumber",
        label: "Unit Number",
        type: "text",
        required: true,
      },
      { name: "parkingSlots", label: "Parking Slots", type: "number" },
      { name: "areaSqft", label: "Area (Sqft)", type: "number" },
    ],
  },
  {
    key: "unit-membership",
    label: "Unit Memberships",
    path: "/portal/unit-membership",
    description: "Manage unit memberships.",
    apiRoute: "/v1/unit-membership",
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      { name: "unitId", label: "Unit", type: "number", required: true },
      { name: "userName", label: "User Name", type: "text", required: true },
      { name: "userPhone", label: "User Phone", type: "text" },
      { name: "userEmail", label: "User Email", type: "text" },
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
    label: "Maintenance Bills",
    path: "/portal/maintenance-bill",
    description: "Manage maintenance bills.",
    apiRoute: "/v1/maintenance-bill",
    fields: [
      { name: "societyId", label: "Society", type: "number", required: true },
      { name: "unitId", label: "Unit", type: "number", required: true },
      { name: "month", label: "Month (YYYY-MM)", type: "text", required: true },
      { name: "amount", label: "Amount", type: "number", required: true },
      { name: "dueDate", label: "Due Date", type: "date", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { label: "GENERATED", value: "GENERATED" },
          { label: "PARTIAL", value: "PARTIAL" },
          { label: "PAID", value: "PAID" },
        ],
      },
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
      { name: "createdBy", label: "Created By", type: "number" },
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
      {
        name: "raisedByUserId",
        label: "Raised By",
        type: "number",
        required: true,
      },
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
      { name: "firstName", label: "First Name", type: "text", required: true },
      { name: "middleName", label: "Middle Name", type: "text" },
      { name: "lastName", label: "Last Name", type: "text", required: true },
      { name: "familyName", label: "Family Name", type: "text" },
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
