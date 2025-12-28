# BTC Battle - Testing & Maintenance Guide

## Quick Links
- **Live App:** https://base-signal.vercel.app
- **GitHub:** https://github.com/mbennett-labs/base-signal
- **Base Build Dashboard:** https://base.dev
- **Vercel Dashboard:** https://vercel.com/mike-bennetts-projects/base-signal

---

## Daily Quick Check (2 min)

### Browser Test
1. Open https://base-signal.vercel.app
   - [ ] Price loads (not "...")
   - [ ] Price matches CoinGecko roughly
   - [ ] Fear & Greed displays
   - [ ] No console errors

### Mini App Test
2. Open in Farcaster (Warpcast)
   - [ ] Price loads inside frame
   - [ ] Tabs work (Battle/News/Social/TA)
   - [ ] No blank screen

---

## Weekly Full Test (10 min)

### 1. API Health Check
Open each URL in browser - should return JSON, not errors:

| Endpoint | Expected |
|----------|----------|
| `/api/price` | `{"price":XXXXX,"change":X.XX}` |
| `/api/farcaster` | `{"casts":[...]}` |
| `/.well-known/farcaster.json` | Full manifest JSON |

```
https://base-signal.vercel.app/api/price
https://base-signal.vercel.app/api/farcaster
https://base-signal.vercel.app/.well-known/farcaster.json
```

### 2. Features Test

**Battle Tab:**
- [ ] Price displays and flashes on change
- [ ] Tug of war rope animates
- [ ] Bull/Bear power meters update
- [ ] Whale alerts populate

**News Tab:**
- [ ] Articles load (not empty)
- [ ] Links open correctly
- [ ] Sentiment badges show

**Social Tab:**
- [ ] Farcaster feed loads
- [ ] Refresh button works
- [ ] Channel tags display

**TA Tab:**
- [ ] 4H analysis generates
- [ ] Daily analysis generates
- [ ] Weekly analysis generates
- [ ] Market data grid shows values

**UI Elements:**
- [ ] Legend modal opens/closes
- [ ] Light/Dark mode toggle works
- [ ] Tip wallet address copies
- [ ] Footer stats display with tooltips

### 3. Mini App Context Testing

| Platform | Test |
|----------|------|
| Warpcast Mobile | Open from cast, verify loads |
| Warpcast Web | Open from cast, verify loads |
| Base App | Open Mini App, verify loads |
| Embed Preview | Share link shows rich preview |

### 4. Manifest Validation
1. Go to https://base.dev/preview
2. Enter: `base-signal.vercel.app`
3. Check all items have green checkmarks:
   - [ ] Account association
   - [ ] Domain matches
   - [ ] Signature valid
   - [ ] All metadata fields valid

---

## Monthly Review

### Performance & Errors
- [ ] Check Vercel dashboard for failed deployments
- [ ] Review Vercel analytics for error spikes
- [ ] Check function logs for API failures

### API Status
- [ ] CoinGecko API - check rate limit status
- [ ] Alternative.me (Fear & Greed) - verify still active
- [ ] CryptoPanic (News) - verify still returning data

### Business
- [ ] Review Base Build dashboard for rewards
- [ ] Check app analytics/usage stats
- [ ] Review any user feedback

### Maintenance
- [ ] Update dependencies if needed (`npm outdated`)
- [ ] Refresh any stale fallback data
- [ ] Test after any Farcaster SDK updates

---

## Troubleshooting

### Price shows "..." or 0.00%
1. Check `/api/price` endpoint
2. Verify CoinGecko isn't rate-limited
3. Check Vercel function logs

### Mini App won't load in Farcaster
1. Verify manifest at `/.well-known/farcaster.json`
2. Check signature hasn't expired
3. Test in base.dev/preview
4. Clear Warpcast cache / reinstall

### News/Farcaster feed empty
1. Check respective API endpoints
2. Fallback data should show if API fails
3. Check for CORS issues in console

### TA won't generate
1. Check `/api/ta-summary` endpoint
2. Verify Anthropic API key in Vercel env vars
3. Check function logs for errors

---

## Emergency Contacts

- **Vercel Status:** https://www.vercel-status.com/
- **CoinGecko Status:** https://status.coingecko.com/
- **Farcaster Support:** Discord or @faboratory on Warpcast
- **Base Support:** https://base.org/discord

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| Dec 2024 | 1.0 | Initial launch |
| Dec 22, 2024 | 1.1 | Added /api/price for Mini App CORS fix |
| | | Fixed price drift (real API only) |
