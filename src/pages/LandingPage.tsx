import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, Users, Heart, Shield, Sparkles,
  CalendarCheck2, ClipboardCheck, FileBarChart2, MessagesSquare,
  ArrowRight, Microscope, FileText, Presentation, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore, metadataRole } from '@/stores/authStore'
import { dashboardPath, onboardingPath } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

/** Rotating hero backgrounds. Tailwind gradients are stand-ins until real photo assets land. */
const HERO_SLIDES: Array<{ from: string; via?: string; to: string; tint: string }> = [
  { from: 'from-primary-950',  via: 'via-primary-800',  to: 'to-accent-teal',   tint: 'bg-primary-950/70' },
  { from: 'from-accent-purple', via: 'via-primary-800', to: 'to-primary-950',   tint: 'bg-primary-950/75' },
  { from: 'from-primary-900',  via: 'via-primary-700',  to: 'to-accent-amber',  tint: 'bg-primary-950/70' },
]

const ROLES: Array<{ role: UserRole; label: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }> = [
  { role: 'coach',   label: 'Masuk Sebagai Coach',      subtitle: 'Bimbing, jadwalkan, laporkan',  icon: GraduationCap },
  { role: 'parent',  label: 'Masuk Sebagai Wali Murid', subtitle: 'Pantau progres anak',           icon: Heart },
  { role: 'student', label: 'Masuk Sebagai Murid',      subtitle: 'Kelas, tugas, dan riset',       icon: Users },
  { role: 'admin',   label: 'Masuk Sebagai Admin',      subtitle: 'Kelola seluruh sistem',         icon: Shield },
]

const FOCUS_AREAS = [
  { icon: Microscope,   title: 'Penelitian',  desc: 'Pendampingan ide, metode, hingga hasil — terstruktur per tim.' },
  { icon: FileText,     title: 'Makalah',     desc: 'Pembimbingan menulis ilmiah yang siap kompetisi & publikasi.' },
  { icon: Presentation, title: 'Presentasi',  desc: 'Latihan komunikasi & visual deck untuk panggung lomba.' },
]

const CONCEPT_STEPS = [
  { n: '01', title: 'Pemetaan minat', desc: 'Setiap murid dipetakan minat & potensinya sebelum dibagi ke tim.' },
  { n: '02', title: 'Tim & pembimbing', desc: 'Maksimal 6 murid per tim, dengan pembimbing khusus per divisi.' },
  { n: '03', title: 'Bimbingan rutin', desc: 'Sesi terjadwal online/offline, dokumentasi otomatis ke Drive.' },
  { n: '04', title: 'Laporan transparan', desc: 'Tiap sesi menghasilkan PDF yang dikirim ke wali via WhatsApp.' },
]

const FEATURES = [
  { icon: CalendarCheck2, title: 'Jadwal Terintegrasi', desc: 'Sinkron Google Calendar & Meet otomatis.' },
  { icon: ClipboardCheck, title: 'Tugas & Submission',  desc: 'Pembimbing assign, murid submit dari dashboard.' },
  { icon: FileBarChart2,  title: 'Laporan Otomatis',    desc: 'PDF tersimpan ke Drive tim, dibagikan ke wali.' },
  { icon: MessagesSquare, title: 'Notifikasi WhatsApp', desc: 'Pengingat sesi & laporan terkirim otomatis.' },
]

