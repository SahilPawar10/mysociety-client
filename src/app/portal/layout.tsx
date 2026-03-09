"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { logout } from "@/lib/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { RESOURCE_CONFIGS } from "@/lib/features/portal/resourceConfig";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const role = String(user?.role ?? "").toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";

  const menuItems = useMemo(() => {
    const base = [{ href: "/portal", label: "Dashboard" }];
    const filteredResources = RESOURCE_CONFIGS.filter((resource) => {
      if (isSuperAdmin) {
        return true;
      }
      return resource.key !== "subscription";
    }).map((resource) => ({
      href: resource.path,
      label: resource.label,
    }));

    const extra = isSuperAdmin ? [{ href: "/portal/purchase", label: "Purchase" }] : [];

    return [...base, ...filteredResources, ...extra, { href: "/portal/profile", label: "Profile" }];
  }, [isSuperAdmin]);

  const isAuthed = useMemo(() => {
    if (token) {
      return true;
    }

    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(localStorage.getItem("authData"));
  }, [token]);

  useEffect(() => {
    if (!isAuthed) {
      router.replace("/signin");
    }
  }, [isAuthed, router]);

  const handleLogout = () => {
    localStorage.removeItem("authData");
    dispatch(logout());
    router.push("/signin");
  };

  if (!isAuthed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex min-h-screen min-w-0">
        <aside className="w-72 bg-gradient-to-b from-rose-500 to-rose-700 text-white p-6 flex flex-col">
          <h1 className="text-2xl font-semibold tracking-wide mb-8">MySociety Portal</h1>
          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => {
              const active = item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg transition ${
                    active ? "bg-white text-rose-600 font-semibold" : "hover:bg-rose-400/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 bg-white text-rose-600 py-2 rounded-lg font-medium hover:bg-rose-100 transition"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 min-w-0 p-6 md:p-8 overflow-x-hidden">
          <header className="bg-white rounded-xl shadow-sm p-4 mb-6 flex justify-between items-center">
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="font-medium text-slate-700">
              {user?.name || user?.email || user?.phone || "User"}
            </p>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
