'use client'

import { useEffect, useState } from 'react'
import { RateSnapshot } from '@/lib/fred'

interface IndexData {
  ticker: string
  current: number | null
  changePct: number | null
}

interface Props {
  rates: RateSnapshot[]
  indices: IndexData[]
}

export function AISummary({ rates, indices }: Props) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!rates.length) return
    const controller = new AbortController()
    async function fetch_() {
      setLoading(true)
      try {
        const res = await fetch('/api/ai-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rates, indices }),
          signal: controller.signal,
        })
        const json = await res.json()
        setSummary(json.summary ?? null)
      } catch { /* ignore abort */ }
      finally { setLoading(false) }
    }
    fetch_()
    return () => controller.abort()
  }, [rates, indices])

  if (!loading && !summary) return null

  return (
    <div style={{
      background: '#164576',
      borderRadius: 4,
      padding: '16px 22px',
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start',
    }}>
      {/* NR monogram mark */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '1.5px solid #B4AE92',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 2,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 700,
          color: '#B4AE92',
          letterSpacing: '0.02em',
        }}>NR</span>
      </div>

      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#B4AE92',
          marginBottom: 6,
        }}>
          Market Intelligence · Powered by Claude AI
        </p>

        {loading && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', paddingTop: 4 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#B4AE92', display: 'inline-block',
                animation: `nrDot 1s ${i*0.15}s infinite`,
              }} />
            ))}
            <style>{`@keyframes nrDot{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
          </div>
        )}

        {!loading && summary && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 300,
            color: '#ffffff',
            lineHeight: 1.7,
          }}>
            {summary}
          </p>
        )}
      </div>
    </div>
  )
}
