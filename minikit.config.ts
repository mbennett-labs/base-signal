const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL 
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
    : 'http://localhost:3000');

/**
 * MiniApp configuration for BTC Battle
 */
export const minikitConfig = {
 accountAssociation: {
  "header": "eyJmaWQiOjQzNjE3NiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDM3NWFiOGFGOEUyMThEQzA2MDBCNjNFMERFMzQ0QUQyQUFmOUQ4ODMifQ",
  "payload": "eyJkb21haW4iOiJiYXNlLXNpZ25hbC52ZXJjZWwuYXBwIn0",
  "signature": "mi/rlJr+A3R0XQCc867g8gQ+K6FsvhDmd/zPhqeAaYp37wQO9N9ps2l5wV+mgfC1dEPpmEusWeoOsl1JYleafxw="
},
  baseBuilder: {
    "ownerAddress": "0x91c6a08f25a5feb3BBaB465A8a0e59DC05D5A7b0"
  },
  miniapp: {
    version: "1",
    name: "BTC Battle",
    subtitle: "Real-Time Whale War",
    description: "Watch bulls and bears fight in real-time! Track whale movements, sentiment, and see who's winning the Bitcoin battle.",
    screenshotUrls: [
      `${ROOT_URL}/screenshot-1.png`,
      `${ROOT_URL}/screenshot-2-news.png`,
      `${ROOT_URL}/screenshot-3-farcaster.png`
    ],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#0a0a0f",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["trading", "bitcoin", "whales", "analytics", "defi"],
    heroImageUrl: `${ROOT_URL}/og.png`,
    tagline: "Who's winning? Bulls or Bears?",
    ogTitle: "BTC Battle - Whale War",
    ogDescription: "Watch bulls and bears fight for Bitcoin dominance",
    ogImageUrl: `${ROOT_URL}/og.png`,
    noindex: false
  },
} as const;
