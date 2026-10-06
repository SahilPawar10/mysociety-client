"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useSaveLanguageMutation } from "@/lib/features/auth/authApi";
import { signedIn } from "@/lib/features/auth/authSlice";
import { errorMessage } from "@/lib/api";
import { useT } from "@/lib/i18n";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  SOCIETY_ADMIN: "Society admin",
  MEMBER: "Resident",
};

type LanguageChoice = "en" | "mr" | "ask";

export default function ProfilePage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const name = user?.name || t("User");
  const role = ROLE_LABEL[user?.role ?? ""];

  const [language, setLanguage] = useState<LanguageChoice>(user?.language ?? "ask");
  const [saveLanguage, { isLoading }] = useSaveLanguageMutation();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const rows: [string, string][] = [
    [t("Mobile"), user?.phone ? `+91 ${user.phone}` : "—"],
    [t("Email"), user?.email ?? "—"],
    [t("Role"), role ? t(role) : "—"],
    [t("Society ID"), user?.societyId ? String(user.societyId) : "—"],
  ];

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    try {
      const { user: saved } = await saveLanguage(language === "ask" ? null : language).unwrap();
      dispatch(signedIn(saved));
      setMessage({ ok: true, text: language === "mr" ? "भाषा जतन केली." : "Language saved." });
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err, t("Could not save. Please try again.")) });
    }
  };

  return (
    <section className="space-y-6 max-w-2xl">
      <h2 className="page-title">{t("Profile")}</h2>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-slate-100 p-6">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-semibold text-brand-800">
            {name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-900">{name}</p>
            <p className="text-sm text-slate-500">{role ? t(role) : ""}</p>
          </div>
        </div>
        <dl className="divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-3 gap-4 px-6 py-3.5 text-sm">
              <dt className="text-slate-500">{label}</dt>
              <dd className="col-span-2 text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="hint">
        {t("To change your mobile or email, ask your society admin: you sign in with these details.")}
      </p>

      <form onSubmit={save} className="card space-y-4 p-6">
        <div>
          <h3 className="section-title">Language / भाषा</h3>
          <p className="page-subtitle">{t("The portal is shown in the language you save here.")}</p>
        </div>
        <div className="space-y-2">
          {(
            [
              ["en", "English"],
              ["mr", "मराठी"],
              ["ask", "Ask me every visit / प्रत्येक वेळी विचारा"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="language" value={value} checked={language === value} onChange={() => setLanguage(value)} />
              {label}
            </label>
          ))}
        </div>
        {message && <p className={message.ok ? "alert-success" : "alert-error"}>{message.text}</p>}
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? t("Saving...") : t("Save")}
        </button>
      </form>
    </section>
  );
}
