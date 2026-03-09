import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type LoginRequest = {
  firebaseToken: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  phone?: string;
  name: string;
  role?: "SUPER_ADMIN" | "SOCIETY_ADMIN" | "MEMBER";
  societyId?: number;
  isActive?: boolean;
};

export type AuthResponse = {
  user?: {
    id?: number | string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    role?: string | null;
    isActive?: boolean | null;
    societyId?: number | null;
    firebaseUid?: string;
  };
  message?: string;
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

type ApiState = {
  auth: {
    token: string | null;
  };
};

export const authApi = createApi({
  reducerPath: "authApi",
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
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (payload) => ({
        url: "/v1/auth/register",
        method: "POST",
        body: payload,
      }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: ({ firebaseToken }) => ({
        url: "/v1/auth/login",
        method: "POST",
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
        },
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
