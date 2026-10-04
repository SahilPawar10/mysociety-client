import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000",
  prepareHeaders: async (headers) => {
    // ID tokens expire after 1 hour; Firebase refreshes them, so always ask it instead of storing one.
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

/** Shared by every API slice. A 401 means the session is gone: sign out (AuthInitializer clears state). */
export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 && auth.currentUser) {
    await signOut(auth);
  }
  return result;
};

/** The backend's `{ message }` (or a Firebase error message), else the fallback. */
export const errorMessage = (error: unknown, fallback = "Something went wrong.") => {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }
  if ("data" in error) {
    const data = (error as { data?: { message?: unknown } }).data;
    if (typeof data?.message === "string") {
      return data.message;
    }
  }
  if ("message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
