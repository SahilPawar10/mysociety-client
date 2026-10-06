import { useCallback } from "react";
import { useAppSelector } from "@/lib/hooks";
import { mr } from "./mr";

export type Lang = "en" | "mr";

export type TFunction = (text: string, vars?: Record<string, string | number>) => string;

/**
 * English text is the key: t("Save") → "जतन करा" in Marathi, unchanged in English.
 * A missing Marathi entry falls back to English. `{name}` placeholders are filled from vars.
 */
export const translate = (lang: Lang, text: string, vars?: Record<string, string | number>) => {
  const s = lang === "mr" ? (mr[text] ?? text) : text;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
};

/** Saved preference wins; otherwise this visit's pick; otherwise English. */
export const useLang = (): Lang =>
  useAppSelector((s) => s.auth.user?.language ?? s.auth.sessionLanguage ?? "en");

export const useT = (): TFunction => {
  const lang = useLang();
  return useCallback<TFunction>((text, vars) => translate(lang, text, vars), [lang]);
};
