import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { rates, indices } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ summary: null, error: 'ANTHROPIC_API_KEY not set' }, { status: 200 })
    }

    const rateLines = rates
      .map((r: { shortName: string; current: number | null; change: number | null }) =>
        `${r.shortName}: ${r.current?.toFixed(2) ?? '—'}% (Δ ${r.change != null ? (r.change > 0 ? '+' : '') + r.change.toFixed(2) : '—'})`,
      )
      .join(', ')

    const indexLines = indices
      .map((i: { ticker: string; current: number | null; changePct: number | null }) =>
        `${i.ticker}: ${i.current?.toLocaleString() ?? '—'} (${i.changePct != null ? (i.changePct > 0 ? '+' : '') + i.changePct.toFixed(2) + '%' : '—'})`,
      )
      .join(', ')

    const prompt = `You are a senior fixed-income analyst. Write a crisp 2-sentence market snapshot based on the data below. Be specific, factual, and professional. No markdown, no bullet points, no headers.

Interest Rates: ${rateLines}
Market Indices: ${indexLines}

Market snapshot:`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 180,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    const summary = data.content?.[0]?.text ?? null

    return NextResponse.json({ summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ summary: null, error: message }, { status: 500 })
  }
}
