import { Link } from 'react-router-dom'
import Button from '../components/Button'
import MarketingHeader from '../components/MarketingHeader'

const channels = [
  {
    title: 'Email',
    value: 'itsnihars@gmail.com',
    href: 'mailto:itsnihars@gmail.com',
  },
  {
    title: 'Phone',
    value: '+91 9815454626',
    href: 'tel:+919815454626',
  },
]

const responsePromises = [
  'Onboarding guidance for setup and billing flow',
  'Configuration support for menu, table QR, and ops modules',
  'Priority troubleshooting for payment and launch blockers',
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_-10%,rgba(229,9,20,0.14),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(2,6,23,0.1),transparent_28%),#f7f8fb] text-slate-900">
      <MarketingHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_34px_rgba(15,23,42,0.08)] lg:col-span-7 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--primary)]">Contact</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight md:text-5xl">Speak with the team behind your next service upgrade</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
              From setup to live operations, we help you launch with control and keep performance consistent.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {channels.map((channel) => (
                <a key={channel.title} href={channel.href} className="rounded-2xl border border-red-100 bg-red-50/40 px-4 py-3 hover:bg-red-50">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">{channel.title}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{channel.value}</p>
                </a>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0f172a] p-6 text-white shadow-[0_24px_44px_rgba(2,6,23,0.35)] lg:col-span-5 md:p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-red-200">What You Get</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              {responsePromises.map((item) => (
                <li key={item} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">{item}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/plans">
                <Button className="px-6 py-3">Start Plan Setup</Button>
              </Link>
              <Link to="/overview">
                <Button variant="secondary" className="px-6 py-3">Back to Overview</Button>
              </Link>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
