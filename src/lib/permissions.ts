import { useAppSelector } from "@/lib/hooks";
import type { AuthUser } from "@/lib/features/auth/authApi";

// Same list as the backend (src/config/constant.ts); keys match RESOURCE_CONFIGS.
export const PERMISSION_MODULES = [
  "wing",
  "unit",
  "unit-membership",
  "family-member",
  "staff",
  "maintenance-bill",
  "essential-service",
  "vendor",
  "accounts",
  "asset",
  "complaint",
] as const;
export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete"] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type Permissions = Partial<Record<string, PermissionAction[]>>;

export const isAdminRole = (role?: string | null) =>
  role === "SUPER_ADMIN" || role === "SOCIETY_ADMIN";

/** What every member gets for their own household, whatever was granted (the API scopes it). */
const SELF_SERVICE: Permissions = {
  "family-member": ["view", "create", "edit"],
  "maintenance-bill": ["view"],
};

/** Admins can do everything; members only what the society admin granted, plus self-service. */
export const can = (user: AuthUser | null | undefined, module: string, action: PermissionAction) =>
  isAdminRole(user?.role) ||
  Boolean(user?.permissions?.[module]?.includes(action)) ||
  Boolean(user && SELF_SERVICE[module]?.includes(action));

export const useCan = () => {
  const user = useAppSelector((state) => state.auth.user);
  return (module: string, action: PermissionAction) => can(user, module, action);
};
