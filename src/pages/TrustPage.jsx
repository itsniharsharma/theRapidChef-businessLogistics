import { Link } from 'react-router-dom'
import Button from '../components/Button'
import MarketingHeader from '../components/MarketingHeader'

const trustPillars = [
  'Owner-bound access controls and authenticated route protections',
  'Verified billing state gate before protected dashboard access',
  'Webhook-aware subscription state updates with idempotent processing',
  'Strong API defaults for headers, rate limits, and request tracing',
]

const trustStats = [
  { value: '99.95%', label: 'Target Availability' },
  { value: '<250ms', label: 'Target Core Response' },
  { value: 'Realtime', label: 'Order Visibility' },
]

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_80%_-10%,rgba(229,9,20,0.16),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(15,23,42,0.1),transparent_30%),#f7f8fc] text-slate-900">
      <MarketingHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_34px_rgba(15,23,42,0.08)] md:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Trust</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-900 md:text-5xl">Reliability designed for service hours, not just demos</h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-600 md:text-base">
            Trust is a product feature. Chef&apos;s Bud combines secure access, structured billing states, and resilient service paths so operations remain predictable.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {trustStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-red-100 bg-red-50/50 px-4 py-3">
                <p className="text-2xl font-bold text-[var(--primary)]">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-3">
          {trustPillars.map((item) => (
            <article key={item} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm text-slate-700">{item}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0f172a] p-6 text-white md:p-8">
          <h2 className="text-2xl font-bold md:text-3xl">Move forward with confidence</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">
            If your team values control and premium customer journeys, this platform is built for your operating style.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/plans">
              <Button className="px-7 py-3">Activate Business Plan</Button>
            </Link>
            <Link to="/contact">
              <Button variant="secondary" className="px-7 py-3">Talk to Team</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
