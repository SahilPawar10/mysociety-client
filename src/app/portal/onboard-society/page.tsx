"use client";

import Link from "next/link";
import { useState } from "react";
import {
  usePurchaseSubscriptionMutation,
  useSetupSocietyMutation,
} from "@/lib/features/portal/portalApi";
import { useAppSelector } from "@/lib/hooks";
import { errorMessage } from "@/lib/api";
import { useT } from "@/lib/i18n";

const inputClass = "input";

const today = () => new Date().toISOString().slice(0, 10);
const nextYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

type Form = Record<
  | "planName"
  | "price"
  | "startDate"
  | "endDate"
  | "name"
  | "address"
  | "city"
  | "state"
  | "pincode"
  | "wingsCount"
  | "adminName"
  | "adminPhone"
  | "adminEmail",
  string
>;

const Field = ({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) => (
  <label className={`block ${wide ? "md:col-span-2" : ""}`}>
    <span className="label">{label}</span>
    {children}
  </label>
);

const Step = ({
  n,
  title,
  hint,
  children,
  disabled,
}: {
  n: number;
  title: string;
  hint: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <fieldset disabled={disabled} className="grid gap-6 p-6 md:grid-cols-[220px_1fr] disabled:opacity-60">
    <div className="flex gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
        {n}
      </span>
      <div>
        <p className="section-title">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-2">{children}</div>
  </fieldset>
);

/** Super admin: subscription → society + its SOCIETY_ADMIN (POST /subscription/purchase, then /society/setup). */
export default function OnboardSocietyPage() {
  const t = useT();
  const isSuperAdmin = useAppSelector((state) => state.auth.user?.role === "SUPER_ADMIN");
  const [purchase, { isLoading: isPurchasing }] = usePurchaseSubscriptionMutation();
  const [setupSociety, { isLoading: isSettingUp }] = useSetupSocietyMutation();

  const [form, setForm] = useState<Form>({
    planName: "Standard",
    price: "",
    startDate: today(),
    endDate: nextYear(),
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    wingsCount: "",
    adminName: "",
    adminPhone: "",
    adminEmail: "",
  });
  // Kept when setup fails, so a retry reuses the subscription instead of buying another one.
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ name: string } | null>(null);

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!form.adminPhone.trim() && !form.adminEmail.trim()) {
      setError(t("Admin needs a phone or an email: they log in with it."));
      return;
    }

    try {
      let subId = subscriptionId;
      if (!subId) {
        const subscription = await purchase({
          planName: form.planName,
          price: Number(form.price),
          startDate: form.startDate,
          endDate: form.endDate,
          status: "ACTIVE",
        }).unwrap();
        subId = Number(subscription.id);
        setSubscriptionId(subId);
      }

      await setupSociety({
        subscriptionId: subId,
        name: form.name,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        wingsCount: form.wingsCount ? Number(form.wingsCount) : undefined,
        admin: {
          name: form.adminName,
          phone: form.adminPhone.trim() || undefined,
          email: form.adminEmail.trim() || undefined,
        },
      }).unwrap();

      setDone({ name: form.name });
      setSubscriptionId(null);
    } catch (err) {
      setError(errorMessage(err, t("Onboarding failed.")));
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="alert-warn">
        {t("Only SUPER_ADMIN can onboard a society.")}
      </div>
    );
  }

  if (done) {
    return (
      <section className="max-w-2xl">
        <div className="card p-8 space-y-3 text-slate-700">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-lg text-emerald-600">✓</span>
          <h2 className="page-title">{t("Society onboarded")}</h2>
          <p>
            {t("{name} is ready. Its admin can now sign in with the phone/email you entered, then import units and residents from the dashboard.", { name: done.name })}
          </p>
          <div className="flex gap-3 pt-2">
            <Link href="/portal" className="btn-primary">
              {t("Go to dashboard")}
            </Link>
            <button
              type="button"
              onClick={() => setDone(null)}
              className="btn-secondary"
            >
              {t("Onboard another")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const busy = isPurchasing || isSettingUp;

  return (
    <section className="space-y-6 max-w-4xl">
      <div>
        <h2 className="page-title">{t("Onboard a society")}</h2>
        <p className="page-subtitle">
          {t("Creates the subscription, the society and its admin in one go. The admin then signs in and imports flats and residents.")}
        </p>
      </div>

      <form onSubmit={onSubmit} className="card divide-y divide-slate-100">
        <Step n={1} title={t("Subscription")} hint={t("The plan this society pays for.")} disabled={subscriptionId !== null}>
          <Field label={t("Plan name")}>
            <input value={form.planName} onChange={set("planName")} required className={inputClass} />
          </Field>
          <Field label={t("Price (₹)")}>
            <input type="number" min="0" value={form.price} onChange={set("price")} required className={inputClass} />
          </Field>
          <Field label={t("Start date")}>
            <input type="date" value={form.startDate} onChange={set("startDate")} required className={inputClass} />
          </Field>
          <Field label={t("End date")}>
            <input type="date" value={form.endDate} onChange={set("endDate")} required className={inputClass} />
          </Field>
          {subscriptionId ? (
            <p className="md:col-span-2 hint">
              {t("Subscription #{id} is already created; submitting again reuses it.", { id: subscriptionId })}
            </p>
          ) : null}
        </Step>

        <Step n={2} title={t("Society")} hint={t("Name and address residents will recognise.")}>
          <Field label={t("Society name")} wide>
            <input value={form.name} onChange={set("name")} required className={inputClass} placeholder={t("e.g. Green Valley CHS")} />
          </Field>
          <Field label={t("Address")} wide>
            <textarea value={form.address} onChange={set("address")} className={inputClass} rows={2} />
          </Field>
          <Field label={t("City")}>
            <input value={form.city} onChange={set("city")} className={inputClass} />
          </Field>
          <Field label={t("State")}>
            <input value={form.state} onChange={set("state")} className={inputClass} />
          </Field>
          <Field label={t("Pincode")}>
            <input value={form.pincode} onChange={set("pincode")} className={inputClass} inputMode="numeric" />
          </Field>
          <Field label={t("Max wings")}>
            <input type="number" min="0" value={form.wingsCount} onChange={set("wingsCount")} className={inputClass} placeholder={t("No limit")} />
          </Field>
        </Step>

        <Step n={3} title={t("Society admin")} hint={t("Signs in with this mobile (OTP) or email.")}>
          <Field label={t("Full name")} wide>
            <input value={form.adminName} onChange={set("adminName")} required className={inputClass} />
          </Field>
          <Field label={t("Mobile")}>
            <input type="tel" value={form.adminPhone} onChange={set("adminPhone")} placeholder="98765 43210" className={inputClass} />
          </Field>
          <Field label={t("Email")}>
            <input type="email" value={form.adminEmail} onChange={set("adminEmail")} placeholder="admin@example.com" className={inputClass} />
          </Field>
        </Step>

        <div className="flex items-center justify-end gap-4 p-6">
          {error ? <p className="alert-error mr-auto">{error}</p> : null}
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? t("Saving...") : t("Create society")}
          </button>
        </div>
      </form>
    </section>
  );
}
