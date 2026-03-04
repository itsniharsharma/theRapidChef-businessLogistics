export default function FormInput({ label, className = '', ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input className={`input ${className}`} {...props} />
    </label>
  )
}
