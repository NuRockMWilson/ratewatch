'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { RateSnapshot, FRED_SERIES, INDEX_SERIES } from '@/lib/fred'
import { YahooQuote } from '@/lib/yahooApi'
import { RateCard } from '@/components/RateCard'
import { IndexCard } from '@/components/IndexCard'
import { HistoryChart } from '@/components/HistoryChart'
import { AISummary } from '@/components/AISummary'
import { NewsPanel } from '@/components/NewsPanel'

interface IndexData {
  key: string
  ticker: string
  name: string
  description: string
  current: number | null
  change: number | null
  changePct: number | null
  asOf: string
}

const RATE_COLORS: Record<string, string> = {
  T10Y: '#164576', T2Y: '#1d5a9a', T30Y: '#0e2f52',
  T5Y: '#164576', SOFR: '#475467', PRIME: '#101828',
  FEDFUNDS: '#164576', TIPS10Y: '#8f8a72',
}
const INDEX_COLORS: Record<string, string> = {
  SP500: '#164576', DJIA: '#0e2f52',
  NASDAQCOM: '#1d5a9a', WILL5000PR: '#475467',
}

const FRED_POLL_MS  = 15 * 60 * 1000
const YAHOO_POLL_MS = 60 * 1000

// Logo: actual NuRock PNG on white rounded square
function NuRockLogo() {
  return (
    <div style={{
      width: 38, height: 38,
      background: '#ffffff',
      borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      padding: 3,
    }}>
      <Image
        src="/nurock-logo.png"
        alt="NuRock"
        width={32}
        height={32}
        style={{ objectFit: 'contain' }}
      />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ width: 3, height: 14, background: '#B4AE92', borderRadius: 2 }} />
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: '#475467',
      }}>{children}</p>
    </div>
  )
}

function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <div style={{
      background: '#ffffff', border: '1px solid rgba(22,69,118,0.1)',
      borderTop: '3px solid #F4F4F4', borderRadius: 4, height,
      animation: 'nrShimmer 1.6s ease-in-out infinite',
    }} />
  )
}

