"use client";

import { useGetDashboardStatsQuery } from "@/lib/features/portal/portalApi";

export default function PortalDashboardPage() {
  const { data, isLoading, isError, refetch } = useGetDashboardStatsQuery();

  if (isLoading) {
    return <p className="text-slate-600">Loading dashboard...</p>;
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-rose-600">Dashboard</h2>
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
          <p className="text-red-600">Failed to load dashboard data.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-rose-600">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-slate-500">Societies</p>
          <p className="text-3xl font-semibold mt-2">{data?.societies ?? 0}</p>
        </article>
        <article className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-slate-500">Units</p>
          <p className="text-3xl font-semibold mt-2">{data?.units ?? 0}</p>
        </article>
        <article className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-slate-500">Complaints</p>
          <p className="text-3xl font-semibold mt-2">{data?.complaints ?? 0}</p>
        </article>
        <article className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-slate-500">Subscriptions</p>
          <p className="text-3xl font-semibold mt-2">{data?.subscriptions ?? 0}</p>
        </article>
      </div>
    </section>
  );
}
