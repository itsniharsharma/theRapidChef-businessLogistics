export default function Card({ title, value, children, accent = false }) {
  return (
    <div className="card p-5">
      {title && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>}
      {value && (
        <p className={`mt-2 text-3xl font-bold ${accent ? 'text-[var(--primary)]' : 'text-slate-900'}`}>
          {value}
        </p>
      )}
      {children}
    </div>
  )
}
