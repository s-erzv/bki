import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number            // 0..100
  size?: number            // px
  stroke?: number          // px
  className?: string
  label?: React.ReactNode  // rendered in center; defaults to "<value>%"
  trackClassName?: string
  fillClassName?: string
}

export function ProgressRing({
  value,
  size = 140,
  stroke = 12,
  className,
  label,
  trackClassName = 'text-surface-100',
  fillClassName = 'text-primary-600',
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(fillClassName, 'transition-[stroke-dashoffset] duration-700 ease-out')}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label ?? (
          <>
            <span className="text-3xl font-bold tracking-tight text-text-primary tabular-nums">{Math.round(clamped)}</span>
            <span className="text-xs text-text-tertiary font-medium">%</span>
          </>
        )}
      </div>
    </div>
  )
}
