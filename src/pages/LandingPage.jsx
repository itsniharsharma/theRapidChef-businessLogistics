import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'

const slides = [
  {
    title: 'Elevate Every Shift Into Luxury Service',
    subtitle: "Chef's Bud orchestrates menu, tables, orders, and analytics into one executive command center.",
  },
  {
    title: 'Make Data-Led Decisions in Real Time',
    subtitle: 'Track performance minute-by-minute and optimize staffing, offers, and throughput with precision.',
  },
  {
    title: 'From First Scan to Final Bill, Flawless',
    subtitle: 'Deliver a frictionless guest journey while your floor and kitchen run in perfect sync.',
  },
]

const valueCards = [
  {
    title: 'Executive Control Tower',
    text: 'One premium workspace for tables, menu, orders, offers, and profit intelligence.',
  },
  {
    title: 'Signature Guest Journey',
    text: 'High-end QR ordering crafted for speed, comfort, and elevated dining perception.',
  },
  {
    title: 'Revenue Intelligence',
    text: 'Understand peak windows, high-margin dishes, and conversion patterns instantly.',
  },
]

const impacts = [
  { label: 'Average Service Speed Gain', value: '+37%' },
  { label: 'Order Accuracy Lift', value: '+42%' },
  { label: 'Offer Conversion Uplift', value: '+29%' },
  { label: 'Manager Time Saved', value: '3.5 hrs/day' },
]

const trustSignals = [
  'Multi-Restaurant Isolation',
  'Owner-Level Access Control',
  'Live Operational Visibility',
  'Premium Guest UX',
]

const testimonials = [
  {
    quote:
      'Chef\'s Bud gave us the confidence of a 50-outlet chain while we run just two premium properties. Service quality changed overnight.',
    author: 'A. Malhotra',
    role: 'Founder, Ember & Vine Dining',
  },
  {
    quote:
      'The dashboard feels like an executive cockpit. We cut response time, upsold better, and made operations far more predictable.',
    author: 'R. Kapoor',
    role: 'Operations Head, The Oak Room',
  },
]

