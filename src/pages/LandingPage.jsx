import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'

const slides = [
  {
    title: 'Run Your Restaurant Like a Global Brand',
    subtitle: 'Hunger unifies orders, tables, menu, offers, and analytics in one premium revenue OS.',
    tag: 'Premium Operations',
  },
  {
    title: 'Real-Time Operations. Better Decisions.',
    subtitle: 'Track live orders, optimize service speed, and increase revenue with actionable intelligence.',
    tag: 'Live Intelligence',
  },
  {
    title: 'From QR Scan to Checkout in Seconds',
    subtitle: 'Deliver an elegant guest experience while your team manages everything effortlessly.',
    tag: 'Guest Experience',
  },
]

const valueCards = [
  {
    title: 'Unified Command Center',
    text: 'One dashboard for tables, menu, orders, offers, and business insights.',
  },
  {
    title: 'Guest-First Ordering',
    text: 'Mobile-friendly QR journey designed for premium dining flow.',
  },
  {
    title: 'Revenue Intelligence',
    text: 'Track hourly performance and optimize high-value menu outcomes.',
  },
]

const impacts = [
  { label: 'Average Service Speed Gain', value: '+37%' },
  { label: 'Order Accuracy Improvement', value: '+42%' },
  { label: 'Offer Conversion Uplift', value: '+29%' },
  { label: 'Owner Time Saved Daily', value: '3.5 hrs' },
]

const usageSteps = [
  {
    title: 'Step 1: Setup Restaurant',
    text: 'Owner creates account, configures restaurant, and publishes menu in minutes.',
  },
  {
    title: 'Step 2: Generate QR Tables',
    text: 'Tables get branded QR links for frictionless guest ordering.',
  },
  {
    title: 'Step 3: Live Order Management',
    text: 'Kitchen and floor teams move orders through real-time status workflow.',
  },
  {
    title: 'Step 4: Optimize Revenue',
    text: 'Use insights and offers to improve repeat orders and average ticket size.',
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
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-red-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="text-2xl font-extrabold text-[var(--primary)]">
            Hunger
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
            <a href="#contact" className="hover:text-[var(--primary)]">
              Contact
            </a>
            <Link to="/login" className="hover:text-[var(--primary)]">
              Login
            </Link>
            <Link to="/register" className="rounded-xl bg-[var(--primary)] px-4 py-2 text-white shadow-sm">
              Signup
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
              <a href="#contact" className="rounded-lg px-2 py-2 hover:bg-red-50 hover:text-[var(--primary)]" onClick={() => setMobileNavOpen(false)}>
                Contact
              </a>
              <Link to="/login" className="rounded-lg px-2 py-2 hover:bg-red-50 hover:text-[var(--primary)]" onClick={() => setMobileNavOpen(false)}>
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-[var(--primary)] px-3 py-2 text-center text-white"
                onClick={() => setMobileNavOpen(false)}
              >
                Signup
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main id="home" className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <section className="mb-8 overflow-hidden rounded-2xl border border-red-100 shadow-[0_16px_40px_rgba(229,9,20,0.12)]">
          <div className="relative h-[340px] md:h-[420px]">
            <div
              className="flex h-full transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {slides.map((slide) => (
                <article
                  key={slide.title}
                  className="relative h-full min-w-full bg-gradient-to-br from-slate-950 via-slate-900 to-[var(--primary)] p-6 text-white md:p-10"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_45%)]" />
                  <div className="relative z-10 flex h-full max-w-3xl flex-col justify-end">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-200">{slide.tag}</p>
                    <h2 className="mt-2 text-3xl font-bold md:text-5xl">{slide.title}</h2>
                    <p className="mt-4 text-sm text-slate-100 md:text-base">{slide.subtitle}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setActiveSlide(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-red-100 bg-gradient-to-br from-white via-white to-red-50 p-6 shadow-[0_16px_40px_rgba(229,9,20,0.10)] md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Restaurant Revenue OS</p>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">Hunger – Built for modern hospitality leaders</h1>
          <p className="mt-4 max-w-3xl text-sm text-slate-600 md:text-base">{slides[activeSlide].subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register">
              <Button className="px-6 py-3">Start Free</Button>
            </Link>
            <a href="#about">
              <Button variant="secondary" className="px-6 py-3">
                Explore Platform
              </Button>
            </a>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                onClick={() => setActiveSlide(index)}
                className={`rounded-xl border p-4 text-left transition ${
                  index === activeSlide
                    ? 'border-red-200 bg-red-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-red-100'
                }`}
              >
                <p className="text-sm font-semibold">{slide.title}</p>
              </button>
            ))}
          </div>
        </section>

        <section id="about" className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Our Mission</p>
            <h2 className="mt-2 text-2xl font-bold">Empower every restaurant to operate like a multi-million business</h2>
            <p className="mt-4 text-slate-600">
              Hunger helps owners deliver premium service, improve operational speed, and unlock sustainable
              profitability through elegant technology built for hospitality teams.
            </p>
          </div>
          <div className="grid gap-4 md:col-span-5">
            {valueCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-base font-semibold">{card.title}</p>
                <p className="mt-1 text-sm text-slate-600">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">App Views</p>
          <h2 className="mt-2 text-2xl font-bold">How to use Hunger in 4 simple stages</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {usageSteps.map((step) => (
              <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 h-36 rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white" />
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Business Impact</p>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {impacts.map((impact) => (
              <div key={impact.label} className="rounded-xl border border-red-100 bg-white p-4 text-center">
                <p className="text-2xl font-bold text-[var(--primary)]">{impact.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">{impact.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer id="contact" className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} Hunger – Restaurant Revenue OS</p>
          <div className="flex gap-5">
            <a href="mailto:hello@hungeros.com" className="hover:text-[var(--primary)]">
              hello@hungeros.com
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