const STATS = [
  { value: '500+', label: 'Murid dibimbing' },
  { value: '40+',  label: 'Tim aktif' },
  { value: '25+',  label: 'Pembimbing' },
  { value: '15+',  label: 'Lomba dimenangkan' },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { session, profile, onboarded, sessionRestored, user } = useAuthStore()

  // Auto-redirect logged-in users to their dashboard.
  useEffect(() => {
    if (!sessionRestored || !session) return
    const r = profile?.role ?? metadataRole(user)
    if (!r) return
    const path = !onboarded ? (onboardingPath(r) ?? dashboardPath(r)) : dashboardPath(r)
    navigate(path, { replace: true })
  }, [session, profile, onboarded, sessionRestored, user, navigate])

  // Rotate hero background slides.
  const [slideIdx, setSlideIdx] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setSlideIdx((i) => (i + 1) % HERO_SLIDES.length), 6000)
    return () => window.clearInterval(t)
  }, [])

  const handleRoleClick = (role: UserRole) => {
    navigate(`/login?role=${role}`)
  }

  return (
    <div className="min-h-screen bg-white text-text-primary">
      {/* ── Top nav ────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white/0">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <p className="font-extrabold text-white tracking-tight">BKI</p>
              <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-white/70">Bimbingan Karya Ilmiah</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/15 hover:text-white text-sm font-medium"
            onClick={() => navigate('/login')}
          >
            Masuk
          </Button>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative min-h-screen overflow-hidden flex items-center">
        {/* Rotating gradient backdrops */}
        <div className="absolute inset-0">
          {HERO_SLIDES.map((s, i) => (
            <div
              key={i}
              className={cn(
                'absolute inset-0 bg-gradient-to-br transition-opacity duration-[1500ms] ease-in-out',
                s.from, s.via, s.to,
                slideIdx === i ? 'opacity-100' : 'opacity-0',
              )}
            />
          ))}
          {/* Darkening overlay for legibility */}
          <div className={cn('absolute inset-0', HERO_SLIDES[slideIdx].tint)} />
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
          {/* Decorative blur orbs */}
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-primary-400/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto w-full px-6 lg:px-10 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-3 py-1 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-white">
                Platform Bimbingan Karya Ilmiah
              </span>
            </div>

            <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.02] mb-6">
              Riset, lomba, dan
              <br />
              <span className="bg-gradient-to-r from-primary-200 via-white to-primary-100 bg-clip-text text-transparent">
                bimbingan ilmiah
              </span>
              {' '}satu pintu.
            </h1>

            <p className="text-white/80 text-lg sm:text-xl max-w-2xl leading-relaxed mb-10">
              Dari penelitian, makalah, hingga presentasi — BKI mengintegrasikan jadwal, tugas, laporan, dan komunikasi wali dalam satu sistem.
            </p>

            {/* Role buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl">
              {ROLES.map(({ role, label, subtitle, icon: Icon }) => (
                <button
                  key={role}
                  onClick={() => handleRoleClick(role)}
                  className="group relative overflow-hidden text-left bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-md border border-white/20 hover:border-white/40 rounded-2xl px-5 py-4 transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <Icon className="h-6 w-6 text-white mb-3" strokeWidth={1.75} />
                  <p className="text-white font-bold text-sm leading-tight mb-0.5">{label}</p>
                  <p className="text-white/60 text-xs">{subtitle}</p>
                  <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            {/* Slide indicator dots */}
            <div className="mt-12 flex items-center gap-1.5">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  className={cn(
                    'h-1 rounded-full transition-all',
                    slideIdx === i ? 'w-8 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/60',
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────── */}
      <section className="border-y border-surface-200 bg-surface-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-2 lg:grid-cols-4 divide-x divide-surface-200">
          {STATS.map((s) => (
            <div key={s.label} className="py-8 lg:py-10 px-4 lg:px-8 text-center">
              <p className="text-3xl lg:text-4xl font-extrabold tracking-tight text-primary-900 tabular-nums">{s.value}</p>
              <p className="text-xs lg:text-sm text-text-tertiary font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Yang kita kerjakan ─────────────────────────── */}
      <Section
        eyebrow="Apa yang kami kerjakan"
        title="Tiga pilar bimbingan ilmiah."
        description="Setiap tim dibimbing menyeluruh — dari ide riset hingga panggung presentasi."
      >
        <div className="grid md:grid-cols-3 gap-5">
          {FOCUS_AREAS.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-3xl border border-surface-200 bg-white p-7 hover:border-primary-300 hover:shadow-lift transition-all"
            >
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-950 text-white mb-5">
                  <f.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-1.5">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Tampilan dokumentasi ───────────────────────── */}
      <Section
        eyebrow="Tampilan dokumentasi"
        title="Setiap sesi terdokumentasi."
        description="Foto, catatan, dan PDF laporan otomatis tersimpan rapi per tim."
        className="bg-surface-50"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0,1,2,3,4,5,6,7].map((i) => (
            <div
              key={i}
              className={cn(
                'aspect-[4/3] rounded-2xl border border-surface-200 overflow-hidden relative',
                'bg-gradient-to-br',
                i % 4 === 0 && 'from-primary-100 to-primary-300',
                i % 4 === 1 && 'from-accent-teal/30 to-primary-200',
                i % 4 === 2 && 'from-accent-purple/30 to-primary-200',
                i % 4 === 3 && 'from-accent-amber/30 to-primary-200',
                i === 0 && 'md:col-span-2 md:row-span-2 aspect-square md:aspect-auto',
              )}
            >
              <div className="absolute inset-0 flex items-end p-4">
                <div className="text-white/90">
                  <p className="text-[10px] uppercase tracking-wider font-bold">Sesi #{i + 1}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Konsep bimbingan ───────────────────────────── */}
      <Section
        eyebrow="Konsep bimbingan"
        title="Empat langkah, dari minat ke kemenangan."
        description="Pendekatan yang sama setiap tim — terstruktur, terukur, terdokumentasi."
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CONCEPT_STEPS.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-5xl font-extrabold text-primary-200 tabular-nums tracking-tighter">{s.n}</span>
                {i < CONCEPT_STEPS.length - 1 && (
                  <span className="hidden lg:block h-px flex-1 bg-gradient-to-r from-primary-200 to-transparent translate-y-3" />
                )}
              </div>
              <h3 className="text-base font-bold text-text-primary mb-1.5">{s.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Tim yang sudah dibimbing ───────────────────── */}
      <Section
        eyebrow="Tim yang sudah dibimbing"
        title="Riset nyata, hasil nyata."
        description="Kumpulan tim yang sudah pernah dibimbing oleh BKI."
        className="bg-primary-950 text-white"
        eyebrowClass="text-primary-200"
        titleClass="text-white"
        descClass="text-white/70"
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 lg:-mx-10 lg:px-10 scrollbar-thin">
          {[
            { code: 'BKI-A01', title: 'Bioplastik dari kulit pisang', divs: ['Penelitian', 'Makalah'] },
            { code: 'BKI-A02', title: 'AI deteksi kualitas air tambak', divs: ['Penelitian', 'Presentasi'] },
            { code: 'BKI-A03', title: 'Pendeteksi dini stunting balita', divs: ['Makalah'] },
            { code: 'BKI-A04', title: 'Solar dryer untuk petani kopi', divs: ['Penelitian', 'Presentasi'] },
            { code: 'BKI-A05', title: 'Aplikasi sampah elektronik daur ulang', divs: ['Presentasi'] },
            { code: 'BKI-A06', title: 'Pupuk cair limbah sayur pasar', divs: ['Makalah', 'Penelitian'] },
          ].map((t) => (
            <div
              key={t.code}
              className="flex-shrink-0 w-72 rounded-2xl bg-white/[0.06] backdrop-blur border border-white/[0.12] p-5 hover:bg-white/[0.10] transition-colors"
            >
              <span className="inline-block text-[10px] font-mono font-bold tracking-wider text-primary-200 bg-white/10 rounded px-2 py-0.5 mb-3">
                {t.code}
              </span>
              <h3 className="font-bold text-white leading-snug mb-3">{t.title}</h3>
              <div className="flex flex-wrap gap-1.5">
                {t.divs.map((d) => (
                  <span key={d} className="text-[10px] uppercase tracking-wider font-semibold text-white/70 border border-white/20 rounded-full px-2 py-0.5">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Features ────────────────────────────────────── */}
      <Section
        eyebrow="Fitur platform"
        title="Semua urusan bimbingan, satu dashboard."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-surface-200 bg-white p-5 hover:border-primary-300 hover:shadow-soft transition-all">
              <f.icon className="h-5 w-5 text-primary-600 mb-3" strokeWidth={1.75} />
              <p className="font-bold text-text-primary mb-1">{f.title}</p>
              <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Final CTA ──────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5">
            Siap mulai bimbingan?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Pilih peranmu — atau hubungi admin untuk dibuatkan akun.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => navigate('/login')} className="bg-white text-primary-950 hover:bg-white/90 h-12 px-6 font-bold">
              Masuk Sekarang
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button onClick={() => navigate('/register')} variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white h-12 px-6 font-bold bg-transparent">
              Daftar Gratis
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/60">
            {['Akun langsung pakai', 'WhatsApp terintegrasi', 'Drive otomatis'].map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary-300" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-primary-950 text-white/60 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm">© {new Date().getFullYear()} BKI — Bimbingan Karya Ilmiah</span>
          </div>
          <p className="text-xs">Dibuat dengan ❤︎ untuk pelajar Indonesia</p>
        </div>
      </footer>
    </div>
  )
}

interface SectionProps {
  eyebrow: string
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  eyebrowClass?: string
  titleClass?: string
  descClass?: string
}

function Section({ eyebrow, title, description, children, className, eyebrowClass, titleClass, descClass }: SectionProps) {
  return (
    <section className={cn('py-20', className)}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-12">
          <p className={cn('text-[11px] uppercase tracking-[0.18em] font-bold text-primary-600 mb-3', eyebrowClass)}>
            {eyebrow}
          </p>
          <h2 className={cn('text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-primary leading-[1.05] mb-4', titleClass)}>
            {title}
          </h2>
          {description && (
            <p className={cn('text-base sm:text-lg text-text-secondary leading-relaxed', descClass)}>
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}
