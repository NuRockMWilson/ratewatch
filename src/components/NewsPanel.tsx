'use client'

import { useState, useEffect, useCallback } from 'react'
import { NewsItem } from '@/app/api/news/route'

const CATEGORY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  rates:       { label: 'Rates',       color: '#1d5a9a', bg: 'rgba(29,90,154,0.08)' },
  realestate:  { label: 'Real Estate', color: '#15803d', bg: 'rgba(21,128,61,0.08)' },
  economy:     { label: 'Economy',     color: '#92400e', bg: 'rgba(146,64,14,0.08)'  },
  policy:      { label: 'Policy',      color: '#6d28d9', bg: 'rgba(109,40,217,0.08)' },
}

const FILTER_OPTIONS = [
  { key: 'all',        label: 'All' },
  { key: 'realestate', label: 'Real Estate' },
  { key: 'rates',      label: 'Rates' },
  { key: 'economy',    label: 'Economy' },
  { key: 'policy',     label: 'Policy' },
]

const NEWS_POLL_MS = 10 * 60 * 1000 // 10 min

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [error, setError] = useState(false)

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news')
      const json = await res.json()
      if (json.data?.length) {
        setNews(json.data)
        setUpdatedAt(new Date())
        setError(false)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews()
    const id = setInterval(fetchNews, NEWS_POLL_MS)
    return () => clearInterval(id)
  }, [fetchNews])

  const filtered = filter === 'all' ? news : news.filter(n => n.category === filter)

  return (
    <aside style={{
      width: 320,
      flexShrink: 0,
      background: '#ffffff',
      border: '1px solid rgba(22,69,118,0.12)',
      borderRadius: 4,
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 80px)',
      position: 'sticky',
      top: 70,
      overflow: 'hidden',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(22,69,118,0.1)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 3, height: 13, background: '#B4AE92', borderRadius: 2 }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 11, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#475467',
            }}>Market News</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {updatedAt && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#B4AE92' }}>
                {updatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchNews}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '3px 8px', border: '1px solid rgba(22,69,118,0.2)',
                borderRadius: 2, background: 'transparent', color: '#475467',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '3px 8px', borderRadius: 2,
                border: '1px solid rgba(22,69,118,0.15)',
                background: filter === opt.key ? '#164576' : 'transparent',
                color: filter === opt.key ? '#ffffff' : '#475467',
                cursor: 'pointer', transition: 'all 0.12s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* News list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && (
          <div style={{ padding: '20px 16px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ height: 11, background: '#F4F4F4', borderRadius: 2, marginBottom: 5, width: '90%', animation: 'nrShimmer 1.6s infinite' }} />
                <div style={{ height: 11, background: '#F4F4F4', borderRadius: 2, marginBottom: 5, width: '75%', animation: 'nrShimmer 1.6s infinite' }} />
                <div style={{ height: 9, background: '#F4F4F4', borderRadius: 2, width: '40%', animation: 'nrShimmer 1.6s infinite' }} />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '20px 16px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#8f8a72' }}>
              Unable to load news feeds. Check back shortly.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '20px 16px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#8f8a72' }}>
              No relevant news in this category right now.
            </p>
          </div>
        )}

        {!loading && filtered.map((item, i) => {
          const cat = CATEGORY_LABELS[item.category]
          return (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '10px 16px',
                borderBottom: '1px solid rgba(22,69,118,0.06)',
                textDecoration: 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F2F2F2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Category + time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 8, fontWeight: 600,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  padding: '1px 5px', borderRadius: 2,
                  background: cat.bg, color: cat.color,
                }}>
                  {cat.label}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#B4AE92' }}>
                  {item.source}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#8f8a72', marginLeft: 'auto' }}>
                  {timeAgo(item.publishedAt)}
                </span>
              </div>

              {/* Title */}
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12, fontWeight: 500,
                color: '#101828', lineHeight: 1.45,
                marginBottom: item.summary ? 4 : 0,
              }}>
                {item.title}
              </p>

              {/* Summary */}
              {item.summary && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11, color: '#475467',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {item.summary}
                </p>
              )}
            </a>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid rgba(22,69,118,0.1)',
        flexShrink: 0,
      }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: '#8f8a72', textAlign: 'center' }}>
          Reuters · HousingWire · Federal Reserve · WSJ · Bisnow · GlobeSt · Calculated Risk
        </p>
      </div>
    </aside>
  )
}
