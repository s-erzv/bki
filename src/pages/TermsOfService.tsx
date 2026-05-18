import {
  DocumentLayout, Heading, SubHeading, Para, Bullets, Callout, Strong,
} from '@/components/shared/DocumentLayout'

const TOC = [
  { id: 'penerimaan',  label: 'Penerimaan ketentuan' },
  { id: 'layanan',     label: 'Tentang layanan' },
  { id: 'akun',        label: 'Akun pengguna' },
  { id: 'penggunaan',  label: 'Tata cara penggunaan' },
  { id: 'konten',      label: 'Konten Anda' },
  { id: 'integrasi',   label: 'Integrasi pihak ketiga' },
  { id: 'larangan',    label: 'Larangan' },
  { id: 'penghentian', label: 'Penghentian akses' },
  { id: 'disclaimer',  label: 'Penafian & batasan' },
  { id: 'hukum',       label: 'Hukum yang berlaku' },
  { id: 'perubahan',   label: 'Perubahan ketentuan' },
  { id: 'kontak',      label: 'Kontak' },
]

export function TermsOfService() {
  return (
    <DocumentLayout
      kind="Syarat & Ketentuan"
      title="Aturan main menggunakan BKI."
      updatedAt="2026-05-19"
      toc={TOC}
    >
      <Heading id="penerimaan">1. Penerimaan ketentuan</Heading>
      <Para>
        Selamat datang di BKI (<Strong>Bimbingan Karya Ilmiah</Strong>). Dengan
        mengakses atau menggunakan layanan kami di situs ini ("Layanan"), Anda
        menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh
        ketentuan-ketentuan di bawah ini ("Syarat"). Jika Anda tidak menyetujui,
        mohon untuk tidak menggunakan Layanan.
      </Para>

      <Heading id="layanan">2. Tentang layanan</Heading>
      <Para>
        BKI menyediakan platform manajemen bimbingan karya ilmiah untuk pembimbing
        (coach), murid, orang tua/wali, dan administrator. Fitur inti meliputi
        penjadwalan kelas, pencatatan sesi bimbingan, pemberian dan pengumpulan
        tugas, pelaporan, dan integrasi dengan layanan Google (Drive, Calendar,
        Meet) serta WhatsApp untuk notifikasi.
      </Para>

      <Heading id="akun">3. Akun pengguna</Heading>
      <SubHeading>3.1 Pembuatan akun</SubHeading>
      <Para>
        Akun BKI dibuat oleh administrator institusi atau melalui proses pendaftaran
        yang tersedia. Setiap akun terikat pada satu peran: coach, student (murid),
        parent (orang tua/wali), atau admin. Anda bertanggung jawab atas akurasi data
        yang diberikan saat pembuatan akun.
      </Para>
      <SubHeading>3.2 Keamanan akun</SubHeading>
      <Para>
        Anda bertanggung jawab menjaga kerahasiaan kredensial login (email dan
        password). Jangan berbagi akun atau menggunakan akun milik orang lain.
        Beritahu admin segera jika Anda menduga ada akses tidak sah.
      </Para>
      <SubHeading>3.3 Murid di bawah umur</SubHeading>
      <Para>
        Akun murid yang berusia di bawah 18 tahun dibuat dengan sepengetahuan
        institusi pendidikan atau orang tua/wali. Orang tua/wali bertanggung jawab
        atas penggunaan akun oleh anaknya.
      </Para>

      <Heading id="penggunaan">4. Tata cara penggunaan</Heading>
      <Para>
        Layanan ditujukan untuk kegiatan bimbingan akademik yang sah. Anda setuju
        untuk:
      </Para>
      <Bullets items={[
        <>Menggunakan Layanan hanya untuk tujuan pendidikan dan administrasi bimbingan ilmiah.</>,
        <>Tidak menyalahgunakan fitur notifikasi WhatsApp untuk pesan-pesan di luar konteks bimbingan.</>,
        <>Menjaga sopan santun dalam catatan, laporan, dan komunikasi di dalam platform.</>,
        <>Mematuhi hukum yang berlaku di Indonesia saat menggunakan Layanan.</>,
      ]} />

      <Heading id="konten">5. Konten Anda</Heading>
      <Para>
        Anda tetap menjadi pemilik dari semua konten yang Anda unggah ke Layanan —
        termasuk foto sesi, laporan, catatan, dan dokumen riset. Dengan mengunggah
        konten, Anda memberi BKI lisensi terbatas, non-eksklusif, dan bebas royalti
        untuk menyimpan, menampilkan, dan memproses konten tersebut <Strong>semata-mata
        untuk menyediakan Layanan kepada Anda</Strong> dan pengguna lain yang berhak
        (misalnya wali murid yang ingin melihat laporan anaknya).
      </Para>
      <Para>
        Anda bertanggung jawab memastikan bahwa konten yang Anda unggah:
      </Para>
      <Bullets items={[
        <>Tidak melanggar hak cipta, privasi, atau hak pihak lain.</>,
        <>Tidak mengandung materi ilegal, kekerasan, ujaran kebencian, atau pornografi.</>,
        <>Memiliki izin yang diperlukan jika berisi foto/data orang lain.</>,
      ]} />

      <Heading id="integrasi">6. Integrasi pihak ketiga</Heading>
      <Para>
        Jika Anda menghubungkan akun Google ke BKI, Anda juga tunduk pada{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="text-primary-950 underline underline-offset-4 font-medium">Google Terms of Service</a>{' '}
        untuk fitur yang melibatkan Drive, Calendar, dan Meet. BKI tidak
        bertanggung jawab atas perubahan, gangguan, atau kebijakan layanan Google
        di luar kendali kami.
      </Para>
      <Para>
        Notifikasi WhatsApp diteruskan melalui gateway pihak ketiga (Fonnte) dan
        pengiriman akhir ditangani oleh WhatsApp. Kami tidak menjamin pengiriman
        notifikasi 100% real-time karena bergantung pada layanan pihak tersebut.
      </Para>

      <Heading id="larangan">7. Larangan</Heading>
      <Para>Anda dilarang untuk:</Para>
      <Bullets items={[
        <>Mengakses sistem atau data milik pengguna lain tanpa izin.</>,
        <>Mencoba membobol, melakukan reverse engineering, atau menonaktifkan fitur keamanan Layanan.</>,
        <>Menggunakan bot, scraper, atau cara otomatis untuk mengambil data dari Layanan dalam jumlah besar tanpa persetujuan tertulis.</>,
        <>Mengirim spam, malware, atau konten yang merugikan pengguna lain.</>,
        <>Menggunakan Layanan untuk kegiatan yang melanggar hukum Indonesia atau hak pihak ketiga.</>,
      ]} />

      <Heading id="penghentian">8. Penghentian akses</Heading>
      <Para>
        Kami berhak menangguhkan atau menghentikan akses Anda ke Layanan jika
        Anda melanggar Syarat ini, atau jika ada indikasi penyalahgunaan yang
        membahayakan pengguna lain. Anda juga dapat menghentikan akun Anda kapan
        saja dengan menghubungi admin (lihat bagian 12).
      </Para>
      <Para>
        Setelah penghentian, data Anda akan diperlakukan sesuai{' '}
        <Strong>Kebijakan Privasi</Strong>, khususnya bagian Penyimpanan & Penghapusan.
      </Para>

      <Heading id="disclaimer">9. Penafian & batasan tanggung jawab</Heading>
      <Para>
        Layanan disediakan <Strong>"sebagaimana adanya"</Strong> dan{' '}
        <Strong>"sebagaimana tersedia"</Strong>. Kami berusaha menjaga keandalan
        dan keamanan Layanan, tetapi tidak memberikan jaminan bahwa Layanan akan
        selalu bebas gangguan, bebas dari kesalahan, atau memenuhi setiap kebutuhan
        spesifik Anda.
      </Para>
      <Callout label="Batasan tanggung jawab">
        Sejauh diizinkan oleh hukum, BKI tidak bertanggung jawab atas kerugian
        tidak langsung, konsekuensial, atau insidental yang timbul dari penggunaan
        Layanan — termasuk kehilangan data, kehilangan keuntungan, atau gangguan
        usaha. Tanggung jawab keseluruhan BKI dibatasi pada nilai biaya yang Anda
        bayarkan (jika ada) atas Layanan dalam 12 bulan terakhir.
      </Callout>

      <Heading id="hukum">10. Hukum yang berlaku</Heading>
      <Para>
        Syarat ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia.
        Setiap sengketa yang timbul akan diselesaikan terlebih dahulu secara
        musyawarah. Jika tidak tercapai kesepakatan, sengketa akan diselesaikan
        melalui Pengadilan Negeri yang berwenang di Indonesia.
      </Para>

      <Heading id="perubahan">11. Perubahan ketentuan</Heading>
      <Para>
        Kami dapat memperbarui Syarat ini dari waktu ke waktu. Versi terbaru
        ditandai dengan tanggal "Diperbarui" di bagian atas dokumen. Perubahan
        material akan diumumkan melalui dashboard atau email. Dengan tetap
        menggunakan Layanan setelah pembaruan berlaku, Anda dianggap menerima
        Syarat yang direvisi.
      </Para>

      <Heading id="kontak">12. Kontak</Heading>
      <Para>
        Untuk pertanyaan terkait Syarat ini atau penggunaan Layanan, silakan hubungi:
      </Para>
      <Callout label="Support contact">
        BKI — Bimbingan Karya Ilmiah<br />
        Email: <Strong>support@bki.id</Strong><br />
        Anda biasanya akan menerima balasan dalam 5 hari kerja.
      </Callout>
    </DocumentLayout>
  )
}
