import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const PAD: Record<NonNullable<EmptyStateProps['size']>, string> = {
  sm: 'py-6',
  md: 'py-12',
  lg: 'py-20',
}

export function EmptyState({ icon: Icon, title, description, action, className, size = 'md' }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6', PAD[size], className)}>
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {description && <p className="mt-1 text-xs text-text-tertiary max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
