import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  GraduationCap, Users, Heart, Shield, ArrowRight, Check, Menu, X,
  Calendar, ClipboardList, FileBarChart2, MessageCircle, FolderOpen, BarChart3,
  Microscope, FileText, Presentation, Star, Sparkles, Video,
  ChevronDown, Quote,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore, metadataRole } from '@/stores/authStore'
import { dashboardPath, onboardingPath } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database'

/* ─── Data ─────────────────────────────────────────────────────────── */

const ROLES: Array<{ role: UserRole; label: string; subtitle: string; icon: LucideIcon; color: string }> = [
  { role: 'coach',   label: 'Pembimbing', subtitle: 'Jadwalkan kelas, berikan tugas, dokumentasikan sesi',
    icon: GraduationCap, color: 'from-primary-500 to-primary-700' },
  { role: 'student', label: 'Murid',      subtitle: 'Akses kelas, kumpulkan tugas, pantau skor',
    icon: Users,         color: 'from-accent-teal to-primary-600' },
  { role: 'parent',  label: 'Wali Murid', subtitle: 'Pantau progres dan terima laporan WhatsApp',
    icon: Heart,         color: 'from-accent-purple to-primary-700' },
  { role: 'admin',   label: 'Admin',      subtitle: 'Kelola akun, tim, dan operasional sistem',
    icon: Shield,        color: 'from-slate-500 to-primary-950' },
]

const BENEFITS = [
  { icon: Calendar,       title: 'Jadwal terintegrasi', desc: 'Kelas tersinkronisasi dengan Google Calendar; tautan Meet dibuat otomatis.' },
  { icon: ClipboardList,  title: 'Penugasan terlacak',  desc: 'Pembimbing memberikan tugas, murid mengumpulkan; seluruhnya tercatat.' },
  { icon: FileBarChart2,  title: 'Laporan terdokumentasi', desc: 'Setiap sesi menghasilkan PDF yang diteruskan ke wali via WhatsApp.' },
  { icon: FolderOpen,     title: 'Penyimpanan terstruktur', desc: 'Folder Drive terorganisir per tim untuk dokumentasi yang konsisten.' },
]

const TOUR = [
  {
    eyebrow: 'Untuk pembimbing',
    title: 'Atur jadwal dan dokumentasikan sesi dengan efisien.',
    desc: 'Buat kelas sekali—Google Calendar dan tautan Meet langsung tersiapkan. Setelah sesi berakhir, isi formulir laporan singkat: PDF terbangun otomatis, foto tersimpan ke Drive, dan notifikasi terkirim ke wali murid melalui WhatsApp.',
    bullets: ['Sinkronisasi Google Calendar dan Meet', 'Formulir laporan ringkas', 'Notifikasi otomatis kepada wali'],
    mockup: 'coach' as const,
  },
  {
    eyebrow: 'Untuk murid',
    title: 'Seluruh aktivitas akademik dalam satu dashboard.',
    desc: 'Pantau tugas yang harus dikumpulkan, tenggat waktu, serta tautan Meet untuk kelas berikutnya. Kumpulkan hasil pekerjaan langsung dari dashboard—tidak perlu lagi menelusuri percakapan grup.',
    bullets: ['Filter tugas berdasarkan status', 'Pengingat otomatis menjelang tenggat', 'Riwayat skor yang transparan'],
    mockup: 'student' as const,
  },
  {
    eyebrow: 'Untuk wali murid',
    title: 'Pantau perkembangan akademik secara transparan.',
    desc: 'Setiap sesi bimbingan menghasilkan laporan PDF yang diteruskan ke nomor WhatsApp Anda. Skor lima dimensi—disiplin, keaktifan, komunikasi, etika, dan pemahaman—tercatat pada setiap pertemuan.',
    bullets: ['Laporan rutin melalui WhatsApp', 'Riwayat skor dan catatan pembimbing', 'Akses kapan saja melalui ponsel'],
    mockup: 'parent' as const,
  },
]

const STEPS = [
  { n: 1, title: 'Pendaftaran akun', desc: 'Daftarkan akun secara mandiri melalui halaman registrasi atau terima undangan dari administrator BKI.' },
  { n: 2, title: 'Akses dashboard', desc: 'Tampilan dashboard menyesuaikan peran Anda—pembimbing, murid, wali, atau administrator.' },
  { n: 3, title: 'Operasional berjalan', desc: 'Jadwal, tugas, dan laporan berjalan dalam alur yang terintegrasi dan terdokumentasi.' },
]

