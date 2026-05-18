import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  GraduationCap, Users, Heart, Shield,
  CalendarCheck2, ClipboardCheck, FileBarChart2, MessagesSquare,
  ArrowRight, ArrowUpRight, Microscope, FileText, Presentation,
  FolderOpen, BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore, metadataRole } from '@/stores/authStore'
import { dashboardPath, onboardingPath } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

/* ─────────────────────────────────────────────────────────────────────── */

const ROLES: Array<{ role: UserRole; code: string; label: string; subtitle: string; icon: LucideIcon }> = [
  { role: 'coach',   code: 'A', label: 'Pembimbing',  subtitle: 'Jadwalkan kelas, beri tugas, laporkan sesi',  icon: GraduationCap },
  { role: 'student', code: 'B', label: 'Murid',       subtitle: 'Akses kelas, kumpul tugas, lihat skor',       icon: Users },
  { role: 'parent',  code: 'C', label: 'Wali Murid',  subtitle: 'Pantau progres anak, terima laporan WA',      icon: Heart },
  { role: 'admin',   code: 'D', label: 'Admin',       subtitle: 'Kelola akun, tim, dan operasional sistem',    icon: Shield },
]

const DISCIPLINES = [
  {
    code: 'A·01',
    icon: Microscope,
    title: 'Penelitian',
    description:
      'Pendampingan rumusan masalah, metode, eksperimen, dan analisis. Setiap tim memiliki coach divisi riset khusus.',
    notes: ['ide → metode', 'data → analisis', 'temuan → kesimpulan'],
  },
  {
    code: 'A·02',
    icon: FileText,
    title: 'Makalah',
    description:
      'Bimbingan penulisan ilmiah dari outline hingga revisi akhir. Siap submit untuk kompetisi atau publikasi sekolah.',
    notes: ['abstrak', 'pendahuluan', 'metodologi', 'hasil & pembahasan'],
  },
  {
    code: 'A·03',
    icon: Presentation,
    title: 'Presentasi',
    description:
      'Latihan deck, narasi, dan tanya jawab. Coach divisi presentasi melatih cara berbicara di panggung lomba.',
    notes: ['storytelling', 'visual deck', 'public speaking'],
  },
]

const METHOD_STEPS = [
  { n: '01', title: 'Pemetaan minat',     desc: 'Murid dipetakan minat & potensi sebelum dibagi ke tim.' },
  { n: '02', title: 'Tim & pembimbing',   desc: 'Max 6 murid per tim. Coach khusus per divisi.' },
  { n: '03', title: 'Bimbingan rutin',    desc: 'Sesi online/offline dijadwalkan, terdokumentasi.' },
  { n: '04', title: 'Laporan transparan', desc: 'PDF tiap sesi dikirim ke wali via WhatsApp.' },
]

const FEATURES: Array<{ icon: LucideIcon; title: string; desc: string; span?: string }> = [
  { icon: CalendarCheck2, title: 'Jadwal Terintegrasi', desc: 'Sync Google Calendar + Meet otomatis tiap kelas.',  span: 'sm:col-span-2' },
  { icon: ClipboardCheck, title: 'Tugas & Submission',  desc: 'Coach assign, murid submit dari dashboard.' },
  { icon: FolderOpen,     title: 'Drive per Tim',       desc: 'Folder otomatis terstruktur per tim.' },
  { icon: MessagesSquare, title: 'WhatsApp Notif',      desc: 'Reminder sesi & laporan auto terkirim ke wali.' },
  { icon: FileBarChart2,  title: 'Laporan PDF',         desc: 'Tiap sesi → PDF rapi.',                            span: 'sm:col-span-2' },
  { icon: BarChart3,      title: 'Rubrik Skor 1–10',    desc: '5 dimensi: disiplin, aktif, komunikasi, etika, paham.' },
]

