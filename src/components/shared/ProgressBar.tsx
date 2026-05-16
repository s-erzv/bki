import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  label?: string
  className?: string
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('space-y-1.5', className)}>
      {label !== undefined && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">{label}</span>
          <span className="text-sm font-semibold text-text-primary">{clamped}%</span>
        </div>
      )}
      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
