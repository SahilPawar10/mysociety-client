"use client";

import { useEffect } from "react";
import { onAuthStateChanged, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import { useAppDispatch } from "@/lib/hooks";
import { authApi } from "@/lib/features/auth/authApi";
import { signedIn, signedOut } from "@/lib/features/auth/authSlice";
import { portalApi } from "@/lib/features/portal/portalApi";
import { errorMessage } from "@/lib/api";

/** Firebase owns the session; on every sign-in we ask the backend who this person is. */
export default function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(
    () =>
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          dispatch(portalApi.util.resetApiState());
          dispatch(signedOut());
          return;
        }

        // Email/password accounts must verify the email first: the backend only trusts verified emails.
        if (firebaseUser.email && !firebaseUser.emailVerified && !firebaseUser.phoneNumber) {
          await sendEmailVerification(firebaseUser).catch(() => undefined);
          await signOut(auth);
          dispatch(
            signedOut(
              `Verify your email first: we sent a link to ${firebaseUser.email}. Then sign in again.`,
            ),
          );
          return;
        }

        try {
          const { user } = await dispatch(authApi.endpoints.login.initiate()).unwrap();
          dispatch(signedIn(user));
        } catch (error) {
          const message = errorMessage(error, "Login failed. Please try again.");
          await signOut(auth);
          dispatch(signedOut(message));
        }
      }),
    [dispatch],
  );

  return null;
}
