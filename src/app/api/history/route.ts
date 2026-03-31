import { NextRequest, NextResponse } from 'next/server'
import { fetchFredSeries } from '@/lib/fredApi'
import { getStartDate, HistoryPoint } from '@/lib/fred'

export const revalidate = 900

type Range = '1W' | '1M' | '6M' | '1Y'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const seriesId = searchParams.get('series')
  const range = (searchParams.get('range') ?? '1M') as Range

  if (!seriesId) {
    return NextResponse.json({ error: 'Missing series param' }, { status: 400 })
  }

  const validRanges: Range[] = ['1W', '1M', '6M', '1Y']
  if (!validRanges.includes(range)) {
    return NextResponse.json({ error: 'Invalid range. Use 1W | 1M | 6M | 1Y' }, { status: 400 })
  }

  try {
    const startDate = getStartDate(range)
    const obs = await fetchFredSeries(seriesId, startDate)

    const points: HistoryPoint[] = obs
      .filter((o) => o.value !== null)
      .map((o) => ({ date: o.date, value: o.value }))

    return NextResponse.json({
      series: seriesId,
      range,
      data: points,
      count: points.length,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
