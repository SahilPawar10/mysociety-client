"use client";

import { useAppSelector } from "@/lib/hooks";

export default function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-rose-600">Profile</h2>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-3 max-w-xl">
        <p>
          <span className="font-medium">Name:</span> {user?.name ?? "-"}
        </p>
        <p>
          <span className="font-medium">Email:</span> {user?.email ?? "-"}
        </p>
        <p>
          <span className="font-medium">Phone:</span> {user?.phone ?? "-"}
        </p>
        <p>
          <span className="font-medium">Role:</span> {user?.role ?? "-"}
        </p>
        <p>
          <span className="font-medium">Society ID:</span> {user?.societyId ?? "-"}
        </p>
        <p>
          <span className="font-medium">Firebase UID:</span> {user?.firebaseUid ?? "-"}
        </p>
        <p className="text-sm text-slate-500">
          Backend currently has no `/v1/users/me` update route, so profile edit is disabled.
        </p>
      </div>
    </section>
  );
}
