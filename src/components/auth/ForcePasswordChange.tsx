"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import { useAppDispatch } from "@/lib/hooks";
import { useChangePasswordMutation } from "@/lib/features/auth/authApi";
import { signedIn } from "@/lib/features/auth/authSlice";
import { errorMessage } from "@/lib/api";
import { useT } from "@/lib/i18n";

const DEFAULT_PASSWORD = "pass@123";

/** Shown instead of the portal after an admin reset the password to the default one. */
export default function ForcePasswordChange() {
  const t = useT();
  const dispatch = useAppDispatch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [changePassword] = useChangePasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      return setError(t("Password must be at least 6 characters."));
    }
    if (password === DEFAULT_PASSWORD) {
      return setError(t("Choose a password different from the default one."));
    }
    if (password !== confirm) {
      return setError(t("Passwords don't match."));
    }
    if (!auth.currentUser) {
      return;
    }
    const loginEmail = auth.currentUser.email;
    setSaving(true);
    setError("");
    try {
      // The backend sets it on the email and mobile logins; that ends the current session, so sign in again.
      const { user } = await changePassword(password).unwrap();
      if (loginEmail) {
        await signInWithEmailAndPassword(auth, loginEmail, password);
      }
      dispatch(signedIn(user));
    } catch (err) {
      setError(errorMessage(err, t("Couldn't change the password. Sign in again and retry.")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-6 space-y-4">
        <div>
          <h2 className="section-title">{t("Set a new password")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("Your password was reset by your society admin. Choose a new one to continue.")}
          </p>
        </div>
        <input
          type="password"
          autoComplete="new-password"
          className="input"
          placeholder={t("New password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          autoComplete="new-password"
          className="input"
          placeholder={t("Confirm new password")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error ? <p className="alert-error">{error}</p> : null}
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? t("Saving...") : t("Save password")}
        </button>
        <button type="button" onClick={() => signOut(auth)} className="btn-ghost w-full">
          {t("Log out")}
        </button>
      </form>
    </div>
  );
}
