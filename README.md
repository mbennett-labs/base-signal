# BTC Battle ⚔️

Real-time Bitcoin whale war visualization. Watch bulls and bears fight for market dominance!

![BTC Battle](https://base-signal.vercel.app/hero.png)

## Features

- 🐂 **Tug of War Visualization** - See bulls vs bears battle in real-time
- 🐋 **Whale Movements** - Track large BTC transactions
- 📊 **Live Market Data** - BTC price, dominance, Fear & Greed
- 🌤️ **Sentiment Weather** - Market mood at a glance
- 📱 **Mobile Optimized** - Works great on any device
- 🔵 **Base Mini App** - Integrated with Farcaster

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- CoinGecko API
- Alternative.me Fear & Greed API
- MiniKit (Base/Farcaster integration)

## Data Sources

| Metric | Source |
|--------|--------|
| BTC Price | CoinGecko |
| BTC/USDT Dominance | CoinGecko Global |
| Fear & Greed Index | Alternative.me |
| Whale Alerts | Simulated (upgrade to WhaleAlert API) |

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mbennett-labs/base-signal)

## Live Demo

[base-signal.vercel.app](https://base-signal.vercel.app)

## Stats Explained

| Stat | Meaning |
|------|---------|
| BTC.D | Bitcoin's % of total crypto market cap |
| USDT.D | Stablecoin dominance (cash on sidelines) |
| RSI | Relative Strength Index (overbought/oversold) |
| L/S | Long/Short ratio on futures exchanges |
| F&G | Fear & Greed sentiment (0-100) |

## Built By

**QuantumShieldLabs** - [GitHub](https://github.com/mbennett-labs)

## License

MIT
