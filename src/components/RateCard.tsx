'use client'

import { RateSnapshot } from '@/lib/fred'
import { YahooQuote } from '@/lib/yahooApi'

interface Props {
  rate: RateSnapshot
  liveQuote?: YahooQuote | null
  onClick: () => void
  selected: boolean
  featured?: boolean
}

export function RateCard({ rate, liveQuote, onClick, selected, featured = false }: Props) {
  const hasLive = liveQuote?.price != null
  const displayValue = hasLive ? liveQuote!.price! : rate.current
  const displayChange = hasLive ? liveQuote!.change : rate.change
  const displayChangePct = hasLive ? liveQuote!.changePct : rate.changePct

  const direction =
    displayChange == null ? 'neutral'
    : displayChange > 0 ? 'up'
    : displayChange < 0 ? 'down'
    : 'neutral'

  const changeLabel =
    displayChange == null ? '—'
    : `${displayChange > 0 ? '+' : ''}${displayChange.toFixed(2)}`

  const isMarketOpen = liveQuote?.marketState === 'REGULAR'

  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? '#164576' : '#ffffff',
        border: `1px solid ${selected ? '#164576' : 'rgba(22,69,118,0.15)'}`,
        borderTop: `${featured ? 4 : 3}px solid ${
          selected ? '#B4AE92'
          : direction === 'up' ? '#15803d'
          : direction === 'down' ? '#b91c1c'
          : 'rgba(22,69,118,0.15)'
        }`,
        borderRadius: 4,
        padding: featured ? '20px 22px' : '14px 16px',
        textAlign: 'left',
        width: '100%',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
    >
      {/* Live badge */}
      {hasLive && (
        <div style={{
          position: 'absolute', top: featured ? 12 : 8, right: featured ? 12 : 8,
          display: 'flex', alignItems: 'center', gap: 3,
          background: selected
            ? 'rgba(180,174,146,0.15)'
            : isMarketOpen ? 'rgba(21,128,61,0.08)' : 'rgba(71,84,103,0.08)',
          border: `1px solid ${isMarketOpen ? 'rgba(21,128,61,0.25)' : 'rgba(71,84,103,0.2)'}`,
          borderRadius: 2, padding: '1px 5px',
        }}>
          <span style={{
            width: 4, height: 4, borderRadius: '50%',
            background: isMarketOpen ? '#15803d' : '#475467',
            animation: isMarketOpen ? 'nrPulse 2s infinite' : 'none',
          }} />
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 600,
            letterSpacing: '0.08em',
            color: isMarketOpen
              ? (selected ? '#B4AE92' : '#15803d')
              : (selected ? '#B4AE92' : '#475467'),
          }}>
            {isMarketOpen ? 'LIVE' : 'DELAYED'}
          </span>
        </div>
      )}

      {/* Series label */}
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: featured ? 12 : 11,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: selected ? '#B4AE92' : '#475467',
        marginBottom: featured ? 10 : 6,
        paddingRight: hasLive ? 56 : 0,
      }}>
        {rate.name}
      </p>

      {/* Primary value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: featured ? 42 : 28,
          fontWeight: 600,
          color: selected ? '#ffffff' : '#101828',
          lineHeight: 1,
          letterSpacing: '-1px',
        }}>
          {displayValue != null ? displayValue.toFixed(2) : '—'}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: featured ? 16 : 12,
          color: selected ? '#B4AE92' : '#475467',
        }}>
          {rate.unit}
        </span>
      </div>

      {/* Change badge */}
      <div style={{ marginTop: featured ? 12 : 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: featured ? 12 : 11,
          fontWeight: 500,
          padding: featured ? '3px 10px' : '2px 8px',
          borderRadius: 2,
          background: selected
            ? 'rgba(180,174,146,0.2)'
            : direction === 'up' ? '#f0fdf4'
            : direction === 'down' ? '#fef2f2'
            : '#F4F4F4',
          color: selected
            ? '#B4AE92'
            : direction === 'up' ? '#15803d'
            : direction === 'down' ? '#b91c1c'
            : '#475467',
        }}>
          {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—'} {changeLabel}
          {displayChangePct != null && (
            <span style={{ marginLeft: 4, opacity: 0.7 }}>
              ({displayChangePct > 0 ? '+' : ''}{displayChangePct.toFixed(2)}%)
            </span>
          )}
        </span>
      </div>

      {/* Day range — featured only */}
      {featured && hasLive && liveQuote!.high != null && liveQuote!.low != null && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: selected ? 'rgba(180,174,146,0.6)' : '#8f8a72',
          }}>
            Day range: {liveQuote!.low!.toFixed(2)} – {liveQuote!.high!.toFixed(2)}%
          </span>
        </div>
      )}

      {/* Source label */}
      <p style={{
        fontSize: 9,
        color: selected ? 'rgba(180,174,146,0.6)' : '#8f8a72',
        marginTop: featured ? 8 : 5,
        fontFamily: 'var(--font-body)',
      }}>
        {hasLive
          ? `Yahoo Finance · FRED close: ${rate.current?.toFixed(2) ?? '—'}%`
          : `FRED${rate.asOf ? ` · ${rate.asOf}` : ''}`
        }
      </p>
    </button>
  )
}
