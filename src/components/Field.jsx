export default function Field({ label, error, children }) {
  return (
    <label className="block mb-4">
      <span className="text-sm font-medium text-black mb-1.5 block">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-500 mt-1 block">{error}</span>}
    </label>
  )
}

export const inputClass =
  "w-full bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-black placeholder:text-slate-500"
