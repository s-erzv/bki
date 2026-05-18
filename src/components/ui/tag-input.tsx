import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  className?: string
  maxTags?: number
}

export function TagInput({ value, onChange, placeholder = 'Ketik dan tekan Enter…', className, maxTags }: TagInputProps) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const tag = draft.trim()
    if (!tag) return
    if (value.includes(tag)) { setDraft(''); return }
    if (maxTags && value.length >= maxTags) return
    onChange([...value, tag])
    setDraft('')
  }

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag))

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault()
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-500 transition',
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-primary-50 text-primary-700 text-xs font-medium px-2 py-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            className="text-primary-500 hover:text-primary-800"
            aria-label={`Hapus ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[8rem] border-0 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-0 p-0"
      />
    </div>
  )
}
