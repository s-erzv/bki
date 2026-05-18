import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number              // 0..100
  className?: string
  trackClassName?: string
  fillClassName?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
}

export function ProgressBar({
  value, className, trackClassName, fillClassName, showLabel, size = 'md',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('w-full', className)}>
      <div className={cn('relative w-full overflow-hidden rounded-full bg-surface-100', SIZE[size], trackClassName)}>
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-[width] duration-700 ease-out',
            fillClassName,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1.5 text-xs text-text-tertiary tabular-nums">{Math.round(clamped)}%</p>
      )}
    </div>
  )
}
