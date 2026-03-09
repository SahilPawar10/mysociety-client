export default function SettingsPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-rose-600">Settings</h2>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-2 max-w-xl">
        <p className="text-slate-700">No settings routes are available in backend yet.</p>
        <p className="text-sm text-slate-500">
          Add routes in backend (for example `/v1/user-settings`) and then I will wire this page with RTK Query.
        </p>
      </div>
    </section>
  );
}
