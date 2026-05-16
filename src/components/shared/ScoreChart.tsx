import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'

interface ScoreData {
  penguasaan: number
  presentasi: number
  keaktifan: number
  kedisiplinan: number
  kreativitas: number
}

interface ScoreChartProps {
  scores: ScoreData
  size?: number
}

const SCORE_LABELS = {
  penguasaan:  'Penguasaan Materi',
  presentasi:  'Presentasi',
  keaktifan:   'Keaktifan',
  kedisiplinan: 'Kedisiplinan',
  kreativitas: 'Kreativitas',
}

export function ScoreChart({ scores, size = 300 }: ScoreChartProps) {
  const data = Object.entries(SCORE_LABELS).map(([key, label]) => ({
    subject: label,
    score: scores[key as keyof ScoreData] ?? 0,
    fullMark: 10,
  }))

  return (
    <ResponsiveContainer width="100%" height={size}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#475569', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
        <Radar
          name="Nilai"
          dataKey="score"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip
          formatter={(v) => [`${v}/10`, 'Nilai']}
          contentStyle={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