const TESTIMONIALS = [
  {
    quote: 'Sebelumnya kami mencatat sesi di Google Docs dan mengirim foto satu per satu ke wali murid melalui WhatsApp. Saat ini seluruh prosesnya terotomasi—pembimbing cukup mengisi formulir, distribusi laporan berjalan dengan sendirinya.',
    name: 'Bu Rina', role: 'Koordinator BKI · SMA',
  },
  {
    quote: 'Saya dapat melihat jadwal kelas dan tugas yang harus dikumpulkan pada satu tempat. Tidak perlu lagi menelusuri percakapan grup yang panjang.',
    name: 'Fairuz', role: 'Murid · Tim BKI-A02',
  },
  {
    quote: 'Setiap kali anak saya mengikuti sesi bimbingan, laporan PDF langsung dikirim ke WhatsApp. Skor dan catatan pembimbingnya cukup mendetail.',
    name: 'Pak Yudi', role: 'Wali Murid',
  },
]

const FAQS = [
  { q: 'Untuk siapa platform ini?', a: 'Murid jenjang SMP dan SMA yang mengikuti program bimbingan karya ilmiah—penelitian, penulisan makalah, atau presentasi untuk kompetisi—beserta pembimbing, wali murid, dan administrator yang mengelolanya.' },
  { q: 'Bagaimana cara mendapatkan akses?', a: 'Pengguna dapat masuk ke platform menggunakan akun yang telah didaftarkan. Koordinasi mengenai akun bimbingan biasanya dikelola oleh sekolah atau koordinator tim terkait.' },
  { q: 'Bagaimana data pengguna dilindungi?', a: 'Basis data menerapkan Row-Level Security—setiap peran hanya dapat mengakses data yang menjadi haknya. Token Google disimpan di sisi server dan tidak pernah terekspos ke browser. Penjelasan selengkapnya tersedia di halaman Kebijakan Privasi.' },
  { q: 'Apakah akun Google diperlukan?', a: 'Login dapat menggunakan email dan kata sandi. Akun Google bersifat opsional, hanya diperlukan apabila pembimbing ingin mengunggah laporan otomatis ke Drive atau membuat tautan Meet langsung dari kelas.' },
  { q: 'Bagaimana cara mulai menggunakan platform?', a: 'Klik tombol "Masuk" pada bagian atas halaman untuk mengakses dashboard. Pastikan Anda telah memiliki akun yang valid sesuai dengan peran Anda (Pembimbing, Murid, atau Wali Murid).' },
]

const DISCIPLINES = [
  { icon: Microscope,   title: 'Penelitian', desc: 'Pendampingan rumusan masalah, metode, hingga analisis data.' },
  { icon: FileText,     title: 'Makalah',    desc: 'Bimbingan penulisan ilmiah yang siap untuk kompetisi maupun publikasi.' },
  { icon: Presentation, title: 'Presentasi', desc: 'Pelatihan deck visual dan public speaking untuk panggung lomba.' },
]

const STATS = [
  { value: '500+', label: 'Murid dibimbing' },
  { value: '40+',  label: 'Tim aktif' },
  { value: '25+',  label: 'Pembimbing' },
  { value: '15+',  label: 'Lomba dimenangkan' },
]

/* ─── Page ─────────────────────────────────────────────────────────── */

