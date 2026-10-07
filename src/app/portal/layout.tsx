"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import { useAppSelector } from "@/lib/hooks";
import { RESOURCE_CONFIGS } from "@/lib/features/portal/resourceConfig";
import { useT } from "@/lib/i18n";
import LanguageChooser from "@/components/portal/LanguageChooser";

// What a MEMBER may open; the backend refuses the rest (users, memberships, family members…).
const MEMBER_RESOURCES = ["complaint", "maintenance-bill", "staff", "asset"];

const GROUPS: { title: string; keys: string[] }[] = [
  { title: "Society", keys: ["society", "subscription", "wing", "unit", "unit-membership", "family-member", "staff", "user"] },
  { title: "Maintenance", keys: ["maintenance-bill", "essential-service", "vendor"] },
  { title: "Finance", keys: ["accounts", "asset", "migration"] },
  { title: "Help desk", keys: ["complaint"] },
];

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  SOCIETY_ADMIN: "Society admin",
  MEMBER: "Resident",
};

type NavItem = { href: string; label: string };

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();

  const status = useAppSelector((state) => state.auth.status);
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";

  const sections = useMemo(() => {
    const allowed = RESOURCE_CONFIGS.filter((resource) => {
      if (isSuperAdmin) {
        return true;
      }
      if (role === "SOCIETY_ADMIN") {
        return resource.key !== "subscription";
      }
      return MEMBER_RESOURCES.includes(resource.key);
    });

    const overview: NavItem[] = [{ href: "/portal", label: t("Dashboard") }];
    if (isSuperAdmin) {
      overview.push({ href: "/portal/onboard-society", label: t("Onboard society") });
    }

    return [
      { title: t("Overview"), items: overview },
      ...GROUPS.map((group) => ({
        title: t(group.title),
        items: allowed
          .filter((resource) => group.keys.includes(resource.key))
          .map((resource) => ({ href: resource.path, label: t(resource.label) })),
      })),
      { title: t("Account"), items: [{ href: "/portal/profile", label: t("Profile") }] },
    ].filter((section) => section.items.length > 0);
  }, [isSuperAdmin, role, t]);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/signin");
    }
  }, [status, router]);

  // AuthInitializer resets state and the effect above redirects.
  const handleLogout = () => signOut(auth);

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-slate-500">
        <span className="h-5 w-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        {t("Loading your society...")}
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/portal" ? pathname === href : pathname.startsWith(href);
  const displayName = user?.name || user?.email || user?.phone || "User";
  // Residents only get their menu's pages; units, wings, setup, vendors… are admin-only (the API refuses them too).
  const allowedPage =
    role === "SUPER_ADMIN" ||
    role === "SOCIETY_ADMIN" ||
    sections.some((s) => s.items.some((item) => isActive(item.href)));

  return (
    <div className="min-h-screen md:flex">
      <LanguageChooser />
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            M
          </span>
          <span className="font-semibold text-slate-900">MySociety</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm transition ${
                      isActive(item.href)
                        ? "bg-brand-50 text-brand-800 font-medium"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
              {displayName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{displayName}</p>
              <p className="text-xs text-slate-500">{t(ROLE_LABEL[role ?? ""] ?? role ?? "")}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="btn-secondary w-full mt-3">
            {t("Log out")}
          </button>
        </div>
      </aside>

      {/* Mobile: top bar + scrollable menu */}
      <header className="md:hidden sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="font-semibold text-slate-900">MySociety</span>
          <button type="button" onClick={handleLogout} className="btn-ghost btn-sm">
            {t("Log out")}
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {sections.flatMap((section) => section.items).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
                isActive(item.href) ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {allowedPage ? (
            children
          ) : (
            <div className="card p-10 text-center">
              <p className="section-title">{t("Only society admins can open this page.")}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
