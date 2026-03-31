import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.FRED_API_KEY

  if (!key) {
    return NextResponse.json({ problem: 'FRED_API_KEY missing from .env.local' })
  }

  const cleanKey = key.trim()
  const keyPreview = `${cleanKey.slice(0, 6)}...${cleanKey.slice(-4)} (${cleanKey.length} chars)`
  const hasQuotes = key.includes('"') || key.includes("'")
  const hasSpaces = key !== cleanKey

  // Try FRED with a very simple, minimal request
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  const obs_start = startDate.toISOString().split('T')[0]

  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${cleanKey}&file_type=json&observation_start=${obs_start}&sort_order=asc`

  let httpStatus = 0
  let fredResponse: unknown = null

  try {
    const res = await fetch(url, { cache: 'no-store' })
    httpStatus = res.status
    fredResponse = await res.json()
  } catch (e) {
    return NextResponse.json({
      keyPreview, hasQuotes, hasSpaces,
      error: 'Network error — cannot reach api.stlouisfed.org',
      detail: e instanceof Error ? e.message : String(e),
    })
  }

  return NextResponse.json({
    keyPreview,
    hasQuotes,
    hasSpaces,
    httpStatus,
    fredResponse,
    urlUsed: url.replace(cleanKey, '[KEY]'),
  })
}
