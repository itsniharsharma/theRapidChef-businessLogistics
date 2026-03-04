import { useAuth } from '../hooks/useAuth'

export default function Header({ title }) {
  const { user } = useAuth()

  return (
    <header className="owner-header-panel mb-4 flex flex-col items-start justify-between gap-3 p-4 md:mb-6 md:flex-row md:items-center">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Owner Workspace</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">{title}</h1>
        <p className="text-xs text-slate-600 md:text-sm">Hunger – Restaurant Revenue OS • Smooth all-day operations</p>
      </div>
      <div className="owner-chip px-3 py-2 text-xs font-semibold md:text-sm">
        {user?.name || 'Owner'}
      </div>
    </header>
  )
}