export function LandingPage() {
  const navigate = useNavigate()
  const { session, profile, onboarded, sessionRestored, user } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    if (!sessionRestored || !session) return
    const r = profile?.role ?? metadataRole(user)
    if (!r) return
    const path = !onboarded ? (onboardingPath(r) ?? dashboardPath(r)) : dashboardPath(r)
    navigate(path, { replace: true })
  }, [session, profile, onboarded, sessionRestored, user, navigate])

  return (
    <div className="min-h-screen bg-white text-text-primary overflow-x-hidden">
      {/* ── Sticky nav ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-surface-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="leading-tight group">
            <p className="font-extrabold text-primary-950 text-base tracking-tight group-hover:text-primary-800 transition-colors">BKI</p>
            <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-text-tertiary hidden sm:block">
              Bimbingan Karya Ilmiah
            </p>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-text-secondary">
            <a href="#fitur" className="hover:text-primary-950 transition-colors">Fitur</a>
            <a href="#cara-kerja" className="hover:text-primary-950 transition-colors">Cara kerja</a>
            <a href="#testimoni" className="hover:text-primary-950 transition-colors">Testimoni</a>
            <a href="#faq" className="hover:text-primary-950 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex text-sm font-semibold text-text-secondary hover:text-primary-950 transition-colors px-3 py-2"
            >
              Masuk
            </button>
            <Button
              onClick={() => navigate('/register')}
              className="bg-primary-950 hover:bg-primary-900 text-white h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold"
            >
              Daftar
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-100"
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-surface-100 bg-white">
            <div className="px-5 py-3 space-y-1">
              {[
                { l: 'Fitur', h: '#fitur' },
                { l: 'Cara kerja', h: '#cara-kerja' },
                { l: 'Testimoni', h: '#testimoni' },
                { l: 'FAQ', h: '#faq' },
              ].map((i) => (
                <a
                  key={i.h}
                  href={i.h}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-50 hover:text-primary-950"
                >
                  {i.l}
                </a>
              ))}
              <button
                onClick={() => { setMenuOpen(false); navigate('/login') }}
                className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-primary-950 hover:bg-surface-50"
              >
                Masuk
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient blob backdrop */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-100 opacity-60 blur-3xl" />
          <div className="absolute top-40 -left-32 h-[24rem] w-[24rem] rounded-full bg-primary-100 opacity-70 blur-3xl" />
          <div className="absolute inset-0 bg-dot-grid bg-grid-md opacity-50" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 pt-12 sm:pt-16 lg:pt-24 pb-16 sm:pb-20 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Copy */}
            <div className="lg:col-span-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-surface-200 shadow-soft px-3 py-1 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-primary-950">
                  Platform Bimbingan Karya Ilmiah
                </span>
              </div>

              <h1 className="text-[2rem] leading-[1.1] sm:text-5xl sm:leading-[1.05] lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-primary-950 mb-4 sm:mb-6">
                Satu platform untuk{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">seluruh siklus</span>
                  <span aria-hidden className="absolute left-0 right-0 bottom-0.5 sm:bottom-1 h-2.5 sm:h-3 lg:h-4 bg-brand-100 -z-0" />
                </span>{' '}
                bimbingan karya ilmiah.
              </h1>

              <p className="text-sm sm:text-lg lg:text-xl text-text-secondary leading-relaxed mb-7 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                Jadwal kelas, penugasan, dokumentasi sesi, dan komunikasi dengan wali murid berjalan terintegrasi—dirancang untuk program bimbingan karya ilmiah jenjang SMP dan SMA.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 mb-8">
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-primary-950 hover:bg-primary-900 text-white h-12 px-6 text-base font-semibold shadow-lift"
                >
                  Masuk ke Platform
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  variant="outline"
                  className="h-12 px-6 text-base font-semibold border-surface-300 text-primary-950 hover:bg-surface-50"
                >
                  Belum punya akun? Daftar
                </Button>
              </div>

              {/* Micro-proof */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-xs text-text-tertiary">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-accent-green flex-shrink-0" />
                  Dashboard Terpusat
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-accent-green flex-shrink-0" />
                  Notifikasi WhatsApp
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-accent-green flex-shrink-0" />
                  Google Drive
                </span>
              </div>
            </div>

            {/* Product preview */}
            <div className="lg:col-span-6 relative">
              <HeroMockup />
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-y border-surface-100 bg-white/60 backdrop-blur">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-surface-100">
            {STATS.map((s, i) => (
              <div key={s.label} className={cn(
                'py-5 lg:py-7 px-4 text-center',
                i < 2 && 'lg:border-r border-surface-100',
              )}>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-primary-950 tabular-nums">{s.value}</p>
                <p className="text-[11px] sm:text-xs text-text-tertiary font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits / what you get ──────────────────────────────────── */}
      <section id="fitur" className="py-14 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow="Fitur inti"
            title="Empat modul yang membangun rutinitas bimbingan."
            description="Mengurangi koordinasi manual—dokumentasi tercatat, jadwal tersinkronisasi, dan laporan terdistribusi secara otomatis."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="group rounded-2xl border border-surface-200 bg-white p-6 hover:border-primary-300 hover:shadow-lift transition-all"
              >
                <div className="h-11 w-11 rounded-xl bg-primary-50 text-primary-950 flex items-center justify-center mb-5 group-hover:bg-primary-950 group-hover:text-white transition-colors">
                  <b.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-primary-950 text-base mb-2">{b.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product tour (alternating) ───────────────────────────────── */}
      <section className="py-14 sm:py-20 lg:py-28 bg-surface-50 border-y border-surface-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow="Tur produk"
            title="Dirancang untuk semua peran dalam ekosistem bimbingan."
            description="Setiap peran mendapatkan antarmuka dan perangkat yang sesuai dengan tanggung jawabnya."
            center
          />

          <div className="space-y-16 sm:space-y-20 lg:space-y-28">
            {TOUR.map((t, i) => (
              <div
                key={t.title}
                className={cn(
                  'grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center',
                  i % 2 === 1 && 'lg:[&>*:first-child]:order-2',
                )}
              >
                <div className="order-2 lg:order-none">
                  <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-brand-600 mb-3">
                    {t.eyebrow}
                  </p>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-primary-950 leading-tight mb-4">
                    {t.title}
                  </h3>
                  <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6">
                    {t.desc}
                  </p>
                  <ul className="space-y-2.5">
                    {t.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-sm text-text-primary">
                        <span className="h-5 w-5 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-1 lg:order-none">
                  <TourMockup kind={t.mockup} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cara kerja (3 steps) ─────────────────────────────────────── */}
      <section id="cara-kerja" className="py-14 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow="Cara kerja"
            title="Tiga langkah menuju bimbingan yang terorganisir."
            description="Onboarding ringkas—dari pendaftaran akun hingga kelas pertama yang terjadwal."
            center
          />
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 relative">
            {/* Connector line on desktop */}
            <div aria-hidden className="hidden sm:block absolute top-7 left-[16%] right-[16%] h-px border-t-2 border-dashed border-surface-200" />
            {STEPS.map((s) => (
              <div key={s.n} className="relative bg-white rounded-2xl border border-surface-200 p-6 text-center">
                <div className="relative mx-auto h-14 w-14 rounded-full bg-primary-950 text-white flex items-center justify-center font-extrabold text-lg mb-5 ring-8 ring-white">
                  {s.n}
                </div>
                <h3 className="font-bold text-primary-950 text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disciplines ──────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24 bg-surface-50 border-y border-surface-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow="Disiplin bimbingan"
            title="Tiga arah bimbingan, satu metodologi riset."
            description="Setiap tim memilih kombinasi disiplin sesuai target lomba dan minatnya."
            center
          />
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
            {DISCIPLINES.map((d) => (
              <div key={d.title} className="rounded-2xl bg-white border border-surface-200 p-6">
                <d.icon className="h-6 w-6 text-brand-500 mb-4" strokeWidth={1.75} />
                <h3 className="font-bold text-primary-950 text-lg mb-1.5">{d.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles grid ───────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow="Peran pengguna"
            title="Satu platform, empat dashboard."
            description="Pilih peran Anda untuk masuk ke ruang kerja yang sesuai."
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {ROLES.map(({ role, label, subtitle, icon: Icon, color }) => (
              <button
                key={role}
                onClick={() => navigate(`/login?role=${role}`)}
                className="group relative overflow-hidden text-left bg-white border border-surface-200 hover:border-primary-300 rounded-2xl p-6 transition-all hover:shadow-lift hover:-translate-y-0.5"
              >
                <div className={cn(
                  'h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-5 text-white shadow-soft',
                  color,
                )}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <p className="font-bold text-primary-950 mb-1">{label}</p>
                <p className="text-xs text-text-secondary leading-relaxed pr-6">{subtitle}</p>
                <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-text-tertiary group-hover:text-primary-950 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section id="testimoni" className="py-14 sm:py-20 lg:py-28 bg-surface-50 border-y border-surface-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow="Testimoni"
            title="Cerita dari pembimbing, murid, dan wali."
            center
          />
          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="bg-white rounded-2xl border border-surface-200 p-6 flex flex-col">
                <Quote className="h-5 w-5 text-brand-500 mb-4" />
                <blockquote className="text-sm sm:text-base text-text-primary leading-relaxed flex-1 mb-5">
                  "{t.quote}"
                </blockquote>
                <figcaption className="flex items-center gap-3 pt-4 border-t border-surface-100">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-primary-950 truncate">{t.name}</p>
                    <p className="text-xs text-text-tertiary truncate">{t.role}</p>
                  </div>
                  <div className="flex items-center gap-0.5 ml-auto">
                    {[0,1,2,3,4].map((i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="py-14 sm:py-20 lg:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-10">
          <SectionHeader
            eyebrow="Pertanyaan umum"
            title="Yang sering ditanyakan."
            center
          />
          <div className="space-y-2">
            {FAQS.map((f, i) => {
              const open = openFaq === i
              return (
                <div key={f.q} className="rounded-xl border border-surface-200 bg-white overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface-50 transition-colors"
                  >
                    <span className="font-semibold text-primary-950 text-sm sm:text-base">{f.q}</span>
                    <ChevronDown className={cn(
                      'h-4 w-4 text-text-tertiary flex-shrink-0 transition-transform',
                      open && 'rotate-180',
                    )} />
                  </button>
                  {open && (
                    <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed">
                      {f.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary-950 text-white">
        <div aria-hidden className="absolute inset-0 bg-dot-grid-inv bg-grid-md opacity-50" />
        <div aria-hidden className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-5">
            Mulai kelola bimbingan secara terstruktur.
          </h2>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Gunakan platform untuk koordinasi tim, dokumentasi sesi, dan pemantauan tugas dalam satu dashboard terintegrasi.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Button
              onClick={() => navigate('/login')}
              className="bg-white text-primary-950 hover:bg-white/90 h-12 px-6 text-base font-bold"
            >
              Masuk Sekarang
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              onClick={() => navigate('/register')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white h-12 px-6 text-base font-bold bg-transparent"
            >
              Daftar Akun
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-surface-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-10 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="inline-block leading-tight mb-4">
                <p className="font-extrabold text-primary-950 text-base tracking-tight">BKI</p>
                <p className="text-[9px] uppercase tracking-[0.16em] font-semibold text-text-tertiary">
                  Bimbingan Karya Ilmiah
                </p>
              </Link>
              <p className="text-sm text-text-tertiary leading-relaxed max-w-xs">
                Platform manajemen bimbingan karya ilmiah untuk pelajar Indonesia.
              </p>
            </div>

            <FooterCol title="Produk" items={[
              { l: 'Fitur',      h: '#fitur' },
              { l: 'Cara kerja', h: '#cara-kerja' },
              { l: 'Testimoni',  h: '#testimoni' },
              { l: 'FAQ',        h: '#faq' },
            ]} />
            <FooterCol title="Akun" items={[
              { l: 'Masuk',  h: '/login',    route: true },
              { l: 'Daftar', h: '/register', route: true },
            ]} />
            <FooterCol title="Legal" items={[
              { l: 'Kebijakan Privasi',  h: '/privacy', route: true },
              { l: 'Syarat & Ketentuan', h: '/terms',   route: true },
            ]} />
          </div>

          <div className="pt-6 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-tertiary">
            <p>© {new Date().getFullYear()} BKI — Bimbingan Karya Ilmiah</p>
            <p>Untuk pelajar Indonesia</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ─── Building blocks ──────────────────────────────────────────────── */

function SectionHeader({
  eyebrow, title, description, center,
}: { eyebrow: string; title: string; description?: string; center?: boolean }) {
  return (
    <div className={cn('max-w-3xl mb-10 sm:mb-14', center && 'mx-auto text-center')}>
      <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-brand-600 mb-3">
        {eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight text-primary-950 leading-[1.1] mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}

interface FooterColProps {
  title: string
  items: Array<{ l: string; h: string; route?: boolean }>
}
function FooterCol({ title, items }: FooterColProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider font-bold text-primary-950 mb-4">{title}</p>
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li key={i.l}>
            {i.route ? (
              <Link to={i.h} className="text-sm text-text-secondary hover:text-primary-950 transition-colors">
                {i.l}
              </Link>
            ) : (
              <a href={i.h} className="text-sm text-text-secondary hover:text-primary-950 transition-colors">
                {i.l}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ─── Hero product mockup ──────────────────────────────────────────── */

function HeroMockup() {
  return (
    <div className="relative max-w-md mx-auto lg:max-w-none lg:ml-auto">
      {/* Floating notification card — top-right */}
      <div className="hidden sm:block absolute -top-4 -right-2 lg:-right-6 z-20 bg-white rounded-2xl shadow-float border border-surface-200 px-4 py-3 max-w-[15rem] animate-fade-slide-in">
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent-green/10 text-accent-green flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary-950">Laporan terkirim</p>
            <p className="text-[11px] text-text-tertiary truncate">
              Wali murid Tim BKI-A02 via WA
            </p>
          </div>
        </div>
      </div>

      {/* Main dashboard card */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-surface-200 shadow-float overflow-hidden">
        {/* Top bar */}
        <div className="h-10 bg-surface-50 border-b border-surface-200 flex items-center gap-1.5 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-[10px] font-mono text-text-tertiary">bki.app/coach</span>
        </div>

        <div className="p-4 sm:p-6">
          {/* Greeting */}
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
            <div className="min-w-0">
              <p className="text-[11px] text-text-tertiary mb-0.5">Senin, 19 Mei</p>
              <p className="text-base sm:text-xl font-extrabold text-primary-950 truncate">Selamat datang, Bu Rina</p>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold flex-shrink-0">
              R
            </div>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-3 gap-2 mb-4 sm:mb-5">
            {[
              { v: '3', l: 'Kelas hari ini' },
              { v: '12', l: 'Tugas aktif' },
              { v: '5', l: 'Tim aktif' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-surface-50 p-2.5 sm:p-3 text-center">
                <p className="text-lg sm:text-2xl font-extrabold text-primary-950 tabular-nums leading-none">{s.v}</p>
                <p className="text-[9px] sm:text-[10px] text-text-tertiary mt-1 leading-tight">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Next class */}
          <div className="rounded-2xl bg-gradient-to-br from-primary-950 to-primary-800 text-white p-3.5 sm:p-4 relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-dot-grid-inv bg-grid-md opacity-50" />
            <div className="relative">
              <p className="text-[10px] uppercase tracking-wider font-bold text-white/60 mb-2">
                Kelas berikutnya
              </p>
              <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight truncate">Diskusi metodologi · Tim A02</p>
                  <p className="text-[11px] text-white/70 mt-1">Hari ini, 15.30 · 90 menit</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-accent-green/20 text-accent-green border border-accent-green/30 rounded-full px-2 py-1 flex-shrink-0">
                  <Video className="h-2.5 w-2.5" />
                  Meet
                </span>
              </div>
              <button className="text-xs font-bold text-white/90 inline-flex items-center gap-1.5">
                Buka kelas
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Task list mini — hidden on smallest screens to keep mockup compact */}
          <div className="hidden sm:block space-y-2 mt-3">
            {[
              { title: 'Tinjau draf abstrak Tim A02', tag: 'A02', done: false },
              { title: 'Periksa progres eksperimen kontrol', tag: 'A04', done: true },
            ].map((t) => (
              <div key={t.title} className="flex items-center gap-3 rounded-xl border border-surface-200 p-3">
                <span className={cn(
                  'h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                  t.done ? 'bg-accent-green border-accent-green' : 'border-surface-300',
                )}>
                  {t.done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </span>
                <p className={cn(
                  'text-xs sm:text-sm font-medium flex-1 truncate',
                  t.done ? 'text-text-tertiary line-through' : 'text-primary-950',
                )}>
                  {t.title}
                </p>
                <span className="text-[10px] font-mono font-bold text-text-tertiary bg-surface-50 rounded px-1.5 py-0.5">
                  {t.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating score card — bottom-left */}
      <div className="hidden sm:flex absolute -bottom-4 -left-2 lg:-left-6 z-20 bg-white rounded-2xl shadow-float border border-surface-200 px-4 py-3 items-center gap-3 animate-fade-slide-in">
        <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
          <BarChart3 className="h-4 w-4" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary">Skor rata-rata</p>
          <p className="text-base font-extrabold text-primary-950 tabular-nums">8.7 / 10</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Tour mockups (3 variants) ────────────────────────────────────── */

function TourMockup({ kind }: { kind: 'coach' | 'student' | 'parent' }) {
  return (
    <div className="relative">
      <div className="rounded-2xl sm:rounded-3xl border border-surface-200 bg-white shadow-lift overflow-hidden">
        <div className="h-9 bg-surface-50 border-b border-surface-200 flex items-center gap-1.5 px-4">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        <div className="p-5 sm:p-6">
          {kind === 'coach'   && <CoachMockup />}
          {kind === 'student' && <StudentMockup />}
          {kind === 'parent'  && <ParentMockup />}
        </div>
      </div>
    </div>
  )
}

function CoachMockup() {
  return (
    <div>
      <p className="text-xs text-text-tertiary mb-1">Senin, 19 Mei</p>
      <p className="text-base sm:text-lg font-extrabold text-primary-950 mb-5">Kelas hari ini</p>

      <div className="space-y-2.5">
        {[
          { time: '13.00', title: 'Eksperimen kontrol · Tim A01', media: 'Offline', color: 'bg-accent-amber/10 text-accent-amber border-accent-amber/30' },
          { time: '15.30', title: 'Diskusi metodologi · Tim A02', media: 'Meet',    color: 'bg-accent-green/10 text-accent-green border-accent-green/30', highlight: true },
          { time: '18.00', title: 'Tinjau draf · Tim A05',        media: 'Meet',    color: 'bg-accent-green/10 text-accent-green border-accent-green/30' },
        ].map((c) => (
          <div key={c.title} className={cn(
            'rounded-xl border p-3.5 flex items-start gap-3',
            c.highlight ? 'border-primary-300 bg-primary-50/40' : 'border-surface-200',
          )}>
            <div className="text-xs font-bold text-primary-950 tabular-nums w-12 flex-shrink-0 pt-0.5">
              {c.time}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-primary-950 leading-tight">{c.title}</p>
              <p className="text-[10px] text-text-tertiary mt-1">Kelas reguler · 90 menit</p>
            </div>
            <span className={cn('text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 flex-shrink-0', c.color)}>
              {c.media}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StudentMockup() {
  return (
    <div>
      <p className="text-xs text-text-tertiary mb-1">Tugas aktif</p>
      <p className="text-base sm:text-lg font-extrabold text-primary-950 mb-5">Tiga tugas menanti</p>

      <div className="space-y-2.5">
        {[
          { title: 'Susun outline BAB 3 metodologi',  due: '2 hari lagi',   urgent: true },
          { title: 'Latihan presentasi 5 menit',      due: '5 hari lagi',   urgent: false },
          { title: 'Kumpulkan revisi abstrak',        due: '1 minggu lagi', urgent: false },
        ].map((t) => (
          <div key={t.title} className="rounded-xl border border-surface-200 p-3.5 flex items-start gap-3">
            <span className="h-4 w-4 rounded border-2 border-surface-300 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-primary-950 leading-tight">{t.title}</p>
              <p className={cn(
                'text-[10px] mt-1 font-semibold',
                t.urgent ? 'text-accent-red' : 'text-text-tertiary',
              )}>
                {t.urgent && '⏰ '}{t.due}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ParentMockup() {
  return (
    <div>
      <p className="text-xs text-text-tertiary mb-1">Laporan terbaru</p>
      <p className="text-base sm:text-lg font-extrabold text-primary-950 mb-5">Sesi 14 Mei · Tim BKI-A02</p>

      <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-surface-50 border border-surface-200 p-4 sm:p-5 mb-3">
        <p className="text-[10px] uppercase tracking-wider font-bold text-text-tertiary mb-3">Skor lima dimensi</p>
        <div className="space-y-2">
          {[
            { label: 'Disiplin',     score: 9 },
            { label: 'Keaktifan',    score: 8 },
            { label: 'Komunikasi',   score: 9 },
            { label: 'Etika',        score: 10 },
            { label: 'Pemahaman',    score: 8 },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-text-secondary w-20 flex-shrink-0">{s.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-700"
                  style={{ width: `${s.score * 10}%` }}
                />
              </div>
              <span className="text-xs font-bold text-primary-950 tabular-nums w-6 text-right">{s.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-surface-200 p-3 flex items-start gap-2.5">
        <MessageCircle className="h-4 w-4 text-accent-green flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Catatan pembimbing: <span className="text-primary-950 font-medium">"Progres riset sesuai target, antusiasme baik. Lanjutkan eksperimen kontrol pada pertemuan berikutnya."</span>
        </p>
      </div>
    </div>
  )
}
