export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base =
    'rounded-xl px-4 py-2 text-sm font-semibold tracking-wide transition disabled:opacity-70 disabled:cursor-not-allowed shadow-sm'
  const styles =
    variant === 'secondary'
      ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      : 'bg-[var(--primary)] text-white hover:opacity-95 hover:shadow-md'

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}