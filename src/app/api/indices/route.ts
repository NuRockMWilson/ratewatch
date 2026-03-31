import { NextResponse } from 'next/server'
import { INDEX_SERIES, IndexKey } from '@/lib/fred'
import { fetchFredSeries, getLatestTwo } from '@/lib/fredApi'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    const observation_start = startDate.toISOString().split('T')[0]

    const results = await Promise.allSettled(
      Object.entries(INDEX_SERIES).map(async ([key, meta]) => {
        const obs = await fetchFredSeries(meta.id, observation_start)
        const { current, previous } = getLatestTwo(obs)

        const change =
          current?.value != null && previous?.value != null
            ? parseFloat((current.value - previous.value).toFixed(2))
            : null

        const changePct =
          change != null && previous?.value != null && previous.value !== 0
            ? parseFloat(((change / previous.value) * 100).toFixed(3))
            : null

        return {
          key: key as IndexKey,
          ticker: meta.ticker,
          name: meta.name,
          description: meta.description,
          current: current?.value ?? null,
          previous: previous?.value ?? null,
          change,
          changePct,
          asOf: current?.date ?? '',
        }
      }),
    )

    const snapshots = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<unknown>).value)

    return NextResponse.json({
      data: snapshots,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
