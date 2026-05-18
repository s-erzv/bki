import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScoreInputProps {
  value: number | null
  onChange: (v: number) => void
  min?: number
  max?: number
  label?: string
  className?: string
}

export function ScoreInput({ value, onChange, min = 1, max = 10, label, className }: ScoreInputProps) {
  const current = value ?? min
  const dec = () => onChange(Math.max(min, current - 1))
  const inc = () => onChange(Math.min(max, current + 1))

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <p className="text-xs font-medium text-text-secondary">{label}</p>}
      <div className="inline-flex items-center rounded-xl border border-surface-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={dec}
          disabled={current <= min}
          className="h-9 w-9 flex items-center justify-center text-text-secondary hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="w-10 text-center text-sm font-bold tabular-nums text-text-primary">
          {value ?? '—'}
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={current >= max}
          className="h-9 w-9 flex items-center justify-center text-text-secondary hover:bg-surface-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
