import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileHeroCardProps {
  fullName: string
  photoUrl?: string | null
  teamCode?: string | null
  researchTitle?: string | null
  subtitle?: string                          // e.g. division for coach
  accent: 'coach' | 'student' | 'parent' | 'admin'
  /** When provided, makes research title editable inline (only used by student). */
  onResearchTitleChange?: (next: string) => void | Promise<void>
  actions?: React.ReactNode
}

const ACCENT_GRADIENT = {
  coach:   'from-primary-700 to-primary-500',
  student: 'from-primary-800 via-primary-600 to-accent-teal',
  parent:  'from-accent-purple via-primary-700 to-primary-500',
  admin:   'from-primary-950 to-text-secondary',
}

export function ProfileHeroCard({
  fullName, photoUrl, teamCode, researchTitle, subtitle, accent,
  onResearchTitleChange, actions,
}: ProfileHeroCardProps) {
  const initial = fullName.slice(0, 1).toUpperCase()
  const gradient = ACCENT_GRADIENT[accent]

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(researchTitle ?? '')
  const [saving, setSaving] = useState(false)

  const saveTitle = async () => {
    if (!onResearchTitleChange || saving) return
    setSaving(true)
    try {
      await onResearchTitleChange(draft.trim())
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={cn(
      'relative overflow-hidden rounded-3xl bg-gradient-to-br text-white p-6 sm:p-8 shadow-lift',
      gradient,
    )}>
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/[0.10] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-white/[0.06] blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative flex items-start gap-5 sm:gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt={fullName} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-3xl font-extrabold ring-4 ring-white/20 shadow-lg">
              {initial}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">{fullName}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {teamCode && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur border border-white/15 px-2.5 py-0.5 text-xs font-mono font-semibold tracking-wider">
                {teamCode}
              </span>
            )}
            {subtitle && (
              <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur border border-white/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                {subtitle}
              </span>
            )}
          </div>

          {/* Research title — editable for student */}
          {(researchTitle || onResearchTitleChange) && (
            <div className="mt-3 group">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitle()
                      if (e.key === 'Escape') { setDraft(researchTitle ?? ''); setEditing(false) }
                    }}
                    className="flex-1 max-w-md rounded-lg bg-white/10 backdrop-blur border border-white/30 px-3 py-1.5 text-sm placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Judul penelitian…"
                  />
                  <button onClick={saveTitle} disabled={saving} className="p-1.5 rounded-lg bg-white text-primary-700 hover:bg-white/90 disabled:opacity-50">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setDraft(researchTitle ?? ''); setEditing(false) }} className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onResearchTitleChange && setEditing(true)}
                  disabled={!onResearchTitleChange}
                  className={cn(
                    'inline-flex items-center gap-2 text-sm italic text-white/85 leading-relaxed text-left max-w-2xl',
                    onResearchTitleChange && 'hover:text-white',
                  )}
                >
                  <span className="truncate">
                    {researchTitle || (onResearchTitleChange ? 'Klik untuk tambah judul penelitian…' : 'Belum ada judul penelitian')}
                  </span>
                  {onResearchTitleChange && (
                    <Pencil className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions slot */}
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </section>
  )
}
