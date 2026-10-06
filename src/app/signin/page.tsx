"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import loginBackground from "../../../public/mysoceitybg.jpg";
import { auth } from "../../../firebase";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearAuthError } from "@/lib/features/auth/authSlice";
import { errorMessage } from "@/lib/api";

/**
 * People never register here: the society admin adds them (import or form) with their email.
 * They sign in with that verified email (password or Google), and the backend links the account.
 * Mobile OTP login was removed from this page; the backend still accepts it if it comes back.
 */
export default function SignInPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const authError = useAppSelector((state) => state.auth.error);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNewPassword, setIsNewPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/portal");
    }
  }, [status, router]);

  // Firebase sign-in only; AuthInitializer then calls the backend and redirects or shows its error.
  const attempt = async (signIn: () => Promise<unknown>) => {
    setError("");
    dispatch(clearAuthError());
    setBusy(true);
    try {
      await signIn();
    } catch (err) {
      setError(errorMessage(err, "Sign in failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const emailLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return attempt(() =>
      isNewPassword
        ? createUserWithEmailAndPassword(auth, email, password)
        : signInWithEmailAndPassword(auth, email, password),
    );
  };

  const message = error || authError;
  const loading = busy || status === "loading";

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 text-white bg-cover bg-center"
        style={{ backgroundImage: `url(${loginBackground.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/95 via-brand-800/90 to-brand-700/80" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 font-bold backdrop-blur">
            M
          </span>
          <span className="text-lg font-semibold">MySociety</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">Your society, calmly organised.</h1>
          <p className="mt-3 text-brand-100">
            Flats, residents, maintenance and complaints in one place, for admins and residents alike.
          </p>
        </div>
        <p className="relative text-xs text-brand-200">© {new Date().getFullYear()} MySociety</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in with the email your society admin registered.
          </p>

          <div className="mt-8">
            <form onSubmit={emailLogin} className="space-y-3">
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
              />
              <input
                type="password"
                autoComplete={isNewPassword ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isNewPassword ? "Choose a password (min 6 characters)" : "Password"}
                required
                className="input"
              />
              <label className="flex items-start gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={isNewPassword}
                  onChange={(e) => setIsNewPassword(e.target.checked)}
                  className="mt-0.5"
                />
                First time here? Set a password. We&apos;ll email you a verification link.
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {isNewPassword ? "Create password" : "Sign in"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              OR
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => attempt(() => signInWithPopup(auth, new GoogleAuthProvider()))}
              disabled={loading}
              className="btn-secondary w-full"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
              </svg>
              Continue with Google
            </button>

            {message ? <p className="mt-4 alert-error">{message}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
