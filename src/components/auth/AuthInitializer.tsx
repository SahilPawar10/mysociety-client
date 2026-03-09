"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { setCredentials } from "@/lib/features/auth/authSlice";

type StoredAuth = {
  token: string | null;
  user: {
    id?: string | number;
    name?: string;
    phone?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    societyId?: number;
    firebaseUid?: string;
  } | null;
};

export default function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const raw = localStorage.getItem("authData");
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredAuth;
      dispatch(
        setCredentials({
          token: parsed.token,
          user: parsed.user,
        })
      );
    } catch {
      localStorage.removeItem("authData");
    }
  }, [dispatch]);

  return null;
}
