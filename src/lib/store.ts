import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./features/auth/authApi";
import authReducer from "./features/auth/authSlice";
import { portalApi } from "./features/portal/portalApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [portalApi.reducerPath]: portalApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, portalApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
