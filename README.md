# RateWatch

Real-time US interest rates and major market indices dashboard, built with Next.js 14, FRED API, and Claude AI.

## Features

- **Live Interest Rates** — 10Y/2Y/30Y/5Y Treasury yields, SOFR, Prime Rate, Fed Funds, TIPS
- **Major Market Indices** — S&P 500, DJIA, NASDAQ Composite, Wilshire 5000 (via FRED)
- **Historical Charts** — 1W / 1M / 6M / 1Y range selector with trend summary
- **AI Market Snapshot** — 2-sentence analysis powered by Claude (optional)
- **Auto-refresh** — polls every 15 minutes; FRED data cached server-side for 15 min
- **Dark mode** — automatic via `prefers-color-scheme`

---

## Quick Start

### 1. Get a free FRED API key

1. Go to [https://fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html)
2. Create a free account and request an API key (instant)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Required — FRED API key
FRED_API_KEY=your_fred_api_key_here

# Optional — enables AI market snapshots
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**:
- `FRED_API_KEY` — required
- `ANTHROPIC_API_KEY` — optional (enables AI summaries)

Or use the Vercel CLI:
```bash
vercel env add FRED_API_KEY
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/rates` | GET | Current snapshots for all rate series |
| `/api/indices` | GET | Current snapshots for all index series |
| `/api/history?series=DGS10&range=1M` | GET | Historical data for any FRED series |
| `/api/ai-summary` | POST | AI-generated market summary |

### History endpoint params

| Param | Values | Default |
|-------|--------|---------|
| `series` | Any FRED series ID (e.g. `DGS10`, `SOFR`, `SP500`) | required |
| `range` | `1W` \| `1M` \| `6M` \| `1Y` | `1M` |

---

## FRED Series Used

| Series ID | Name |
|-----------|------|
| `DGS10` | 10-Year Treasury Constant Maturity |
| `DGS2` | 2-Year Treasury Constant Maturity |
| `DGS30` | 30-Year Treasury Constant Maturity |
| `DGS5` | 5-Year Treasury Constant Maturity |
| `SOFR` | Secured Overnight Financing Rate |
| `DPRIME` | Bank Prime Loan Rate |
| `FEDFUNDS` | Effective Federal Funds Rate |
| `DFII10` | 10-Year TIPS Yield |
| `SP500` | S&P 500 Index |
| `DJIA` | Dow Jones Industrial Average |
| `NASDAQCOM` | NASDAQ Composite Index |
| `WILL5000PR` | Wilshire 5000 Total Market Index |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── rates/route.ts       # Current rate snapshots
│   │   ├── indices/route.ts     # Current index snapshots
│   │   ├── history/route.ts     # Historical FRED data
│   │   └── ai-summary/route.ts  # Claude AI summary
│   ├── globals.css              # Design tokens + base styles
│   ├── layout.tsx               # Root layout with fonts
│   └── page.tsx                 # Main dashboard page
├── components/
│   ├── RateCard.tsx             # Interest rate card
│   ├── IndexCard.tsx            # Market index card
│   ├── HistoryChart.tsx         # Recharts line chart + range selector
│   └── AISummary.tsx            # AI market snapshot panel
└── lib/
    ├── fred.ts                  # Series definitions + types
    └── fredApi.ts               # FRED API fetch utility
```

---

## Notes

- FRED updates most daily series by ~3–4 PM ET on business days
- Some series (e.g. `FEDFUNDS`) are monthly — the latest value will reflect the most recent month
- Index data from FRED is end-of-day, not intraday tick data
- For intraday equity prices, integrate Polygon.io or Alpha Vantage on top of this foundation
