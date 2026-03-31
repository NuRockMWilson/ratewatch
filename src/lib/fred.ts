// FRED Series IDs for interest rates
export const FRED_SERIES = {
  // Interest Rates
  T10Y: {
    id: 'DGS10',
    name: '10-Year Treasury',
    shortName: '10Y Treasury',
    unit: '%',
    description: 'US 10-year benchmark yield',
    category: 'rates',
    frequency: 'daily',
  },
  T2Y: {
    id: 'DGS2',
    name: '2-Year Treasury',
    shortName: '2Y Treasury',
    unit: '%',
    description: 'Short-term benchmark',
    category: 'rates',
    frequency: 'daily',
  },
  T30Y: {
    id: 'DGS30',
    name: '30-Year Treasury',
    shortName: '30Y Treasury',
    unit: '%',
    description: 'Long-term benchmark yield',
    category: 'rates',
    frequency: 'daily',
  },
  T5Y: {
    id: 'DGS5',
    name: '5-Year Treasury',
    shortName: '5Y Treasury',
    unit: '%',
    description: '5-year benchmark yield',
    category: 'rates',
    frequency: 'daily',
  },
  SOFR: {
    id: 'SOFR',
    name: 'SOFR',
    shortName: 'SOFR',
    unit: '%',
    description: 'Secured Overnight Financing Rate',
    category: 'rates',
    frequency: 'daily',
  },
  PRIME: {
    id: 'DPRIME',
    name: 'Prime Rate',
    shortName: 'Prime',
    unit: '%',
    description: 'Bank prime lending rate',
    category: 'rates',
    frequency: 'daily',
  },
  FEDFUNDS: {
    id: 'FEDFUNDS',
    name: 'Fed Funds Rate',
    shortName: 'Fed Funds',
    unit: '%',
    description: 'Effective federal funds rate',
    category: 'rates',
    frequency: 'monthly',
  },
  TIPS10Y: {
    id: 'DFII10',
    name: '10Y TIPS Yield',
    shortName: 'TIPS 10Y',
    unit: '%',
    description: 'Real yield, inflation-adjusted',
    category: 'rates',
    frequency: 'daily',
  },
} as const

export type SeriesKey = keyof typeof FRED_SERIES

export interface FredObservation {
  date: string
  value: number | null
}

export interface RateSnapshot {
  key: SeriesKey
  name: string
  shortName: string
  unit: string
  description: string
  category: string
  current: number | null
  previous: number | null
  change: number | null
  changePct: number | null
  asOf: string
}

export interface HistoryPoint {
  date: string
  value: number | null
}

// Date helpers for FRED observation_start parameter
export function getStartDate(range: '1W' | '1M' | '6M' | '1Y'): string {
  const now = new Date()
  switch (range) {
    case '1W':
      now.setDate(now.getDate() - 10) // extra buffer for weekends
      break
    case '1M':
      now.setMonth(now.getMonth() - 1)
      break
    case '6M':
      now.setMonth(now.getMonth() - 6)
      break
    case '1Y':
      now.setFullYear(now.getFullYear() - 1)
      break
  }
  return now.toISOString().split('T')[0]
}

export function formatRate(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(2)
}

export function formatChange(change: number | null): string {
  if (change === null) return '—'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}`
}

// Index fund data — FRED has some ETF proxies and related indicators
// We use these FRED series as index proxies/related data
export const INDEX_SERIES = {
  SP500: {
    id: 'SP500',
    ticker: 'S&P 500',
    name: 'S&P 500 Index',
    description: 'Large-cap US equities',
    category: 'indices',
  },
  DJIA: {
    id: 'DJIA',
    ticker: 'DJIA',
    name: 'Dow Jones Industrial',
    description: '30 large US companies',
    category: 'indices',
  },
  NASDAQCOM: {
    id: 'NASDAQCOM',
    ticker: 'NASDAQ',
    name: 'NASDAQ Composite',
    description: 'Tech-heavy composite index',
    category: 'indices',
  },
  WILL5000PR: {
    id: 'WILL5000PR',
    ticker: 'Wilshire 5000',
    name: 'Wilshire 5000',
    description: 'Total US equity market',
    category: 'indices',
  },
} as const

export type IndexKey = keyof typeof INDEX_SERIES
