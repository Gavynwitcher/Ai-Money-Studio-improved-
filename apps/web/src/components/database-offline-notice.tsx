type DatabaseOfflineNoticeProps = {
  area: string;
};

export default function DatabaseOfflineNotice({ area }: DatabaseOfflineNoticeProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-amber-300 bg-amber-50 p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-amber-900">{area}</h2>
        <p className="mt-3 text-sm text-amber-800">
          Database is currently offline. Start PostgreSQL at <code>localhost:5432</code> to load live data.
        </p>
      </div>
      <div className="rounded-2xl border border-amber-300 bg-white p-6 text-sm text-amber-900">
        Temporary fallback is active for Money Copilot routes. Legacy research routes require database connectivity.
      </div>
    </section>
  );
}
