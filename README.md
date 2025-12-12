# BTC Battle - Real-Time Whale War Visualization

A Base Mini App that visualizes Bitcoin whale activity as a real-time tug-of-war battle between bulls and bears.

**Live Demo:** [base-signal.vercel.app](https://base-signal.vercel.app)

## Features

- 🐋 **Live Whale Tracking** - Real-time Bitcoin whale movements visualization
- ⚔️ **Battle Visualization** - Tug-of-war animation between bulls and bears
- 📊 **Market Intelligence** - BTC dominance, Fear & Greed index, volume data
- 📰 **Crypto News Feed** - Latest news from CryptoPanic API
- 💬 **Farcaster Integration** - Live casts from crypto community
- 🌓 **Light/Dark Mode** - Toggle between themes
- 📱 **Mobile Optimized** - Works in Farcaster/Base App

## Tech Stack

- **Framework:** Next.js 15.3.6
- **Deployment:** Vercel
- **Blockchain:** Base (Coinbase L2)
- **Social:** Farcaster Mini App SDK
- **APIs:**
  - Pinata Farcaster Hub (FREE - no API key needed)
  - CoinGecko (market data)
  - CryptoPanic (news)

## API Integration Notes

### Farcaster Data (Pinata Hub - FREE)

We use Pinata's free Farcaster Hub API - **no API key required!**

```javascript
// Fetch casts by FID (Farcaster ID)
const response = await fetch(
  `https://hub.pinata.cloud/v1/castsByFid?fid=${fid}&pageSize=3&reverse=true`
);

// Fetch user data (username, profile pic)
const userResponse = await fetch(
  `https://hub.pinata.cloud/v1/userDataByFid?fid=${fid}`
);
```

**Popular FIDs:**
- dwr.eth (Dan Romero): `3`
- vitalik.eth: `5650`
- jessepollak (Base lead): `99`

**Why Pinata instead of Neynar?**
- Neynar moved to x402 micropayments (requires wallet funding)
- Pinata Hub is completely free
- No API key or authentication needed

### Market Data (CoinGecko)

Free tier with rate limits. Falls back to cached/mock data if rate limited.

### News (CryptoPanic)

Free tier available. Falls back to mock data if unavailable.

## Local Development

```bash
# Clone the repo
git clone https://github.com/mbennett-labs/base-signal.git
cd base-signal

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

Automatically deploys to Vercel on push to `main` branch.

```bash
git add .
git commit -m "Your changes"
git push
```

## Base Mini App Configuration

The app is configured as a Farcaster Mini App via `minikit.config.ts`:

- **App Name:** BTC Battle
- **Category:** Finance
- **Owner Address:** Set in config
- **Manifest:** `/.well-known/farcaster.json`

## File Structure

```
├── app/
│   ├── page.tsx          # Main app component
│   ├── layout.tsx        # Root layout
│   └── .well-known/      # Farcaster manifest
├── public/
│   ├── icon-1024.png     # App icon (1024x1024)
│   ├── screenshot-*.png  # App store screenshots
│   └── splash.png        # Splash screen
├── minikit.config.ts     # Mini App configuration
└── package.json
```

## Troubleshooting

### "Ready not called" in Farcaster Preview
This is a warning, not an error. Click "Hide splash screen" to test the app. The SDK ready() call requires specific setup that may conflict with some deployments.

### Fallback data showing instead of real data
Check browser console (F12) for API errors. Common issues:
- Rate limiting (wait and retry)
- CORS errors (API may have changed)
- Network issues

### Build failures on Vercel
- Ensure Next.js version is 15.3.6+ (security patch required)
- Check for syntax errors in page.tsx
- Review Vercel build logs

## Security Notes

- No sensitive API keys are exposed (Pinata Hub is public)
- Wallet addresses in config are public identifiers only
- No token approvals or spending permissions required

## Credits

Built by [QuantumShieldLabs](https://quantumshieldlabs.dev)

**Tip Wallet:** `0x8E4BdCE9B48C7EBc13b2DBAEa4A357e5cA2de19`

## License

MIT
