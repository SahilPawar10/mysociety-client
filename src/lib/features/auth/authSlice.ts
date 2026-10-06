import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "./authApi";

type Lang = "en" | "mr";

type AuthState = {
  // "loading" until Firebase has restored (or not) the previous session.
  status: "loading" | "authenticated" | "anonymous";
  user: AuthUser | null;
  isAuthenticated: boolean;
  error: string | null;
  // Language picked for this visit only (user has no saved one). Kept per browser tab.
  sessionLanguage: Lang | null;
};

const SESSION_KEY = "portal-language";

const readSessionLanguage = (): Lang | null => {
  try {
    const value = typeof window === "undefined" ? null : window.sessionStorage.getItem(SESSION_KEY);
    return value === "en" || value === "mr" ? value : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  status: "loading",
  user: null,
  isAuthenticated: false,
  error: null,
  sessionLanguage: readSessionLanguage(),
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
    sessionLanguageChosen: (state, action: PayloadAction<Lang>) => {
      state.sessionLanguage = action.payload;
    },
  },
});

export const { signedIn, signedOut, clearAuthError, sessionLanguageChosen } = authSlice.actions;

export const rememberSessionLanguage = (lang: Lang) => {
  try {
    window.sessionStorage.setItem(SESSION_KEY, lang);
  } catch {
    // Private mode: the choice just lasts until reload.
  }
};
export default authSlice.reducer;
