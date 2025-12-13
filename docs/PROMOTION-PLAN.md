# BTC Battle - Promotion Plan

> **App:** [base-signal.vercel.app](https://base-signal.vercel.app)  
> **GitHub:** [github.com/mbennett-labs/base-signal](https://github.com/mbennett-labs/base-signal)  
> **Farcaster:** @freakid  
> **Last Updated:** December 2024

---

## ✅ Completed

- [x] Deploy app to Vercel
- [x] Configure manifest with Farcaster signature
- [x] Register on Base Build
- [x] Claim $600 paymaster credits
- [x] Update personal info for Builder Rewards
- [x] Fix manifest validation errors (description, tags, ogTitle)
- [x] Fix account association (valid FID signature)
- [x] Add working news article links (Farcaster SDK)
- [x] Close Neynar API security issue (switched to Pinata Hub)
- [x] Submit for Base Featured placement
---
---

## 🛠️ Technical To-Do (Priority)

### Next Session
- [ ] **Live Farcaster Feed** - Currently static curated content
  - Issue: Pinata Hub API gets CORS blocked + 429 rate limits from client-side
  - Solution: Create `/app/api/farcaster/route.ts` server-side route
  - Estimated time: 15-20 mins

### Backlog
- [ ] Real Whale Data (Whale Alert API or custom listener)
- [ ] CoinGecko server-side proxy (avoid rate limits)
- [ ] User authentication (Sign in with Farcaster)
- [ ] Price alerts
- [ ] Historical battle data

### Fixed ✅
- [x] News article clickable links (Farcaster SDK)
- [x] Manifest validation errors
- [x] Account association signature  
- [x] Farcaster feed text overlap glitch
- [x] Neynar API key exposure


---

## 🔴 Phase 1: Foundation (1 hour)

### Assets to Gather
- [ ] Take 3-4 fresh screenshots of the app
- [ ] Create short description (160 chars)
- [ ] Create long description (for submissions)

### Short Description (160 chars)
```
Real-time Bitcoin whale war visualization. Watch bulls vs bears battle with live whale tracking, Fear & Greed sentiment, and crypto news.
```

### Long Description
```
BTC Battle is a real-time market sentiment visualization tool that gamifies Bitcoin price action. Watch bulls and bears fight in a live tug-of-war powered by actual market data including whale movements, Fear & Greed Index, BTC dominance, and breaking crypto news. Built on Base with Farcaster integration.
```

---

## 🟠 Phase 2: Farcaster Channels (30 mins)

### /miniapps Channel
- [ ] Post to /miniapps

```
Just shipped BTC Battle ⚔️

A real-time Bitcoin whale war visualization - watch bulls vs bears fight based on actual market data!

Features:
🐋 Live whale movement tracking
📊 Fear & Greed sentiment
📰 Crypto news feed with clickable sources
🟣 Farcaster social integration

Built on Base, would love feedback from the community!

base-signal.vercel.app
```

### /base Channel
- [ ] Post to /base

```
Shipped my first Mini App on Base! 🔵

BTC Battle - a real-time visualization of the eternal bull vs bear fight, powered by whale data and market sentiment.

Applied for Featured placement, fingers crossed 🤞

Try it: base-signal.vercel.app
```

### /bitcoin Channel
- [ ] Post to /bitcoin

```
Built something for my fellow BTC watchers ⚔️

BTC Battle shows you the bull vs bear war in real-time:
- Whale movements (100+ BTC transactions)
- Fear & Greed Index
- BTC dominance tracking
- Breaking news with direct source links

Who's winning today? 🐂 or 🐻

base-signal.vercel.app
```

### /trading Channel
- [ ] Post to /trading

```
New tool for the trading degens 📊

BTC Battle - visualize market sentiment in real-time:
• Tug-of-war based on whale activity
• Fear & Greed indicator
• RSI, BTC.D, USDT.D stats
• News feed with sentiment tags

Helps me gauge market mood at a glance.

base-signal.vercel.app
```

### /dev Channel
- [ ] Post to /dev

```
Open source Mini App shipped! 🛠️

BTC Battle - React/Next.js app with:
- CoinGecko API (free tier)
- Alternative.me Fear & Greed API
- Pinata Hub for Farcaster data (free!)
- Farcaster SDK for external links

No paid APIs needed. Code is public if anyone wants to fork.

github.com/mbennett-labs/base-signal
```

---

## 🟡 Phase 3: X/Twitter (20 mins)

### Main Launch Tweet
- [ ] Post launch tweet

```
Just shipped BTC Battle ⚔️

A real-time Bitcoin whale war visualization built on @base

Watch bulls vs bears fight based on:
🐋 Whale movements
😱 Fear & Greed
📰 Live news
📊 Market dominance

Try it 👇
base-signal.vercel.app

@BuildOnBase @faborhood
```

### Thread Option (5 tweets)
- [ ] Post thread version

**Tweet 1:**
```
I built a tool to visualize the eternal crypto battle: Bulls vs Bears ⚔️

BTC Battle shows you who's winning in real-time.

Here's what it does 🧵
```

**Tweet 2:**
```
The core feature is a tug-of-war visualization.

It moves based on:
- Whale buy/sell activity
- Fear & Greed Index
- Price momentum
- Long/Short ratios

When bulls are winning, the rope pulls left 🐂
When bears dominate, it pulls right 🐻
```

**Tweet 3:**
```
Data sources (all free!):
- CoinGecko for price & dominance
- Alternative.me for Fear & Greed
- Simulated whale alerts (real API coming)
- CryptoPanic for news

No paid APIs needed to run this.
```

**Tweet 4:**
```
Built with:
- Next.js + React
- Deployed on Vercel
- Farcaster Mini App SDK
- Running on Base

The whole thing is open source 👇
github.com/mbennett-labs/base-signal
```

**Tweet 5:**
```
Try it yourself:
base-signal.vercel.app

Would love feedback - what indicators would you add?

Built by @QuantumShieldLab
```

### Engagement Strategy
- [ ] Reply to @BuildOnBase tweets with app link
- [ ] Reply to whale alert tweets with "Track the battle: [link]"
- [ ] Quote tweet any Base Mini App discussions

---

## 🟢 Phase 4: Discord (30 mins)

### Base Discord
- [ ] Post in #builders-showcase

```
**BTC Battle** - Real-time whale war visualization

Just shipped this Mini App on Base! It visualizes the bull vs bear battle using live market data.

**Features:**
- Tug-of-war based on whale activity
- Fear & Greed sentiment
- Crypto news with clickable sources
- Farcaster social feed

**Links:**
- App: base-signal.vercel.app
- GitHub: github.com/mbennett-labs/base-signal

Applied for Featured placement. Feedback welcome! 🙏
```

### Farcaster Discord
- [ ] Post in #mini-apps or #showcase

```
Shipped a Mini App: BTC Battle

Real-time Bitcoin sentiment visualization with whale tracking, Fear & Greed, and integrated news feed.

Using the Farcaster SDK for external links - works great in Base App!

base-signal.vercel.app
```

### Coinbase Developers Discord
- [ ] Post in showcase channel (if available)

---

## 🔵 Phase 5: Directories & Listings (1 hour)

### Primary Submissions
- [ ] miniapps.zone (Farcaster Mini App directory)
- [ ] base.org/ecosystem (Base ecosystem page)
- [ ] dappradar.com/submit-dapp
- [ ] alchemy.com/dapps
- [ ] stateofthedapps.com

### Secondary Submissions
- [ ] producthunt.com (consider for bigger launch)
- [ ] betalist.com
- [ ] alternativeto.net

---

## 🟣 Phase 6: Content & Blogs (2-3 hours)

### Mirror.xyz Article
- [ ] Write and publish on Mirror

**Title:** "Building BTC Battle: A Real-Time Whale War Visualization on Base"

**Outline:**
1. The idea - gamifying market sentiment
2. Tech stack choices (free APIs only)
3. Farcaster Mini App integration
4. Challenges and solutions
5. What's next

### Dev.to Technical Post
- [ ] Write and publish on Dev.to

**Title:** "How I Built a Real-Time Bitcoin Tracker with Free APIs"

**Focus on:**
- CoinGecko API integration
- Fear & Greed API
- Farcaster SDK for Mini Apps
- Code snippets and examples

### LinkedIn Post
- [ ] Post professional update

```
Excited to share my latest project: BTC Battle

A real-time market sentiment visualization tool built on Base (Coinbase L2).

Technical highlights:
• React/Next.js frontend
• Multiple free API integrations
• Farcaster Mini App SDK
• Deployed on Vercel

This project showcases my work at QuantumShieldLabs, focusing on blockchain development and market intelligence tools.

Try it: base-signal.vercel.app
GitHub: github.com/mbennett-labs/base-signal

#blockchain #cryptocurrency #webdev #base #react
```

---

## ⚪ Phase 7: GitHub Optimization (30 mins)

### README Updates
- [ ] Add project banner/logo
- [ ] Add screenshots
- [ ] Add feature list with emojis
- [ ] Add tech stack badges
- [ ] Add "Built with" section
- [ ] Add deployment instructions

### Repository Settings
- [ ] Add topics: `bitcoin`, `base`, `farcaster`, `mini-app`, `nextjs`, `crypto`, `whale-tracking`, `market-sentiment`
- [ ] Pin repo to GitHub profile
- [ ] Add social preview image (1280x640)
- [ ] Add website link to repo

---

## 🏆 Phase 8: Grants & Competitions (Ongoing)

### Active Opportunities
- [ ] Check Base grants: base.org/grants
- [ ] Monitor Farcaster Mini App Rewards (automatic based on usage)
- [ ] Watch for ETHGlobal hackathons
- [ ] Look for Base/Farcaster buildathons

### Grant Application Notes
```
Project: BTC Battle
Category: Consumer/DeFi Tools
Ask: $X for [specific development]
Impact: Market education, onchain activity on Base
```

---

## 🔧 Phase 9: Future Enhancements

### Widget/Embed Feature
- [ ] Add `?widget=true` URL parameter
- [ ] Create `/embed` page with code generator
- [ ] Multiple size options (mini, compact, full)
- [ ] Monetization: free with branding, paid white-label

### Real Whale Data
- [ ] Integrate Whale Alert API (paid)
- [ ] Or build custom blockchain listener

### Additional Features
- [ ] Price alerts
- [ ] Historical battle data
- [ ] Leaderboard for predictions
- [ ] Multi-coin support (ETH, SOL)

---

## 📊 Tracking Metrics

| Metric | Where to Check | Goal (Week 1) |
|--------|----------------|---------------|
| App opens | base.dev dashboard | 100+ |
| Mini App adds | Farcaster | 50+ |
| GitHub stars | GitHub | 25+ |
| Cast engagement | Warpcast | Track |
| News clicks | - | - |

---

## 📅 Weekly Schedule

### Monday
- [ ] Check analytics on base.dev
- [ ] Reply to any comments/feedback
- [ ] Post a feature highlight

### Wednesday
- [ ] Post in a new channel
- [ ] Engage with community posts

### Friday
- [ ] Tweet an update or insight
- [ ] Check grant/competition deadlines

### Weekend
- [ ] Work on new features
- [ ] Write content (Mirror/Dev.to)

---

## 📝 Notes

_Add your notes here as you execute the plan_

- 
- 
- 

---

**Remember:** Don't do everything at once! Pick 2-3 items per day and stay consistent. Quality > quantity.
