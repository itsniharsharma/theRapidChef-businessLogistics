export default function Card({ title, value, children, accent = false }) {
  return (
    <div className="card p-5 md:p-6">
      {title && <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</p>}
      {value && (
        <p className={`mt-2 text-3xl font-bold md:text-[2.1rem] ${accent ? 'text-[var(--primary)]' : 'text-slate-900'}`}>
          {value}
        </p>
      )}
      {children}
    </div>
  )
}
