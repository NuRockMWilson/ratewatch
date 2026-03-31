import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export interface NewsItem {
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  category: 'rates' | 'realestate' | 'economy' | 'policy'
}

const RSS_FEEDS = [
  {
    url: 'https://feeds.reuters.com/reuters/businessNews',
    source: 'Reuters',
    category: 'economy' as const,
  },
  {
    url: 'https://www.housingwire.com/feed/',
    source: 'HousingWire',
    category: 'realestate' as const,
  },
  {
    url: 'https://www.calculatedriskblog.com/feeds/posts/default',
    source: 'Calculated Risk',
    category: 'economy' as const,
  },
  {
    url: 'https://feeds.feedburner.com/NakedCapitalism',
    source: 'Naked Capitalism',
    category: 'economy' as const,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    source: 'Federal Reserve',
    category: 'policy' as const,
  },
  {
    url: 'https://www.bisnow.com/rss',
    source: 'Bisnow',
    category: 'realestate' as const,
  },
  {
    url: 'https://www.wsj.com/xml/rss/3_7085.xml',
    source: 'WSJ Real Estate',
    category: 'realestate' as const,
  },
  {
    url: 'https://www.globest.com/feed/',
    source: 'GlobeSt',
    category: 'realestate' as const,
  },
]

// Keywords relevant to NuRock / LIHTC / financial markets
const RELEVANT_KEYWORDS = [
  'treasury', 'yield', 'interest rate', 'federal reserve', 'fed ', 'fomc',
  'mortgage', 'real estate', 'housing', 'apartment', 'multifamily',
  'lihtc', 'affordable housing', 'hud', 'fannie', 'freddie', 'cmbs',
  'inflation', 'cpi', 'sofr', 'prime rate', 'bond', 'debt', 'credit',
  'cap rate', 'noi', 'reit', 'commercial real estate', 'cre',
  'construction', 'developer', 'development', 'tariff', 'recession',
  'gdp', 'jobs', 'employment', 'tax credit', 'section 42',
]

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  return RELEVANT_KEYWORDS.some(kw => lower.includes(kw))
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

function extractItems(xml: string, source: string, category: NewsItem['category']): NewsItem[] {
  const items: NewsItem[] = []
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

  for (const item of itemMatches.slice(0, 15)) {
    const title = stripHtml(item.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '')
    const link = (item.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] ?? '').trim()
    const pubDate = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? ''
    const desc = stripHtml(
      item.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] ??
      item.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? ''
    )

    if (!title || !link) continue
    if (!isRelevant(title + ' ' + desc)) continue

    let publishedAt = ''
    try {
      publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
    } catch {
      publishedAt = new Date().toISOString()
    }

    items.push({ title, summary: desc, url: link, source, category, publishedAt })
  }

  return items
}

async function fetchFeed(feed: typeof RSS_FEEDS[0]): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RateWatch/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    return extractItems(xml, feed.source, feed.category)
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed))

    const allItems: NewsItem[] = results
      .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === 'fulfilled')
      .flatMap(r => r.value)

    // Sort by date descending, deduplicate by title
    const seen = new Set<string>()
    const deduped = allItems
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .filter(item => {
        const key = item.title.slice(0, 60).toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 30)

    return NextResponse.json({
      data: deduped,
      count: deduped.length,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message, data: [] }, { status: 500 })
  }
}
