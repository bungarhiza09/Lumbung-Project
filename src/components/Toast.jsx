import { useEffect, useState } from 'react'

const CONFIGS = {
  success: {
    icon: '✅',
    bg: 'bg-[#E1F5EE]', border: 'border-[#9FE1CB]',
    title: 'text-[#085041]', msg: 'text-[#0F6E56]', bar: 'bg-[#1D9E75]',
  },
  error: {
    icon: '❌',
    bg: 'bg-[#FCEBEB]', border: 'border-[#F7C1C1]',
    title: 'text-[#501313]', msg: 'text-[#791F1F]', bar: 'bg-[#E24B4A]',
  },
  warning: {
    icon: '⚠️',
    bg: 'bg-[#FAEEDA]', border: 'border-[#FAC775]',
    title: 'text-[#412402]', msg: 'text-[#633806]', bar: 'bg-[#BA7517]',
  },
}

export function Toast({ id, type, title, message, onClose }) {
  const [hiding, setHiding] = useState(false)
  const c = CONFIGS[type] || CONFIGS.success

  useEffect(() => {
    const t = setTimeout(() => { setHiding(true); setTimeout(() => onClose(id), 300) }, 4000)
    return () => clearTimeout(t)
  }, [id, onClose])

  const dismiss = () => { setHiding(true); setTimeout(() => onClose(id), 300) }

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 pb-5 transition-all duration-300 ${c.bg} ${c.border} ${hiding ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}
      role="alert" aria-live="assertive">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{c.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold mb-0.5 ${c.title}`}>{title}</p>
          {message && <p className={`text-xs leading-relaxed ${c.msg}`}>{message}</p>}
        </div>
        <button onClick={dismiss} aria-label="Tutup"
          className={`text-lg leading-none flex-shrink-0 ${c.msg}`}>×</button>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 ${c.bar} animate-[shrink_4s_linear_forwards]`} />
    </div>
  )
}

export function ToastContainer({ toasts, onClose }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm space-y-2">
      {toasts.map(t => <Toast key={t.id} {...t} onClose={onClose} />)}
    </div>
  )
}