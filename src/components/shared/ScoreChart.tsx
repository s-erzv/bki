import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'

export interface ScoreData {
  discipline: number
  activeness: number
  communication: number
  ethics: number
  understanding: number
}

interface ScoreChartProps {
  scores: ScoreData
  size?: number
}

const SCORE_LABELS: Record<keyof ScoreData, string> = {
  discipline:    'Disiplin',
  activeness:    'Keaktifan',
  communication: 'Komunikasi',
  ethics:        'Etika',
  understanding: 'Pemahaman',
}

export function ScoreChart({ scores, size = 300 }: ScoreChartProps) {
  const data = (Object.keys(SCORE_LABELS) as Array<keyof ScoreData>).map((key) => ({
    subject: SCORE_LABELS[key],
    score: scores[key] ?? 0,
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
