import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { authApi } from "./authApi";

type AuthUser = {
  id?: string | number;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  societyId?: number;
  firebaseUid?: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string | null; user: AuthUser | null }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = Boolean(action.payload.token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.user = payload.user ?? null;
      state.isAuthenticated = Boolean(state.token);
    });
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
