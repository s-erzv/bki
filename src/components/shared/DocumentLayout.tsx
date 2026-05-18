import { Link } from 'react-router-dom'
import { GraduationCap, ArrowLeft } from 'lucide-react'

interface TocItem {
  id: string
  label: string
}

interface DocumentLayoutProps {
  /** Long-form title shown as document headline. */
  title: string
  /** Short label shown above the title (e.g. "Kebijakan Privasi"). */
  kind: string
  /** ISO date string (e.g. "2026-05-19") of last update. */
  updatedAt: string
  toc: TocItem[]
  children: React.ReactNode
}

/**
 * Document chrome shared by Privacy Policy & Terms of Service.
 * Clean SaaS aesthetic matching the landing page.
 */
export function DocumentLayout({ title, kind, updatedAt, toc, children }: DocumentLayoutProps) {
  const updated = new Date(updatedAt).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-white text-text-primary">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-surface-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary-950 text-white flex items-center justify-center shadow-soft">
              <GraduationCap className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <p className="font-extrabold text-primary-950 text-sm tracking-tight">BKI</p>
              <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-text-tertiary hidden sm:block">
                Bimbingan Karya Ilmiah
              </p>
            </div>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-text-secondary hover:text-primary-950 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Beranda
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-surface-100">
        <div aria-hidden className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-100 opacity-50 blur-3xl" />
        <div aria-hidden className="absolute top-20 -left-32 h-80 w-80 rounded-full bg-primary-100 opacity-60 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 lg:px-10 py-14 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-brand-600 mb-4">
              {kind}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-primary-950 leading-tight tracking-tight">
              {title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-tertiary">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
                Diperbarui {updated}
              </span>
              <span className="text-surface-300">·</span>
              <span>Versi 1.0</span>
              <span className="text-surface-300">·</span>
              <span>Bahasa Indonesia</span>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-10 sm:py-14 lg:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-10 grid lg:grid-cols-[14rem,1fr] gap-10 lg:gap-16">
          {/* Sticky TOC (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <p className="text-[11px] uppercase tracking-wider font-bold text-text-tertiary">
                Daftar isi
              </p>
              <ol className="space-y-2 text-sm">
                {toc.map((item, i) => (
                  <li key={item.id} className="flex items-baseline gap-2">
                    <span className="text-[10px] text-text-tertiary tabular-nums w-5 font-mono">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <a
                      href={`#${item.id}`}
                      className="text-text-secondary hover:text-primary-950 hover:underline underline-offset-4 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          {/* Article */}
          <article className="max-w-2xl">
            {children}
          </article>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-100 bg-surface-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-tertiary">
          <p>© {new Date().getFullYear()} BKI — Bimbingan Karya Ilmiah</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-primary-950 transition-colors">Privasi</Link>
            <Link to="/terms" className="hover:text-primary-950 transition-colors">Syarat</Link>
            <Link to="/" className="hover:text-primary-950 transition-colors">Beranda</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Reusable building blocks for document body ─────────────────────────── */

export function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-2xl sm:text-3xl font-extrabold text-primary-950 leading-tight tracking-tight mt-12 first:mt-0 mb-4 scroll-mt-24"
    >
      {children}
    </h2>
  )
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-primary-950 uppercase tracking-wider mt-8 mb-3">
      {children}
    </h3>
  )
}

export function Para({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] leading-relaxed text-text-secondary mb-4">
      {children}
    </p>
  )
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5 mb-5 text-[15px] leading-relaxed text-text-secondary">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-2.5 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-2xl border border-surface-200 bg-surface-50 px-5 py-4">
      <p className="text-[11px] uppercase tracking-wider font-bold text-brand-600 mb-2">
        {label}
      </p>
      <p className="text-[15px] leading-relaxed text-text-primary">{children}</p>
    </div>
  )
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-primary-950">{children}</strong>
}