function RefreshCountdown({ lastFetch, onRefresh, loading }: {
  lastFetch: Date | null
  onRefresh: () => void
  loading: boolean
}) {
  const [secondsLeft, setSecondsLeft] = useState(FRED_POLL_MS / 1000)

  useEffect(() => {
    if (!lastFetch) return
    const tick = () => {
      const elapsed = Date.now() - lastFetch.getTime()
      setSecondsLeft(Math.max(0, Math.ceil((FRED_POLL_MS - elapsed) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lastFetch])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const progress = lastFetch ? Math.min(1, (Date.now() - lastFetch.getTime()) / FRED_POLL_MS) : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(180,174,146,0.2)" strokeWidth="2" />
          <circle cx="14" cy="14" r="11" fill="none" stroke="#B4AE92" strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 11}`}
            strokeDashoffset={`${2 * Math.PI * 11 * (1 - progress)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(180,174,146,0.6)', lineHeight: 1, marginBottom: 2 }}>
          FRED refresh
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#B4AE92', lineHeight: 1, fontWeight: 500 }}>
          {loading ? 'updating…' : `${mins}:${secs.toString().padStart(2, '0')}`}
        </p>
      </div>
      <button
        onClick={onRefresh} disabled={loading}
        style={{
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '5px 14px', border: '1px solid #B4AE92', borderRadius: 2,
          background: 'transparent', color: '#B4AE92',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1, transition: 'all 0.12s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!loading) { const b = e.currentTarget; b.style.background = '#B4AE92'; b.style.color = '#164576' } }}
        onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = '#B4AE92' }}
      >
        {loading ? 'Loading…' : 'Refresh'}
      </button>
    </div>
  )
}

function LiveIndicator({ liveQuotes, yahooUpdatedAt }: {
  liveQuotes: YahooQuote[]
  yahooUpdatedAt: Date | null
}) {
  const isMarketOpen = liveQuotes.some(q => q.marketState === 'REGULAR')
  const timeStr = yahooUpdatedAt?.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }) ?? '—'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {yahooUpdatedAt && (
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(180,174,146,0.55)', lineHeight: 1, marginBottom: 2 }}>yields updated</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(180,174,146,0.8)', lineHeight: 1 }}>{timeStr}</p>
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'rgba(180,174,146,0.15)',
        border: '1px solid rgba(180,174,146,0.3)',
        borderRadius: 2, padding: '4px 10px',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isMarketOpen ? '#4ade80' : '#B4AE92',
          animation: isMarketOpen ? 'nrPulse 1.5s infinite' : 'none',
        }} />
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
          letterSpacing: '0.1em', color: '#B4AE92',
        }}>
          {isMarketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
        </span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [rates, setRates] = useState<RateSnapshot[]>([])
  const [indices, setIndices] = useState<IndexData[]>([])
  const [liveQuotes, setLiveQuotes] = useState<YahooQuote[]>([])
  const [initialLoad, setInitialLoad] = useState(true)
  const [fredRefreshing, setFredRefreshing] = useState(false)
  const [yahooUpdatedAt, setYahooUpdatedAt] = useState<Date | null>(null)
  const [lastFredFetch, setLastFredFetch] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedChart, setSelectedChart] = useState<{ type: 'rate' | 'index'; key: string } | null>(null)
  const fredPollRef = useRef<NodeJS.Timeout | null>(null)
  const yahooPollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchFred = useCallback(async (silent = false) => {
    if (!silent) setFredRefreshing(true)
    try {
      const [ratesRes, indicesRes] = await Promise.all([
        fetch('/api/rates'),
        fetch('/api/indices'),
      ])
      const ratesJson = await ratesRes.json()
      const indicesJson = await indicesRes.json()
      setRates(ratesJson.data ?? [])
      setIndices(indicesJson.data ?? [])
      setLastFredFetch(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch failed')
    } finally {
      setInitialLoad(false)
      setFredRefreshing(false)
    }
  }, [])

  const fetchYahoo = useCallback(async () => {
    try {
      const res = await fetch('/api/live-yields')
      const json = await res.json()
      if (json.data?.length) {
        setLiveQuotes(json.data)
        setYahooUpdatedAt(new Date())
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchFred(false).then(() => fetchYahoo())
    fredPollRef.current = setInterval(() => fetchFred(true), FRED_POLL_MS)
    yahooPollRef.current = setInterval(fetchYahoo, YAHOO_POLL_MS)
    return () => {
      if (fredPollRef.current) clearInterval(fredPollRef.current)
      if (yahooPollRef.current) clearInterval(yahooPollRef.current)
    }
  }, [fetchFred, fetchYahoo])

  useEffect(() => {
    if (rates.length && !selectedChart) setSelectedChart({ type: 'rate', key: 'T10Y' })
  }, [rates, selectedChart])

  const liveMap: Record<string, YahooQuote> = {}
  liveQuotes.forEach(q => { liveMap[q.key] = q })

  const selectedSeriesId = selectedChart
    ? selectedChart.type === 'rate'
      ? FRED_SERIES[selectedChart.key as keyof typeof FRED_SERIES]?.id
      : INDEX_SERIES[selectedChart.key as keyof typeof INDEX_SERIES]?.id
    : null

  const selectedMeta = selectedChart
    ? selectedChart.type === 'rate'
      ? { name: FRED_SERIES[selectedChart.key as keyof typeof FRED_SERIES]?.name, unit: '%', color: RATE_COLORS[selectedChart.key] ?? '#164576' }
      : { name: INDEX_SERIES[selectedChart.key as keyof typeof INDEX_SERIES]?.name, unit: '', color: INDEX_COLORS[selectedChart.key] ?? '#164576' }
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F2' }}>

      {/* ── Header ── */}
      <header style={{
        background: '#164576',
        borderBottom: '3px solid #B4AE92',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1600, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 60,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NuRockLogo />
            <div>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#ffffff', lineHeight: 1,
              }}>RateWatch</p>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 9, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#B4AE92', lineHeight: 1, marginTop: 2,
              }}>NuRock Financial Intelligence</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <LiveIndicator liveQuotes={liveQuotes} yahooUpdatedAt={yahooUpdatedAt} />
            <RefreshCountdown
              lastFetch={lastFredFetch}
              onRefresh={() => { fetchFred(false); fetchYahoo() }}
              loading={fredRefreshing}
            />
          </div>
        </div>
      </header>

      {/* ── Two-column body ── */}
      <div style={{
        maxWidth: 1600, margin: '0 auto',
        display: 'flex', gap: 20,
        padding: '20px 24px 56px',
        alignItems: 'flex-start',
      }}>

        {/* ── Left: main content ── */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #b91c1c',
              borderLeft: '4px solid #b91c1c', borderRadius: 4,
              padding: '10px 16px', marginBottom: 20,
              fontFamily: 'var(--font-body)', fontSize: 13, color: '#b91c1c',
            }}>
              {error} — check your FRED_API_KEY in .env.local
            </div>
          )}

          {/* Data source legend */}
          {!initialLoad && (
            <div style={{
              background: 'rgba(22,69,118,0.04)',
              border: '1px solid rgba(22,69,118,0.12)',
              borderLeft: '3px solid #B4AE92',
              borderRadius: 4, padding: '10px 16px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, color: '#15803d', letterSpacing: '0.06em' }}>LIVE</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#475467' }}>
                  Treasury yields (2Y, 5Y, 10Y, 30Y) via Yahoo Finance — updates every 60s
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#8f8a72' }}>
                SOFR · Prime · Fed Funds via FRED — end-of-day, ~3–4 PM ET
              </span>
            </div>
          )}

          {/* AI Summary */}
          {rates.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <AISummary rates={rates} indices={indices} />
            </div>
          )}

          {/* Interest Rates */}
          <section style={{ marginBottom: 28 }}>
            <SectionLabel>Interest Rates</SectionLabel>

            {/* Featured row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
              {initialLoad
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} height={160} />)
                : rates
                    .filter(r => ['T10Y', 'SOFR', 'PRIME'].includes(r.key))
                    .sort((a, b) => ['T10Y', 'SOFR', 'PRIME'].indexOf(a.key) - ['T10Y', 'SOFR', 'PRIME'].indexOf(b.key))
                    .map((r) => (
                      <RateCard
                        key={r.key} rate={r}
                        liveQuote={liveMap[r.key] ?? null}
                        featured={true}
                        selected={selectedChart?.type === 'rate' && selectedChart.key === r.key}
                        onClick={() => setSelectedChart({ type: 'rate', key: r.key })}
                      />
                    ))
              }
            </div>

            {/* Secondary row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {initialLoad
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                : rates
                    .filter(r => !['T10Y', 'SOFR', 'PRIME'].includes(r.key))
                    .map((r) => (
                      <RateCard
                        key={r.key} rate={r}
                        liveQuote={liveMap[r.key] ?? null}
                        featured={false}
                        selected={selectedChart?.type === 'rate' && selectedChart.key === r.key}
                        onClick={() => setSelectedChart({ type: 'rate', key: r.key })}
                      />
                    ))
              }
            </div>
          </section>

          {/* Market Indices */}
          <section style={{ marginBottom: 28 }}>
            <SectionLabel>Market Indices</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
              {initialLoad
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                : indices.map((idx) => (
                    <IndexCard
                      key={idx.key} index={idx}
                      selected={selectedChart?.type === 'index' && selectedChart.key === idx.key}
                      onClick={() => setSelectedChart({ type: 'index', key: idx.key })}
                    />
                  ))
              }
            </div>
          </section>

          {/* Historical Chart */}
          {selectedSeriesId && selectedMeta && (
            <section>
              <SectionLabel>Historical Chart — select any card to change</SectionLabel>
              <HistoryChart
                key={selectedSeriesId}
                seriesId={selectedSeriesId}
                seriesName={selectedMeta.name}
                unit={selectedMeta.unit}
                color={selectedMeta.color}
              />
            </section>
          )}
        </main>

        {/* ── Right: news panel ── */}
        <NewsPanel />
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(22,69,118,0.12)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: 1600, margin: '0 auto',
      }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#8f8a72' }}>
          © NuRock · Treasury yields via Yahoo Finance · Benchmark rates via FRED · News via RSS
        </p>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.06em', color: '#B4AE92',
        }}>
          NUROCK · RATEWATCH
        </p>
      </footer>

      <style>{`
        @keyframes nrPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes nrShimmer {
          0%{background:#ffffff} 50%{background:#F4F4F4} 100%{background:#ffffff}
        }
      `}</style>
    </div>
  )
}
