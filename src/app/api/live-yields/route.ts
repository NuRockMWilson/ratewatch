import { NextResponse } from 'next/server'
import { fetchAllYahooYields } from '@/lib/yahooApi'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const quotes = await fetchAllYahooYields()

    return NextResponse.json({
      data: quotes,
      fetchedAt: new Date().toISOString(),
      source: 'Yahoo Finance (unofficial, ~15min delayed during market hours)',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, data: [] }, { status: 500 })
  }
}
