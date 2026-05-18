import { useRef, useState } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoUploadProps {
  value?: string | null
  onFileSelect: (file: File) => void | Promise<void>
  onClear?: () => void
  shape?: 'circle' | 'square'
  size?: number  // px (for circle/square)
  className?: string
  label?: string
  hint?: string
  uploading?: boolean
}

export function PhotoUpload({
  value, onFileSelect, onClear, shape = 'circle', size = 96, className, label, hint, uploading,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await onFileSelect(file)
  }
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await onFileSelect(file)
    e.target.value = ''
  }

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl'

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'relative group overflow-hidden flex items-center justify-center bg-surface-50 border-2 border-dashed text-text-tertiary transition-all cursor-pointer',
          'hover:border-primary-400 hover:text-primary-600',
          dragOver && 'border-primary-500 bg-primary-50/50',
          !value && 'border-surface-300',
          value && 'border-transparent',
          roundedClass,
        )}
        style={{ width: size, height: size }}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-6 w-6" />
        )}
        {value && (
          <div className={cn(
            'absolute inset-0 bg-text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2',
            roundedClass,
          )}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
              className="rounded-full bg-white/90 p-2 text-text-primary hover:bg-white"
              aria-label="Ganti foto"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            {onClear && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClear() }}
                className="rounded-full bg-white/90 p-2 text-danger hover:bg-white"
                aria-label="Hapus foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        {uploading && (
          <div className={cn('absolute inset-0 bg-white/70 flex items-center justify-center', roundedClass)}>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 border-t-primary-600" />
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      </div>
      {label && <p className="text-xs font-medium text-text-secondary">{label}</p>}
      {hint && <p className="text-[10px] text-text-tertiary text-center max-w-[10rem]">{hint}</p>}
    </div>
  )
}
