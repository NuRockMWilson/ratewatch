// Yahoo Finance unofficial API — no key required, ~15 min delayed intraday
// Tickers: ^ prefix = index, these are the CBOE yield tickers Yahoo uses

export const YAHOO_YIELD_TICKERS: Record<string, string> = {
  T2Y:    '^IRX',   // 13-week proxy (closest to 2Y available on Yahoo)
  T5Y:    '^FVX',   // 5-Year Treasury Yield
  T10Y:   '^TNX',   // 10-Year Treasury Yield
  T30Y:   '^TYX',   // 30-Year Treasury Yield
}

// Yahoo returns yield values * 100 for these tickers (e.g. 4.28 = 4.28%)
// but some return the raw value — we divide by 100 only for the ^ yield tickers

export interface YahooQuote {
  key: string           // our internal key e.g. T10Y
  ticker: string        // Yahoo ticker e.g. ^TNX
  price: number | null  // current intraday value (already in % terms)
  previousClose: number | null
  change: number | null
  changePct: number | null
  high: number | null
  low: number | null
  marketState: string   // REGULAR | PRE | POST | CLOSED
  timestamp: number | null  // unix seconds
  isLive: boolean
}

interface YahooChartMeta {
  regularMarketPrice: number
  previousClose?: number
  chartPreviousClose?: number
  regularMarketDayHigh?: number
  regularMarketDayLow?: number
  marketState?: string
  regularMarketTime?: number
}

interface YahooChartResponse {
  chart: {
    result: Array<{ meta: YahooChartMeta }> | null
    error: unknown
  }
}

export async function fetchYahooQuote(
  key: string,
  ticker: string,
): Promise<YahooQuote> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?interval=1m&range=1d&includePrePost=false`

  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      // Yahoo requires a browser-like user agent or returns 401
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })

  if (!res.ok) {
    throw new Error(`Yahoo Finance HTTP ${res.status} for ${ticker}`)
  }

  const data: YahooChartResponse = await res.json()
  const result = data?.chart?.result?.[0]

  if (!result) {
    throw new Error(`No data returned from Yahoo for ${ticker}`)
  }

  const meta = result.meta

  // Yahoo's ^ yield tickers return values like 4.28 (already in % form)
  const raw = meta.regularMarketPrice ?? null
  const prevRaw = meta.previousClose ?? meta.chartPreviousClose ?? null

  const price = raw != null ? parseFloat(raw.toFixed(3)) : null
  const prev = prevRaw != null ? parseFloat(prevRaw.toFixed(3)) : null
  const change = price != null && prev != null
    ? parseFloat((price - prev).toFixed(3))
    : null
  const changePct = change != null && prev != null && prev !== 0
    ? parseFloat(((change / prev) * 100).toFixed(3))
    : null

  const marketState = meta.marketState ?? 'UNKNOWN'
  const isLive = marketState === 'REGULAR'

  return {
    key,
    ticker,
    price,
    previousClose: prev,
    change,
    changePct,
    high: meta.regularMarketDayHigh ?? null,
    low: meta.regularMarketDayLow ?? null,
    marketState,
    timestamp: meta.regularMarketTime ?? null,
    isLive,
  }
}

export async function fetchAllYahooYields(): Promise<YahooQuote[]> {
  const results = await Promise.allSettled(
    Object.entries(YAHOO_YIELD_TICKERS).map(([key, ticker]) =>
      fetchYahooQuote(key, ticker),
    ),
  )

  return results
    .filter((r): r is PromiseFulfilledResult<YahooQuote> => r.status === 'fulfilled')
    .map((r) => r.value)
}
