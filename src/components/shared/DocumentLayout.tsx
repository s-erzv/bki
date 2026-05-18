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
 * Notebook-paper background, serif headline, sticky TOC on desktop.
 */
export function DocumentLayout({ title, kind, updatedAt, toc, children }: DocumentLayoutProps) {
  const updated = new Date(updatedAt).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-paper-50 text-text-primary">
      {/* Grid paper backdrop — fixed so it parallaxes as you scroll */}
      <div
        aria-hidden
        className="fixed inset-0 bg-grid-fine bg-grid-sm pointer-events-none"
      />

      <div className="relative">
        {/* Top bar */}
        <header className="border-b border-paper-200 bg-paper-50/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-primary-950 text-white flex items-center justify-center">
                <GraduationCap className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="leading-tight">
                <p className="font-extrabold text-primary-950 text-sm tracking-tight">BKI</p>
                <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-text-tertiary">Bimbingan Karya Ilmiah</p>
              </div>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-primary-950 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Beranda
            </Link>
          </div>
        </header>

        {/* Headline */}
        <section className="border-b border-paper-200">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-10 bg-primary-950" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-primary-950">
                  {kind}
                </span>
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-primary-950">
                {title}
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-text-tertiary">
                <span>
                  <span className="text-text-secondary">Diperbarui</span> · {updated}
                </span>
                <span>
                  <span className="text-text-secondary">Versi dokumen</span> · 1.0
                </span>
                <span>
                  <span className="text-text-secondary">Bahasa</span> · Bahasa Indonesia
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="py-12 lg:py-20">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 grid lg:grid-cols-[14rem,1fr] gap-12 lg:gap-16">
            {/* Sticky TOC */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] font-semibold text-text-tertiary">
                  Daftar isi
                </p>
                <ol className="space-y-2 text-sm">
                  {toc.map((item, i) => (
                    <li key={item.id} className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px] text-text-tertiary tabular-nums w-5">
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

            {/* Article — typography styled for readability */}
            <article className="prose-doc max-w-2xl">
              {children}
            </article>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-paper-200 bg-paper-100/60">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-tertiary">
            <p className="font-mono">© {new Date().getFullYear()} BKI — Bimbingan Karya Ilmiah</p>
            <div className="flex items-center gap-6 font-mono uppercase tracking-wider">
              <Link to="/privacy" className="hover:text-primary-950 transition-colors">Privasi</Link>
              <Link to="/terms" className="hover:text-primary-950 transition-colors">Syarat</Link>
              <Link to="/" className="hover:text-primary-950 transition-colors">Beranda</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* ── Reusable building blocks for document body ─────────────────────────── */

export function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="font-display text-3xl sm:text-4xl text-primary-950 leading-tight mt-14 first:mt-0 mb-5 scroll-mt-24"
    >
      {children}
    </h2>
  )
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-sans text-base font-bold text-primary-950 uppercase tracking-wider mt-8 mb-3">
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
          <span className="text-primary-950 font-mono text-xs mt-1.5 flex-shrink-0">▸</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="my-6 border-l-2 border-primary-950 bg-paper-100/60 px-5 py-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] font-semibold text-primary-950 mb-2">
        {label}
      </p>
      <p className="text-[15px] leading-relaxed text-text-primary">{children}</p>
    </div>
  )
}

export function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-primary-950">{children}</strong>
}
