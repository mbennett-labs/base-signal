const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    // Leave empty for now - we'll fill this after signing
    "header": "",
    "payload": "",
    "signature": ""
  },
  baseBuilder: {
    "ownerAddress": "0x91c6a08f25a5feb3BBaB465A8a0e59DC05D5A7b0"
  },
  miniapp: {
    version: "1",
    name: "Base Signal",
    subtitle: "Market Intelligence Dashboard",
    description: "Track altseason signals, BTC dominance, and key market indicators in real-time.",
    screenshotUrls: [`${ROOT_URL}/og.png`], // We'll add these later
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#0052FF", // Base blue
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["trading", "defi", "analytics", "market-data"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Your altseason radar",
    ogTitle: "Base Signal",
    ogDescription: "Track market signals on Base",
    ogImageUrl: `${ROOT_URL}/og.png`,
    noindex: false
  },
} as const;

