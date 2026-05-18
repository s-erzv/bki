import {
  DocumentLayout, Heading, SubHeading, Para, Bullets, Callout, Strong,
} from '@/components/shared/DocumentLayout'

const TOC = [
  { id: 'tentang',       label: 'Tentang dokumen ini' },
  { id: 'data',          label: 'Data yang kami kumpulkan' },
  { id: 'google',        label: 'Akses ke akun Google Anda' },
  { id: 'penggunaan',    label: 'Bagaimana data digunakan' },
  { id: 'berbagi',       label: 'Pihak ketiga & berbagi data' },
  { id: 'retensi',       label: 'Penyimpanan & penghapusan' },
  { id: 'keamanan',      label: 'Keamanan' },
  { id: 'anak',          label: 'Pengguna di bawah umur' },
  { id: 'hak',           label: 'Hak Anda' },
  { id: 'perubahan',     label: 'Perubahan kebijakan' },
  { id: 'kontak',        label: 'Kontak' },
]

export function PrivacyPolicy() {
  return (
    <DocumentLayout
      kind="Kebijakan Privasi"
      title="Bagaimana BKI memperlakukan data Anda."
      updatedAt="2026-05-19"
      toc={TOC}
    >
      <Heading id="tentang">1. Tentang dokumen ini</Heading>
      <Para>
        BKI (<Strong>Bimbingan Karya Ilmiah</Strong>) adalah platform manajemen
        bimbingan karya ilmiah yang melayani pembimbing (coach), murid, orang tua, dan
        administrator. Kebijakan ini menjelaskan data apa yang kami kumpulkan,
        mengapa kami memerlukannya, bagaimana kami menggunakannya, dan hak apa yang
        Anda miliki atas data tersebut.
      </Para>
      <Para>
        Dengan menggunakan layanan BKI di situs ini, Anda menyatakan telah membaca
        dan menyetujui kebijakan ini.
      </Para>

      <Heading id="data">2. Data yang kami kumpulkan</Heading>
      <SubHeading>2.1 Data akun</SubHeading>
      <Para>
        Saat akun Anda dibuat (oleh admin atau melalui pendaftaran), kami menyimpan:
      </Para>
      <Bullets items={[
        <>Nama lengkap, alamat email, dan nomor telepon (jika diberikan).</>,
        <>Peran (coach, murid, orang tua, atau admin) dan data terkait peran tersebut — misalnya divisi untuk coach, NISN/kelas/jurusan untuk murid.</>,
        <>Foto profil yang Anda unggah secara sukarela.</>,
      ]} />

      <SubHeading>2.2 Data aktivitas bimbingan</SubHeading>
      <Para>
        Selama Anda menggunakan layanan, kami mencatat:
      </Para>
      <Bullets items={[
        <>Tim riset, kelas yang dijadwalkan, sesi bimbingan yang berlangsung, dan tugas yang diberikan/dikumpulkan.</>,
        <>Laporan sesi: skor evaluasi murid (1–10), catatan, dokumentasi foto sesi yang diunggah coach.</>,
        <>Tautan ke folder Drive tim dan dokumen-dokumen yang Anda hubungkan ke platform.</>,
      ]} />

      <SubHeading>2.3 Data teknis</SubHeading>
      <Para>
        Server kami secara otomatis mencatat data teknis standar yang diperlukan
        untuk menjalankan layanan, seperti alamat IP, jenis browser, dan waktu akses.
        Data ini digunakan untuk diagnostik, pencegahan penyalahgunaan, dan
        keamanan — bukan untuk pemasaran.
      </Para>

      <Heading id="google">3. Akses ke akun Google Anda</Heading>
      <Para>
        Jika Anda memilih untuk login dengan Google atau memberikan izin akses
        tambahan, BKI meminta scope (lingkup) berikut. Anda diberitahu setiap scope
        yang diminta sebelum memberikan persetujuan.
      </Para>

      <Callout label="Scope dasar (untuk login)">
        <Strong>email</Strong> dan <Strong>profile</Strong> — digunakan hanya untuk
        mengidentifikasi akun Anda dan menampilkan nama serta foto profil di dashboard.
      </Callout>

      <Callout label="Scope Google Drive">
        <Strong>https://www.googleapis.com/auth/drive</Strong> — digunakan untuk
        mengunggah laporan sesi (PDF), foto dokumentasi, dan materi tugas ke folder
        Drive tim bimbingan yang sudah Anda tentukan. BKI <Strong>tidak</Strong>{' '}
        mengakses, membaca, atau memodifikasi file Drive Anda di luar folder-folder
        terkait kegiatan BKI yang Anda hubungkan secara eksplisit.
      </Callout>

      <Callout label="Scope Google Calendar">
        <Strong>https://www.googleapis.com/auth/calendar.events</Strong> —
        digunakan untuk membuat event kelas/sesi bimbingan, termasuk membuatkan
        tautan Google Meet otomatis. BKI hanya membuat dan memperbarui event yang
        terkait kegiatan bimbingan, bukan event pribadi Anda.
      </Callout>

      <SubHeading>3.1 Kepatuhan terhadap kebijakan Google</SubHeading>
      <Para>
        Penggunaan informasi yang diperoleh BKI dari Google API mengikuti{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-primary-950 underline underline-offset-4 font-medium">
          Google API Services User Data Policy
        </a>
        , termasuk persyaratan <Strong>Limited Use</Strong>. Secara khusus:
      </Para>
      <Bullets items={[
        <>Data yang kami akses dari Google hanya digunakan untuk fitur yang Anda lihat di dashboard BKI (penyimpanan laporan, penjadwalan, kolaborasi tim).</>,
        <>Kami tidak menjual data Google Anda, tidak menggunakannya untuk iklan, dan tidak menggunakannya untuk melatih model AI.</>,
        <>Akses ke data Google tidak dibaca oleh manusia kecuali dengan persetujuan eksplisit Anda untuk dukungan teknis, untuk alasan keamanan, atau jika diwajibkan hukum.</>,
        <>Anda dapat mencabut akses kapan saja di halaman pengaturan akun atau di {' '}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-primary-950 underline underline-offset-4 font-medium">myaccount.google.com/permissions</a>.</>,
      ]} />

      <Heading id="penggunaan">4. Bagaimana data digunakan</Heading>
      <Para>Kami menggunakan data yang dikumpulkan untuk:</Para>
      <Bullets items={[
        <>Menyediakan fungsi inti layanan: autentikasi, dashboard sesuai peran, jadwal, tugas, laporan.</>,
        <>Mengirim notifikasi WhatsApp pengingat sesi dan laporan kepada wali/murid yang berkepentingan.</>,
        <>Mendokumentasikan hasil sesi bimbingan dalam bentuk laporan tersusun yang dibagikan kepada wali.</>,
        <>Memelihara keamanan, mencegah penyalahgunaan, dan memperbaiki keandalan layanan.</>,
        <>Memenuhi kewajiban hukum dan menjawab permintaan resmi otoritas yang berwenang.</>,
      ]} />
      <Para>
        Kami <Strong>tidak</Strong> menjual data pribadi Anda. Kami juga tidak
        menggunakan data Anda untuk pemasaran pihak ketiga.
      </Para>

      <Heading id="berbagi">5. Pihak ketiga & berbagi data</Heading>
      <Para>BKI menggunakan layanan pihak ketiga berikut untuk menjalankan platform:</Para>
      <Bullets items={[
        <><Strong>Supabase</Strong> — penyedia database, autentikasi, dan storage. Data akun & aktivitas Anda disimpan di server Supabase. Lihat{' '}
          <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer" className="text-primary-950 underline underline-offset-4 font-medium">kebijakan privasi Supabase</a>.
        </>,
        <><Strong>Google (Drive, Calendar, OAuth)</Strong> — jika Anda menghubungkan akun Google, data Drive/Calendar tertentu diakses sesuai scope yang dijelaskan di bagian 3.</>,
        <><Strong>Fonnte</Strong> — gateway pengiriman pesan WhatsApp. Nomor penerima dan isi pesan reminder dikirim ke layanan ini untuk diteruskan ke WhatsApp.</>,
      ]} />
      <Para>
        Data laporan sesi bimbingan dapat dilihat oleh wali murid terkait dan tim
        pembimbing internal BKI. Selain itu, data tidak dibagikan ke pihak lain kecuali
        atas izin tertulis Anda atau jika diwajibkan hukum.
      </Para>

      <Heading id="retensi">6. Penyimpanan & penghapusan</Heading>
      <Para>
        Data akun dan aktivitas disimpan selama akun Anda aktif. Beberapa data
        (seperti tim, sesi, dan murid) menggunakan penghapusan ringan (soft delete) —
        data tidak segera dihapus permanen agar dapat dipulihkan oleh administrator
        jika terjadi penghapusan tidak sengaja.
      </Para>
      <Para>
        Anda dapat meminta penghapusan akun dan data terkait dengan menghubungi
        administrator BKI melalui kontak di bagian 11. Setelah permintaan diverifikasi,
        kami akan menghapus data identifikasi pribadi Anda dalam <Strong>30 hari kerja</Strong>,
        kecuali jika ada kewajiban hukum untuk menyimpannya lebih lama.
      </Para>
      <Para>
        Token Google (OAuth refresh token) langsung dicabut dan dihapus dari server
        kami saat Anda memutuskan koneksi akun Google atau menghapus akun BKI.
      </Para>

      <Heading id="keamanan">7. Keamanan</Heading>
      <Para>Kami menerapkan langkah-langkah teknis dan organisasi standar industri:</Para>
      <Bullets items={[
        <>Seluruh komunikasi dengan server menggunakan enkripsi TLS/HTTPS.</>,
        <>Password disimpan dalam bentuk hash, tidak pernah dalam bentuk plaintext.</>,
        <>Database dilindungi oleh Row-Level Security (RLS) — setiap pengguna hanya dapat mengakses data yang menjadi haknya sesuai peran.</>,
        <>OAuth refresh token disimpan di sisi server dan tidak pernah terekspos ke browser.</>,
      ]} />
      <Para>
        Meskipun demikian, tidak ada sistem yang 100% aman. Jika Anda menduga ada
        akses tidak sah ke akun Anda, segera ganti password dan hubungi kami.
      </Para>

      <Heading id="anak">8. Pengguna di bawah umur</Heading>
      <Para>
        Layanan BKI dirancang untuk konteks pendidikan dan dapat digunakan oleh
        siswa SMP/SMA, sebagian di antaranya mungkin berusia di bawah 18 tahun.
        Akun untuk murid dibuat oleh institusi/admin atau oleh orang tua/wali yang
        berperan sebagai pendamping. Orang tua/wali memiliki hak untuk meninjau data
        anaknya dan meminta penghapusan kapan saja.
      </Para>

      <Heading id="hak">9. Hak Anda</Heading>
      <Para>Sebagai pengguna, Anda berhak untuk:</Para>
      <Bullets items={[
        <>Mengakses dan meninjau data pribadi yang kami simpan tentang Anda.</>,
        <>Memperbarui atau mengoreksi data yang tidak akurat melalui dashboard atau dengan menghubungi admin.</>,
        <>Mencabut izin akses Google kapan saja (lihat bagian 3.1).</>,
        <>Meminta penghapusan akun dan data pribadi Anda.</>,
        <>Mengajukan keluhan tentang penanganan data ke kontak di bagian 11.</>,
      ]} />

      <Heading id="perubahan">10. Perubahan kebijakan</Heading>
      <Para>
        Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Tanggal "Diperbarui"
        di bagian atas dokumen menunjukkan kapan revisi terakhir dilakukan. Perubahan
        signifikan akan diberitahukan melalui email atau notifikasi di dashboard
        sebelum berlaku. Penggunaan layanan setelah pembaruan berarti Anda menerima
        kebijakan yang direvisi.
      </Para>

      <Heading id="kontak">11. Kontak</Heading>
      <Para>
        Untuk pertanyaan, permintaan penghapusan data, atau keluhan terkait privasi,
        silakan hubungi:
      </Para>
      <Callout label="Privacy contact">
        BKI — Bimbingan Karya Ilmiah<br />
        Email: <Strong>privacy@bki.id</Strong><br />
        Anda biasanya akan menerima balasan dalam 5 hari kerja.
      </Callout>
    </DocumentLayout>
  )
}
