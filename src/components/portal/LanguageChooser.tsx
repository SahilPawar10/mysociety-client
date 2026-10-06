"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useSaveLanguageMutation } from "@/lib/features/auth/authApi";
import {
  rememberSessionLanguage,
  sessionLanguageChosen,
  signedIn,
} from "@/lib/features/auth/authSlice";
import { errorMessage } from "@/lib/api";
import type { Lang } from "@/lib/i18n";

const OPTIONS: { value: Lang; label: string; hint: string }[] = [
  { value: "en", label: "English", hint: "Use the portal in English" },
  { value: "mr", label: "मराठी", hint: "पोर्टल मराठीत वापरा" },
];

/**
 * Asks for a language on each visit until the user saves one. Shown in both languages, since we
 * don't know yet which one they read. A saved choice is only changed from the profile page.
 */
export default function LanguageChooser() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const sessionLanguage = useAppSelector((s) => s.auth.sessionLanguage);
  const [remember, setRemember] = useState(true);
  const [saveLanguage, { isLoading }] = useSaveLanguageMutation();
  const [error, setError] = useState("");

  if (!user || user.language || sessionLanguage) {
    return null;
  }

  const choose = async (lang: Lang) => {
    setError("");
    if (!remember) {
      rememberSessionLanguage(lang);
      dispatch(sessionLanguageChosen(lang));
      return;
    }
    try {
      const { user: saved } = await saveLanguage(lang).unwrap();
      dispatch(signedIn(saved));
    } catch (err) {
      setError(errorMessage(err, "Could not save. Please try again. / जतन करता आले नाही."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
      <div className="card w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-slate-900">Choose your language</h2>
        <p className="text-lg font-semibold text-slate-900">तुमची भाषा निवडा</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={isLoading}
              onClick={() => choose(option.value)}
              className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-brand-500 hover:bg-brand-50 disabled:opacity-50"
            >
              <span className="block text-lg font-semibold text-slate-900">{option.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{option.hint}</span>
            </button>
          ))}
        </div>

        <label className="mt-5 flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5" />
          <span>
            Remember my choice (change it later from Profile)
            <br />
            माझी निवड लक्षात ठेवा (नंतर प्रोफाइलमधून बदलता येईल)
          </span>
        </label>

        {error && <p className="alert-error mt-4">{error}</p>}
      </div>
    </div>
  );
}
