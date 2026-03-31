import { FredObservation } from './fred'

const BASE = 'https://api.stlouisfed.org/fred'

interface FredApiResponse {
  observations: Array<{ date: string; value: string }>
  error_message?: string
}

export async function fetchFredSeries(
  seriesId: string,
  observationStart: string,
  observationEnd?: string,
): Promise<FredObservation[]> {
  const key = process.env.FRED_API_KEY
  if (!key) throw new Error('FRED_API_KEY is not set')

  const params: Record<string, string> = {
    series_id: seriesId,
    api_key: key.trim(),
    file_type: 'json',
    sort_order: 'asc',
    observation_start: observationStart,
  }

  if (observationEnd) {
    params.observation_end = observationEnd
  }

  const qs = new URLSearchParams(params).toString()
  const url = `${BASE}/series/observations?${qs}`

  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json() as FredApiResponse
      detail = body.error_message ? `: ${body.error_message}` : ''
    } catch { /* ignore */ }
    throw new Error(`FRED API error ${res.status} for series ${seriesId}${detail}`)
  }

  const data: FredApiResponse = await res.json()

  return (data.observations ?? []).map((o) => ({
    date: o.date,
    value: o.value === '.' ? null : parseFloat(o.value),
  }))
}

export function getLatestTwo(obs: FredObservation[]): {
  current: FredObservation | null
  previous: FredObservation | null
} {
  const valid = obs.filter((o) => o.value !== null).slice(-2)
  return {
    current: valid[valid.length - 1] ?? null,
    previous: valid[valid.length - 2] ?? null,
  }
}
