import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

export interface ReportStudentScore {
  student_name: string
  score_discipline: number
  score_activeness: number
  score_communication: number
  score_ethics: number
  score_understanding: number
  notes: string | null
}

export interface ReportData {
  team_code: string
  team_research_title: string | null
  coach_name: string
  session_date: string  // ISO
  duration_mins: number
  media: 'online' | 'offline'
  location: string | null
  topic: string
  achievement: string | null
  homework: string | null
  evaluation: string | null
  students: ReportStudentScore[]
}

const NAVY = '#0f2060'
const INK = '#0a1840'
const TEXT = '#1e293b'
const MUTED = '#64748b'
const BORDER = '#e2e8f0'
const LIGHT_BG = '#f8fafc'

const styles = StyleSheet.create({
  page: {
    paddingTop:    40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize:   10,
    color: TEXT,
  },
  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
    marginBottom: 18,
  },
  brandBlock: {},
  brandTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 7,
    color: MUTED,
    marginTop: 2,
    letterSpacing: 1.5,
  },
  docMeta: { textAlign: 'right' },
  docKind: {
    fontSize: 7,
    color: NAVY,
    letterSpacing: 1.5,
    fontFamily: 'Helvetica-Bold',
  },
  docTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: INK,
    marginTop: 4,
  },

  /* Info grid */
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    backgroundColor: LIGHT_BG,
    borderRadius: 6,
    padding: 14,
  },
  infoCell: { width: '50%', paddingVertical: 4 },
  infoLabel: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  infoValue: { fontSize: 10, color: INK },

  /* Section */
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginTop: 18,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  para: { fontSize: 10, color: TEXT, marginBottom: 6, lineHeight: 1.5 },

  /* Score table */
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tableHead: {
    backgroundColor: LIGHT_BG,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: MUTED,
    letterSpacing: 1,
  },
  cellName: {
    width: '36%',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  cellScore: {
    width: '12.8%',
    paddingHorizontal: 4,
    paddingVertical: 8,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  cellScoreLast: { borderRightWidth: 0 },
  scoreValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: INK,
  },
  studentNotes: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
    marginBottom: 10,
    paddingHorizontal: 10,
    fontStyle: 'italic',
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: MUTED,
  },
})

const SCORE_DIMS = [
  { key: 'score_discipline',    label: 'Disiplin' },
  { key: 'score_activeness',    label: 'Keaktifan' },
  { key: 'score_communication', label: 'Komunikasi' },
  { key: 'score_ethics',        label: 'Etika' },
  { key: 'score_understanding', label: 'Pemahaman' },
] as const

function formatDateID(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function formatTimeID(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })
}

function ReportDoc({ data }: { data: ReportData }) {
  return (
    <Document
      title={`Laporan Sesi ${data.team_code} — ${formatDateID(data.session_date)}`}
      author={data.coach_name}
      subject="Laporan Sesi Bimbingan BKI"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandTitle}>BKI</Text>
            <Text style={styles.brandSub}>BIMBINGAN KARYA ILMIAH</Text>
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docKind}>LAPORAN SESI</Text>
            <Text style={styles.docTitle}>{data.team_code}</Text>
          </View>
        </View>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>TANGGAL</Text>
            <Text style={styles.infoValue}>{formatDateID(data.session_date)}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>WAKTU</Text>
            <Text style={styles.infoValue}>{formatTimeID(data.session_date)} WIB · {data.duration_mins} menit</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>PEMBIMBING</Text>
            <Text style={styles.infoValue}>{data.coach_name}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>MEDIA</Text>
            <Text style={styles.infoValue}>{data.media === 'online' ? 'Online' : 'Offline'}{data.location ? ` · ${data.location}` : ''}</Text>
          </View>
          {data.team_research_title && (
            <View style={[styles.infoCell, { width: '100%', paddingTop: 8 }]}>
              <Text style={styles.infoLabel}>JUDUL RISET TIM</Text>
              <Text style={styles.infoValue}>{data.team_research_title}</Text>
            </View>
          )}
        </View>

        {/* Topic */}
        <Text style={styles.sectionTitle}>BAHASAN</Text>
        <Text style={styles.para}>{data.topic}</Text>

        {data.achievement && (
          <>
            <Text style={styles.sectionTitle}>CAPAIAN</Text>
            <Text style={styles.para}>{data.achievement}</Text>
          </>
        )}

        {data.homework && (
          <>
            <Text style={styles.sectionTitle}>PEKERJAAN RUMAH</Text>
            <Text style={styles.para}>{data.homework}</Text>
          </>
        )}

        {data.evaluation && (
          <>
            <Text style={styles.sectionTitle}>EVALUASI</Text>
            <Text style={styles.para}>{data.evaluation}</Text>
          </>
        )}

        {/* Scores */}
        <Text style={styles.sectionTitle}>SKOR PER MURID (skala 1–10)</Text>
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.tableRow, styles.tableHead]}>
            <Text style={styles.cellName}>MURID</Text>
            {SCORE_DIMS.map((d, i) => (
              <Text
                key={d.key}
                style={[styles.cellScore, i === SCORE_DIMS.length - 1 ? styles.cellScoreLast : {}]}
              >
                {d.label.toUpperCase()}
              </Text>
            ))}
          </View>
          {/* Student rows */}
          {data.students.map((s, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx === data.students.length - 1 ? styles.tableRowLast : {}]}
            >
              <Text style={styles.cellName}>{s.student_name}</Text>
              {SCORE_DIMS.map((d, i) => (
                <View
                  key={d.key}
                  style={[styles.cellScore, i === SCORE_DIMS.length - 1 ? styles.cellScoreLast : {}]}
                >
                  <Text style={styles.scoreValue}>{s[d.key]}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Per-student notes */}
        {data.students.some((s) => s.notes) && (
          <>
            <Text style={styles.sectionTitle}>CATATAN PER MURID</Text>
            {data.students.filter((s) => s.notes).map((s, i) => (
              <View key={i} wrap={false}>
                <Text style={[styles.para, { fontFamily: 'Helvetica-Bold', marginBottom: 0 }]}>
                  {s.student_name}
                </Text>
                <Text style={styles.studentNotes}>{s.notes}</Text>
              </View>
            ))}
          </>
        )}

        {/* Footer */}
        <View fixed style={styles.footer}>
          <Text>BKI · Laporan dibuat otomatis pada {new Date().toLocaleDateString('id-ID')}</Text>
          <Text render={({ pageNumber, totalPages }) => `Hal. ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

/**
 * Generate a PDF Blob from session report data.
 */
export async function generateReportPdf(data: ReportData): Promise<Blob> {
  return pdf(<ReportDoc data={data} />).toBlob()
}

/**
 * Convert a Blob to a base64 string (without the data URL prefix).
 * Used to send PDF to Edge Function upload-report-to-drive.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buf)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[])
  }
  return btoa(binary)
}
