import { NextResponse } from 'next/server'
import { FRED_SERIES, SeriesKey, RateSnapshot } from '@/lib/fred'
import { fetchFredSeries, getLatestTwo } from '@/lib/fredApi'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Use a wide window — 30 days back — to ensure we always get data
    // regardless of weekends, holidays, or reporting lags
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const observation_start = startDate.toISOString().split('T')[0]

    const results = await Promise.allSettled(
      Object.entries(FRED_SERIES).map(async ([key, meta]) => {
        const obs = await fetchFredSeries(meta.id, observation_start)
        const { current, previous } = getLatestTwo(obs)

        const change =
          current?.value != null && previous?.value != null
            ? parseFloat((current.value - previous.value).toFixed(4))
            : null

        const changePct =
          change != null && previous?.value != null && previous.value !== 0
            ? parseFloat(((change / previous.value) * 100).toFixed(4))
            : null

        return {
          key: key as SeriesKey,
          name: meta.name,
          shortName: meta.shortName,
          unit: meta.unit,
          description: meta.description,
          category: meta.category,
          current: current?.value ?? null,
          previous: previous?.value ?? null,
          change,
          changePct,
          asOf: current?.date ?? '',
        } satisfies RateSnapshot
      }),
    )

    const snapshots: RateSnapshot[] = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<RateSnapshot>).value)

    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason?.message)

    return NextResponse.json({
      data: snapshots,
      errors: errors.length > 0 ? errors : undefined,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