const usageSteps = [
  {
    title: 'Step 1: Setup Restaurant',
    text: 'Owner creates account, configures restaurant, and publishes menu in minutes.',
    image: '/img/im_1.png',
  },
  {
    title: 'Step 2: Generate QR Tables',
    text: 'Tables get branded QR links for frictionless guest ordering.',
    image: '/img/im_2.png',
  },
  {
    title: 'Step 3: Live Order Management',
    text: 'Kitchen and floor teams move orders through real-time status workflow.',
    image: '/img/im_3.png',
  },
  {
    title: 'Step 4: Optimize Revenue',
    text: 'Use insights and offers to improve repeat orders and average ticket size.',
    image: '/img/im_4.png',
  },
]

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f8fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-red-100/70 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="text-2xl font-extrabold text-[var(--primary)]">
            Chef's Bud
          </Link>
          <button
            className="rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-slate-700 md:hidden"
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            {mobileNavOpen ? 'Close' : 'Menu'}
          </button>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex">
            <a href="#home" className="hover:text-[var(--primary)]">
              Home
            </a>
            <a href="#about" className="hover:text-[var(--primary)]">
              About
            </a>
            <Link to="/plans" className="hover:text-[var(--primary)]">
              Pricing
            </Link>
            <a href="#contact" className="hover:text-[var(--primary)]">
              Contact
            </a>
            <Link to="/login" className="hover:text-[var(--primary)]">
              Login
            </Link>
          </nav>
        </div>

        {mobileNavOpen && (
          <nav className="border-t border-red-100 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              <a href="#home" className="rounded-lg px-2 py-2 hover:bg-red-50 hover:text-[var(--primary)]" onClick={() => setMobileNavOpen(false)}>
                Home
              </a>
              <a href="#about" className="rounded-lg px-2 py-2 hover:bg-red-50 hover:text-[var(--primary)]" onClick={() => setMobileNavOpen(false)}>
                About
              </a>
              <Link to="/plans" className="rounded-lg px-2 py-2 hover:bg-red-50 hover:text-[var(--primary)]" onClick={() => setMobileNavOpen(false)}>
                Pricing
              </Link>
              <a href="#contact" className="rounded-lg px-2 py-2 hover:bg-red-50 hover:text-[var(--primary)]" onClick={() => setMobileNavOpen(false)}>
                Contact
              </a>
              <Link to="/login" className="rounded-lg px-2 py-2 hover:bg-red-50 hover:text-[var(--primary)]" onClick={() => setMobileNavOpen(false)}>
                Login
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main id="home" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0f172a] p-6 text-white shadow-[0_24px_60px_rgba(2,6,23,0.35)] md:p-10">
          <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(229,9,20,0.48),transparent_68%)]" />
          <div className="absolute -left-24 bottom-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)]" />

          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-200">Luxury Restaurant Revenue OS</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">
                Turn Your Restaurant Into
                <span className="block text-red-300">An Elite Business Machine</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm text-slate-200 md:text-base">{slides[activeSlide].subtitle}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/register">
                  <Button className="px-7 py-3">Start Your Premium Setup</Button>
                </Link>
                <Link to="/plans">
                  <Button variant="secondary" className="px-7 py-3">
                    View Pricing
                  </Button>
                </Link>
                <a href="#app-views">
                  <Button variant="secondary" className="px-7 py-3 bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white">
                    View Live Product Flow
                  </Button>
                </a>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
                {trustSignals.map((signal) => (
                  <div key={signal} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-slate-100 backdrop-blur">
                    {signal}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-[11px] uppercase tracking-[0.28em] text-red-200">Live Narrative</p>
                <h2 className="mt-2 text-2xl font-bold">{slides[activeSlide].title}</h2>
                <p className="mt-3 text-sm text-slate-200">{slides[activeSlide].subtitle}</p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/15 bg-slate-950/30 p-3">
                    <p className="text-xs text-slate-300">Revenue Lift</p>
                    <p className="mt-1 text-2xl font-bold text-red-300">+31%</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-slate-950/30 p-3">
                    <p className="text-xs text-slate-300">Order Time</p>
                    <p className="mt-1 text-2xl font-bold text-red-300">-22%</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-slate-950/30 p-3">
                    <p className="text-xs text-slate-300">Guest NPS</p>
                    <p className="mt-1 text-2xl font-bold text-red-300">9.1/10</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-slate-950/30 p-3">
                    <p className="text-xs text-slate-300">Owner Control</p>
                    <p className="mt-1 text-2xl font-bold text-red-300">Realtime</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.title}
                      aria-label={`Go to slide ${index + 1}`}
                      onClick={() => setActiveSlide(index)}
                      className={`h-2.5 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-red-300' : 'w-2.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {valueCards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Core Value</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{card.text}</p>
            </article>
          ))}
        </section>

        <section id="about" className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-white to-red-50 p-7 shadow-[0_16px_30px_rgba(229,9,20,0.08)] md:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Our Mission</p>
            <h2 className="mt-2 text-3xl font-bold">Build luxury-grade operations for every ambitious restaurant</h2>
            <p className="mt-4 text-slate-600">
              Chef's Bud helps owners run premium hospitality with calm control: real-time oversight, cleaner workflows,
              and strategic decisions that compound profitability.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {impacts.map((impact) => (
                <div key={impact.label} className="rounded-xl border border-red-100 bg-white p-4">
                  <p className="text-2xl font-bold text-[var(--primary)]">{impact.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">{impact.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:col-span-5">
            {testimonials.map((item) => (
              <article key={item.author} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm leading-relaxed text-slate-600">"{item.quote}"</p>
                <p className="mt-4 font-semibold text-slate-900">{item.author}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.role}</p>
              </article>
            ))}
            <Link to="/register" className="rounded-2xl border border-red-200 bg-gradient-to-r from-white to-red-50 p-5 text-left shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Exclusive For Owners</p>
              <p className="mt-2 text-xl font-bold text-slate-900">Launch your premium workspace now</p>
              <p className="mt-1 text-sm text-slate-600">Setup takes minutes. Impact starts on day one.</p>
            </Link>
          </div>
        </section>

        <section id="app-views" className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Live Product Journey</p>
          <h2 className="mt-2 text-3xl font-bold">How owners scale with Chef's Bud in 4 strategic moves</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {usageSteps.map((step) => (
              <article key={step.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
                <div className="h-40 overflow-hidden border-b border-red-100 bg-slate-100">
                  <img src={step.image} alt={step.title} className="h-full w-full object-cover object-top transition-transform duration-300 hover:scale-105" loading="lazy" />
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Operational Stage</p>
                  <h3 className="mt-2 font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-red-100 bg-gradient-to-r from-slate-950 via-slate-900 to-[#0f172a] p-7 text-white shadow-[0_24px_40px_rgba(15,23,42,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-200">Final Call</p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold md:text-4xl">Own the floor. Elevate the brand. Scale with confidence.</h2>
              <p className="mt-2 text-sm text-slate-200 md:text-base">
                Join ambitious restaurateurs building elite dining operations with precision software built for modern hospitality.
              </p>
            </div>
            <Link to="/register">
              <Button className="px-8 py-3">Create Owner Workspace</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer id="contact" className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} Chef's Bud - Restaurant Revenue OS</p>
          <div className="flex gap-5">
            <a href="mailto:itsnihars@gmail.com" className="hover:text-[var(--primary)]">
              itsnihars@gmail.com
            </a>
            <a href="tel:+919815454626" className="hover:text-[var(--primary)]">
              +91 9815454626
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
