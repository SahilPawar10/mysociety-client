import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/api";

export type AuthUser = {
  id?: number;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: "SUPER_ADMIN" | "SOCIETY_ADMIN" | "MEMBER" | null;
  isActive?: boolean | null;
  societyId?: number | null;
  firebaseUid?: string | null;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    // Sends the current Firebase ID token; the first login links it to the user the admin added.
    login: builder.mutation<{ user: AuthUser }, void>({
      query: () => ({ url: "/v1/auth/login", method: "POST" }),
    }),
  }),
});

export const { useLoginMutation } = authApi;
