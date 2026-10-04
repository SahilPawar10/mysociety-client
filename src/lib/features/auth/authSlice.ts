import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "./authApi";

type AuthState = {
  // "loading" until Firebase has restored (or not) the previous session.
  status: "loading" | "authenticated" | "anonymous";
  user: AuthUser | null;
  isAuthenticated: boolean;
  error: string | null;
};

const initialState: AuthState = {
  status: "loading",
  user: null,
  isAuthenticated: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedIn: (state, action: PayloadAction<AuthUser>) => {
      state.status = "authenticated";
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    // Without a message the previous error stays: signOut() after a failed login fires this again.
    signedOut: (state, action: PayloadAction<string | undefined>) => {
      state.status = "anonymous";
      state.user = null;
      state.isAuthenticated = false;
      state.error = action.payload ?? state.error;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
});

export const { signedIn, signedOut, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
