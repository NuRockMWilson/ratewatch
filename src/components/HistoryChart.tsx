'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { HistoryPoint } from '@/lib/fred'
import { format, parseISO } from 'date-fns'

type Range = '1W' | '1M' | '6M' | '1Y'
const RANGES: Range[] = ['1W', '1M', '6M', '1Y']

function formatXLabel(dateStr: string, range: Range): string {
  const d = parseISO(dateStr)
  if (range === '1W') return format(d, 'EEE d')
  if (range === '1M') return format(d, 'MMM d')
  if (range === '6M') return format(d, 'MMM d')
  return format(d, 'MMM yy')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null
  const point: HistoryPoint = payload[0].payload
  return (
    <div style={{
      background: '#164576',
      border: '1px solid #B4AE92',
      borderRadius: 4,
      padding: '8px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
    }}>
      <p style={{ color: '#B4AE92', marginBottom: 3, fontSize: 10 }}>
        {format(parseISO(point.date), 'MMM d, yyyy')}
      </p>
      <p style={{ color: '#ffffff', fontWeight: 500, fontFamily: 'var(--font-display)', fontSize: 16 }}>
        {point.value != null ? point.value.toFixed(2) : '—'}{unit}
      </p>
    </div>
  )
}

interface Props {
  seriesId: string
  seriesName: string
  unit: string
  color?: string
}

export function HistoryChart({ seriesId, seriesName, unit, color = '#164576' }: Props) {
  const [range, setRange] = useState<Range>('1M')
  const [data, setData] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/history?series=${seriesId}&range=${range}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [seriesId, range])

  useEffect(() => { load() }, [load])

  const values = data.map((d) => d.value).filter((v): v is number => v != null)
  const minV = values.length ? Math.min(...values) : 0
  const maxV = values.length ? Math.max(...values) : 1
  const pad = (maxV - minV) * 0.15 || 0.2
  const yMin = parseFloat((minV - pad).toFixed(2))
  const yMax = parseFloat((maxV + pad).toFixed(2))

  const trend = values.length >= 2 ? values[values.length - 1] - values[0] : 0
  const trendUp = trend > 0
  const trendColor = trend > 0 ? '#15803d' : trend < 0 ? '#b91c1c' : '#475467'

  const tickStep = Math.max(1, Math.floor(data.length / (range === '1W' ? 5 : range === '1M' ? 6 : 8)))
  const ticks = data.filter((_, i) => i % tickStep === 0).map((d) => d.date)

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid rgba(22,69,118,0.15)',
      borderTop: '3px solid #164576',
      borderRadius: 4,
      padding: '20px 24px 18px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#101828',
          }}>
            {seriesName}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8f8a72', marginTop: 2 }}>
            FRED SERIES: {seriesId}
          </p>
        </div>

        {/* Range selector */}
        <div style={{ display: 'flex', gap: 2 }}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.05em',
                padding: '4px 12px',
                border: '1px solid',
                borderColor: range === r ? '#164576' : 'rgba(22,69,118,0.2)',
                borderRadius: 2,
                background: range === r ? '#164576' : 'transparent',
                color: range === r ? '#ffffff' : '#475467',
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Period summary */}
      {values.length >= 2 && !loading && (
        <div style={{
          display: 'flex',
          gap: 24,
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(22,69,118,0.08)',
        }}>
          {[
            { label: 'Period Open', val: `${values[0].toFixed(2)}${unit}` },
            { label: 'Period Close', val: `${values[values.length - 1].toFixed(2)}${unit}` },
            { label: 'Range High', val: `${maxV.toFixed(2)}${unit}` },
            { label: 'Range Low', val: `${minV.toFixed(2)}${unit}` },
            { label: 'Net Change', val: `${trend > 0 ? '+' : ''}${trend.toFixed(2)}${unit}`, color: trendColor },
          ].map(({ label, val, color: c }) => (
            <div key={label}>
              <p style={{ fontSize: 9, fontFamily: 'var(--font-display)', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8f8a72', marginBottom: 2 }}>
                {label}
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: c ?? '#101828' }}>
                {val}
                {label === 'Net Change' && (
                  <span style={{ fontSize: 10, marginLeft: 4 }}>{trendUp ? '▲' : trend < 0 ? '▼' : '—'}</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div style={{ height: 220, position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#ffffff', zIndex: 10,
          }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#B4AE92',
                  display: 'inline-block',
                  animation: `nrBounce 1s ${i*0.15}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        {error && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: 12, color: '#b91c1c' }}>{error}</p>
          </div>
        )}
        {!error && !loading && data.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: 12, color: '#8f8a72' }}>No data available</p>
          </div>
        )}
        {!error && data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(22,69,118,0.07)" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={ticks}
                tickFormatter={(v) => formatXLabel(v, range)}
                tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#8f8a72' }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                domain={[yMin, yMax]}
                tickFormatter={(v) => v.toFixed(2)}
                tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: '#8f8a72' }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip content={<CustomTooltip unit={unit} />} />
              <ReferenceLine
                y={values[0]}
                stroke="#B4AE92"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: '#B4AE92', strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <style>{`
        @keyframes nrBounce {
          0%,100%{transform:translateY(0);opacity:.3}
          50%{transform:translateY(-5px);opacity:1}
        }
      `}</style>
    </div>
  )
}
