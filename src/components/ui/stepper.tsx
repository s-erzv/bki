import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperProps {
  steps: string[]
  current: number  // 0-based
  className?: string
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn('flex items-center w-full gap-1', className)}>
      {steps.map((label, i) => {
        const isComplete = i < current
        const isActive = i === current
        return (
          <li key={label} className="flex-1 flex items-center gap-3 min-w-0">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                  isComplete && 'bg-primary-600 text-white',
                  isActive && 'bg-primary-600 text-white ring-4 ring-primary-100',
                  !isComplete && !isActive && 'bg-surface-100 text-text-tertiary',
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-xs font-medium text-center truncate max-w-[7rem]',
                  isActive ? 'text-text-primary' : 'text-text-tertiary',
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'h-px flex-1 -mt-5 transition-colors',
                  isComplete ? 'bg-primary-600' : 'bg-surface-200',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
