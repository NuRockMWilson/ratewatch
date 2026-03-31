'use client'

interface IndexData {
  ticker: string
  name: string
  description: string
  current: number | null
  change: number | null
  changePct: number | null
  asOf: string
}

interface Props {
  index: IndexData
  onClick: () => void
  selected: boolean
}

export function IndexCard({ index, onClick, selected }: Props) {
  const up = index.changePct == null ? null : index.changePct >= 0

  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? '#164576' : '#ffffff',
        border: `1px solid ${selected ? '#164576' : 'rgba(22,69,118,0.15)'}`,
        borderTop: `3px solid ${selected ? '#B4AE92' : 'rgba(22,69,118,0.15)'}`,
        borderRadius: 4,
        padding: '14px 16px',
        textAlign: 'left',
        width: '100%',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: selected ? '#ffffff' : '#101828',
          }}>
            {index.ticker}
          </p>
          <p style={{ fontSize: 10, color: selected ? '#B4AE92' : '#475467', marginTop: 1 }}>
            {index.name}
          </p>
        </div>
        {index.changePct != null && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 2,
            background: selected
              ? 'rgba(180,174,146,0.2)'
              : up ? '#f0fdf4' : '#fef2f2',
            color: selected ? '#B4AE92' : up ? '#15803d' : '#b91c1c',
          }}>
            {up ? '▲' : '▼'} {Math.abs(index.changePct).toFixed(2)}%
          </span>
        )}
      </div>

      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 24,
        fontWeight: 600,
        color: selected ? '#ffffff' : '#101828',
        letterSpacing: '-0.3px',
      }}>
        {index.current != null
          ? index.current.toLocaleString('en-US', { maximumFractionDigits: 2 })
          : '—'}
      </p>

      {index.change != null && (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          marginTop: 4,
          color: selected ? '#B4AE92' : up ? '#15803d' : '#b91c1c',
        }}>
          {up ? '+' : ''}{index.change.toFixed(2)} today
        </p>
      )}

      {index.asOf && (
        <p style={{ fontSize: 10, color: selected ? 'rgba(180,174,146,0.6)' : '#8f8a72', marginTop: 6 }}>
          as of {index.asOf}
        </p>
      )}
    </button>
  )
}
