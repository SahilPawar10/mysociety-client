"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/store";
import AuthInitializer from "@/components/auth/AuthInitializer";

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthInitializer />
      {children}
    </Provider>
  );
}
