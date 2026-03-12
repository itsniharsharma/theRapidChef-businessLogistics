export default function OffersPage() {
  return (
    <div className="space-y-5">
      <section className="card space-y-3 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">Module Status</p>
        <h2 className="text-2xl font-bold text-slate-900">Offers Section</h2>
        <p className="max-w-2xl text-sm text-slate-600">
          This section is temporarily paused and under development. Offer creation, validation,
          publishing, and management are disabled for now.
        </p>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Under Development: We will re-enable this module in a future release.
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-base font-semibold text-slate-900">Temporarily Disabled Features</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>AI offer drafting and prompt workflow</li>
          <li>Offer rule JSON validation and publishing</li>
          <li>Offer activation and deactivation controls</li>
          <li>Offer list management API integration</li>
        </ul>
      </section>
    </div>
  )
}