const SHOWCASE = [
  { code: 'BKI · A01', year: '2025', title: 'Bioplastik dari kulit pisang', divs: ['Penelitian', 'Makalah'] },
  { code: 'BKI · A02', year: '2025', title: 'AI deteksi kualitas air tambak', divs: ['Penelitian', 'Presentasi'] },
  { code: 'BKI · A03', year: '2024', title: 'Pendeteksi dini stunting balita', divs: ['Makalah'] },
  { code: 'BKI · A04', year: '2024', title: 'Solar dryer untuk petani kopi', divs: ['Penelitian', 'Presentasi'] },
  { code: 'BKI · A05', year: '2024', title: 'Aplikasi sampah elektronik daur ulang', divs: ['Presentasi'] },
  { code: 'BKI · A06', year: '2023', title: 'Pupuk cair limbah sayur pasar', divs: ['Makalah', 'Penelitian'] },
]

const STATS = [
  { value: '500+', label: 'Murid dibimbing' },
  { value: '40+',  label: 'Tim aktif' },
  { value: '25+',  label: 'Pembimbing' },
  { value: '15+',  label: 'Lomba dimenangkan' },
]

/* ─────────────────────────────────────────────────────────────────────── */

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

  return (
    <div className="min-h-screen bg-paper-50 text-text-primary">
      {/* ── Background grid (fixed, parallax-feel) ───────────────────── */}
      <div aria-hidden className="fixed inset-0 bg-grid-fine bg-grid-sm pointer-events-none" />

      {/* Content sits above the grid */}
      <div className="relative">

        {/* ── Top nav ────────────────────────────────────────────────── */}
        <header className="border-b border-paper-200 bg-paper-50/80 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary-950 text-white flex items-center justify-center">
                <GraduationCap className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="leading-tight">
                <p className="font-extrabold text-primary-950 text-sm tracking-tight">BKI</p>
                <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-text-tertiary">
                  Bimbingan Karya Ilmiah
                </p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-xs font-mono uppercase tracking-wider text-text-secondary">
              <a href="#disiplin" className="hover:text-primary-950 transition-colors">Disiplin</a>
              <a href="#metode" className="hover:text-primary-950 transition-colors">Metode</a>
              <a href="#fitur" className="hover:text-primary-950 transition-colors">Fitur</a>
              <a href="#arsip" className="hover:text-primary-950 transition-colors">Arsip</a>
            </nav>
            <Button
              onClick={() => navigate('/login')}
              className="bg-primary-950 hover:bg-primary-900 text-white h-9 px-4 text-xs font-mono uppercase tracking-wider"
            >
              Masuk
              <ArrowRight className="h-3 w-3 ml-1.5" />
            </Button>
          </div>
        </header>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="border-b border-paper-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Left: headline + CTA */}
            <div className="lg:col-span-7 relative">
              {/* Margin marker — like a journal annotation */}
              <div className="hidden lg:block absolute -left-12 top-2 h-12 w-px bg-primary-950/30" />
              <div className="hidden lg:block absolute -left-12 top-2 text-[10px] font-mono uppercase tracking-[0.18em] -rotate-90 origin-top-left translate-y-12 text-primary-950/40 whitespace-nowrap">
                FOL.&nbsp;01 · 2026
              </div>

              <div className="inline-flex items-center gap-3 mb-8">
                <span className="h-px w-10 bg-primary-950" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-primary-950">
                  Est. 2020 · Bimbingan Karya Ilmiah
                </span>
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-[5.5rem] text-primary-950 leading-[0.98] tracking-tight">
                Dari ide riset,
                <br />
                ke panggung{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 italic">lomba</span>
                  <span aria-hidden className="absolute left-0 right-0 bottom-1 h-3 bg-ink-highlighter/80 -z-0" />
                </span>
                .
                <br />
                <span className="text-text-secondary">Satu platform.</span>
              </h1>

              <p className="mt-8 text-lg text-text-secondary leading-relaxed max-w-xl">
                BKI mengelola seluruh siklus bimbingan karya ilmiah — penelitian, makalah,
                presentasi — dengan jadwal, tugas, laporan, dan komunikasi wali yang
                terstruktur seperti jurnal riset.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-primary-950 hover:bg-primary-900 text-white h-12 px-6 font-semibold"
                >
                  Mulai bimbingan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <a
                  href="#disiplin"
                  className="inline-flex items-center gap-2 h-12 px-5 text-sm font-mono uppercase tracking-wider text-primary-950 hover:bg-paper-100 rounded-md transition-colors"
                >
                  Lihat metodologi
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Inline mini "data sheet" */}
              <dl className="mt-12 grid grid-cols-3 gap-6 max-w-md pt-6 border-t border-paper-200">
                {STATS.slice(0, 3).map((s) => (
                  <div key={s.label}>
                    <dt className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary mb-1">
                      {s.label}
                    </dt>
                    <dd className="font-display text-3xl text-primary-950 tabular-nums leading-none">
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right: layered specimen card */}
            <div className="lg:col-span-5 relative">
              {/* Back card — tilted, looks like archived page */}
              <div
                aria-hidden
                className="absolute inset-0 -rotate-2 bg-paper-100 border border-paper-200 rounded-sm shadow-sm translate-x-3 translate-y-3"
              />
              {/* Front card — the specimen sheet */}
              <div className="relative bg-white border border-paper-200 rounded-sm shadow-lift p-7 sm:p-9">
                {/* Header strip */}
                <div className="flex items-center justify-between pb-4 border-b border-paper-200 mb-5">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary">
                      Form · 2026/01
                    </p>
                    <p className="font-mono text-xs text-primary-950 font-semibold mt-1">
                      Spesimen Bimbingan
                    </p>
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary text-right">
                    <p>Kelas BKI</p>
                    <p>SMA · MA · SMP</p>
                  </div>
                </div>

                {/* Field rows */}
                <SpecimenRow label="Pendekatan" value="Tim 4–6 murid" />
                <SpecimenRow label="Durasi sesi" value="60–90 menit" />
                <SpecimenRow label="Media" value="Online · Offline" />
                <SpecimenRow label="Dokumentasi" value="PDF · Foto · Drive" />
                <SpecimenRow label="Rubrik" value="5 dimensi, skala 1–10" />
                <SpecimenRow label="Komunikasi wali" value="WhatsApp · Email" />

                {/* Stamp */}
                <div className="mt-7 flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                    <p>Diverifikasi oleh</p>
                    <p className="text-primary-950 font-semibold mt-0.5">Tim Pembimbing BKI</p>
                  </div>
                  <div className="rotate-[-8deg] border-2 border-primary-950/70 text-primary-950/70 font-mono text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm">
                    Approved
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <p className="mt-4 text-[10px] font-mono uppercase tracking-wider text-text-tertiary text-right">
                <sup>★</sup> setiap tim memiliki spesimen unik sesuai divisi
              </p>
            </div>
          </div>
        </section>

        {/* ── Roles strip ──────────────────────────────────────────────── */}
        <section className="border-b border-paper-200 bg-paper-100/40">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 lg:py-14">
            <div className="flex items-baseline justify-between mb-7 flex-wrap gap-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-primary-950 mb-2">
                  Pilih peranmu
                </p>
                <h2 className="font-display text-3xl sm:text-4xl text-primary-950 leading-tight">
                  Empat pintu masuk, satu sistem.
                </h2>
              </div>
              <p className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                4 peran · 1 platform
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {ROLES.map(({ role, code, label, subtitle, icon: Icon }) => (
                <button
                  key={role}
                  onClick={() => navigate(`/login?role=${role}`)}
                  className="group relative bg-white border border-paper-200 hover:border-primary-950 rounded-sm p-5 text-left transition-all hover:shadow-lift hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between mb-6">
                    <Icon className="h-6 w-6 text-primary-950" strokeWidth={1.5} />
                    <span className="text-[10px] font-mono font-bold text-text-tertiary tracking-wider">
                      [{code}]
                    </span>
                  </div>
                  <p className="font-display text-2xl text-primary-950 leading-tight mb-1">{label}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{subtitle}</p>
                  <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-text-tertiary group-hover:text-primary-950 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Disiplin ─────────────────────────────────────────────────── */}
        <section id="disiplin" className="border-b border-paper-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
            <SectionHead
              eyebrow="Disiplin"
              title={<>Tiga arah bimbingan,<br/>satu disiplin riset.</>}
              description="Tiap tim memilih kombinasi yang sesuai kebutuhan dan target lombanya — coach yang mendampingi sudah spesialis di divisi tersebut."
            />

            <div className="grid lg:grid-cols-3 gap-px bg-paper-200 border border-paper-200 rounded-sm overflow-hidden">
              {DISCIPLINES.map((d) => (
                <div key={d.code} className="bg-paper-50 p-7 lg:p-9 relative group">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">
                      {d.code}
                    </span>
                    <span className="h-px flex-1 bg-paper-200" />
                  </div>
                  <d.icon className="h-7 w-7 text-primary-950 mb-5" strokeWidth={1.5} />
                  <h3 className="font-display text-3xl text-primary-950 leading-tight mb-3">{d.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-5">{d.description}</p>
                  <ul className="space-y-1 font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
                    {d.notes.map((n) => (
                      <li key={n} className="flex items-center gap-2">
                        <span className="text-primary-950">›</span>
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Metode ───────────────────────────────────────────────────── */}
        <section id="metode" className="border-b border-paper-200 bg-paper-100/40">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
            <SectionHead
              eyebrow="Metode"
              title="Empat langkah, terdokumentasi."
              description="Setiap tim melewati alur yang sama — dari pemetaan minat hingga laporan transparan. Tidak ada bagian yang ditebak."
            />

            <ol className="grid lg:grid-cols-4 gap-px bg-paper-200 border border-paper-200 rounded-sm overflow-hidden">
              {METHOD_STEPS.map((s, i) => (
                <li key={s.n} className="bg-paper-50 p-7 lg:p-8 relative">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-display text-6xl text-primary-950 tabular-nums leading-none">
                      {s.n}
                    </span>
                    {i < METHOD_STEPS.length - 1 && (
                      <span aria-hidden className="hidden lg:flex flex-1 items-center gap-1 mb-2">
                        <span className="h-px flex-1 border-t border-dashed border-primary-950/30" />
                        <ArrowRight className="h-3 w-3 text-primary-950/40" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-primary-950 mb-1.5">{s.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Fitur (bento grid) ───────────────────────────────────────── */}
        <section id="fitur" className="border-b border-paper-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
            <SectionHead
              eyebrow="Fitur"
              title="Semua urusan bimbingan, satu dashboard."
              description="Modul yang sudah saling terhubung — sehingga coach tidak perlu pindah aplikasi untuk catat sesi, kirim laporan, atau atur jadwal."
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={cn(
                    'group bg-paper-50 border border-paper-200 rounded-sm p-6 hover:bg-white hover:border-primary-950 transition-all relative overflow-hidden',
                    f.span,
                  )}
                >
                  {/* Subtle hover grid */}
                  <div className="absolute inset-0 bg-grid-fine bg-grid-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <f.icon className="h-6 w-6 text-primary-950 mb-5" strokeWidth={1.5} />
                    <h3 className="font-display text-2xl text-primary-950 leading-tight mb-2">{f.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Arsip tim ────────────────────────────────────────────────── */}
        <section id="arsip" className="border-b border-paper-200 bg-primary-950 text-white relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-grid-fine-inv bg-grid-md" />
          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
            <div className="flex items-baseline justify-between mb-12 flex-wrap gap-3">
              <div>
                <div className="inline-flex items-center gap-3 mb-5">
                  <span className="h-px w-10 bg-white/50" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-white/70">
                    Arsip
                  </span>
                </div>
                <h2 className="font-display text-4xl sm:text-5xl leading-tight max-w-2xl">
                  Tim yang sudah dibimbing.
                </h2>
              </div>
              <p className="text-xs font-mono uppercase tracking-wider text-white/50">
                Sample · {SHOWCASE.length} tim
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SHOWCASE.map((t) => (
                <div
                  key={t.code}
                  className="border border-white/15 hover:border-white/40 p-6 transition-all hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                      {t.code}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                      {t.year}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl leading-tight mb-5 text-white">
                    {t.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/10">
                    {t.divs.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] font-mono uppercase tracking-wider text-white/70 border border-white/20 px-2 py-0.5"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50">
              <span className="h-px w-12 bg-white/20" />
              <span>Arsip terbuka untuk wali murid pada tim terdaftar</span>
              <span className="h-px w-12 bg-white/20" />
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="border-b border-paper-200">
          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20 lg:py-28 text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-primary-950" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-primary-950">
                Mulai
              </span>
              <span className="h-px w-10 bg-primary-950" />
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary-950 leading-[1.05] mb-6">
              Bimbing satu generasi peneliti{' '}
              <span className="italic">Indonesia</span>.
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl mx-auto mb-10">
              Mulai sekarang — atau hubungi admin sekolahmu untuk dibuatkan akun.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => navigate('/login')}
                className="bg-primary-950 hover:bg-primary-900 text-white h-12 px-6 font-semibold"
              >
                Masuk Sekarang
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/register')}
                variant="outline"
                className="h-12 px-6 font-semibold border-primary-950 text-primary-950 hover:bg-primary-950 hover:text-white"
              >
                Daftar Gratis
              </Button>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="bg-paper-100 border-t border-paper-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
              <div>
                <Link to="/" className="flex items-center gap-2.5 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary-950 text-white flex items-center justify-center">
                    <GraduationCap className="h-4 w-4" strokeWidth={2.25} />
                  </div>
                  <div className="leading-tight">
                    <p className="font-extrabold text-primary-950 text-sm tracking-tight">BKI</p>
                    <p className="text-[9px] uppercase tracking-[0.18em] font-semibold text-text-tertiary">
                      Bimbingan Karya Ilmiah
                    </p>
                  </div>
                </Link>
                <p className="text-xs text-text-tertiary leading-relaxed">
                  Platform bimbingan karya ilmiah terstruktur untuk murid Indonesia.
                </p>
              </div>

              <FooterCol title="Produk" items={[
                { label: 'Disiplin', href: '#disiplin' },
                { label: 'Metode',   href: '#metode' },
                { label: 'Fitur',    href: '#fitur' },
                { label: 'Arsip',    href: '#arsip' },
              ]} />

              <FooterCol title="Akun" items={[
                { label: 'Masuk',           href: '/login',    isRoute: true },
                { label: 'Daftar',          href: '/register', isRoute: true },
              ]} />

              <FooterCol title="Legal" items={[
                { label: 'Kebijakan Privasi', href: '/privacy', isRoute: true },
                { label: 'Syarat & Ketentuan', href: '/terms',  isRoute: true },
              ]} />
            </div>

            <div className="pt-6 border-t border-paper-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-text-tertiary">
              <p>© {new Date().getFullYear()} BKI — All rights reserved.</p>
              <p className="uppercase tracking-wider">Made for Indonesian students · {new Date().getFullYear()}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────── */

interface SectionHeadProps {
  eyebrow: string
  title: React.ReactNode
  description?: string
}
function SectionHead({ eyebrow, title, description }: SectionHeadProps) {
  return (
    <div className="max-w-3xl mb-14">
      <div className="inline-flex items-center gap-3 mb-5">
        <span className="h-px w-10 bg-primary-950" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-semibold text-primary-950">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-primary-950 leading-[1.02] mb-5">
        {title}
      </h2>
      {description && (
        <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl">
          {description}
        </p>
      )}
    </div>
  )
}

function SpecimenRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 py-2 border-b border-dashed border-paper-200 last:border-b-0">
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-tertiary w-32 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-primary-950 font-medium">{value}</span>
    </div>
  )
}

interface FooterColProps {
  title: string
  items: Array<{ label: string; href: string; isRoute?: boolean }>
}
function FooterCol({ title, items }: FooterColProps) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] font-bold text-primary-950 mb-4">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label}>
            {item.isRoute ? (
              <Link to={item.href} className="text-xs text-text-secondary hover:text-primary-950 transition-colors">
                {item.label}
              </Link>
            ) : (
              <a href={item.href} className="text-xs text-text-secondary hover:text-primary-950 transition-colors">
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

