import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/api";
import type { Permissions } from "@/lib/permissions";

export type AuthUser = {
  id?: number;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: "SUPER_ADMIN" | "SOCIETY_ADMIN" | "MEMBER" | null;
  isActive?: boolean | null;
  societyId?: number | null;
  firebaseUid?: string | null;
  language?: "en" | "mr" | null;
  permissions?: Permissions | null;
  mustChangePassword?: boolean;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    // Sends the current Firebase ID token; the first login links it to the user the admin added.
    login: builder.mutation<{ user: AuthUser }, void>({
      query: () => ({ url: "/v1/auth/login", method: "POST" }),
    }),
    // null clears the saved language, so the portal asks again on every visit.
    saveLanguage: builder.mutation<{ user: AuthUser }, "en" | "mr" | null>({
      query: (language) => ({ url: "/v1/auth/language", method: "PUT", body: { language } }),
    }),
    // Sets the same password on the email and mobile logins; clears the "must change password" flag.
    changePassword: builder.mutation<{ user: AuthUser }, string>({
      query: (password) => ({ url: "/v1/auth/password", method: "PUT", body: { password } }),
    }),
  }),
});

export const { useLoginMutation, useSaveLanguageMutation, useChangePasswordMutation } = authApi;

// Same as the backend's PHONE_LOGIN_DOMAIN: a mobile number signs in as <10 digits>@this domain.
const PHONE_LOGIN_DOMAIN = "phone.mysociety.invalid";

/** "Email or mobile" box → the Firebase login email; null if it's neither. */
export const toLoginEmail = (id: string) => {
  const value = id.trim();
  if (value.includes("@")) {
    return value.toLowerCase();
  }
  const digits = value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^\d{10}$/.test(digits) ? `${digits}@${PHONE_LOGIN_DOMAIN}` : null;
};

export const isPhoneLogin = (email: string) => email.endsWith(`@${PHONE_LOGIN_DOMAIN}`);
