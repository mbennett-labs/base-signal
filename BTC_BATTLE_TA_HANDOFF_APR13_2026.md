\# BTC Battle TA Migration — Pinned Apr 13 2026 \~3:30 PM



\## Current State

BTC Battle TA buttons (4H/Daily/Weekly) returning "Failed to generate summary"

on https://base-signal.vercel.app. Root cause was env var mismatch on Vercel.

Fix is queued but blocked by Vercel daily deploy limit.



\## What's Already Done

1\. VPS fallback service deployed at https://ta.quantumshieldlabs.dev/summary

&#x20;  - Express + nginx + Let's Encrypt SSL (cert valid until 2026-07-12)

&#x20;  - Running under PM2 as `btc-battle-ta` (id 25)

&#x20;  - Uses OpenRouter `deepseek/deepseek-chat` (paid, \~$0.0002/call)

&#x20;  - Bound to OpenRouter key `btc-battle-ta-prod` ($5/month cap)

&#x20;  - Files: /opt/btc-battle-ta/{server.js,package.json,.env}

&#x20;  - Tested end-to-end with real BTC market data — returns valid TA prose

&#x20;  - PM2 startup persistence: NOT YET VERIFIED — run `pm2 startup` to confirm



2\. Vercel route already migrated to OpenRouter in commit 6ead5ab

&#x20;  - File: app/api/ta-summary/route.ts

&#x20;  - Uses anthropic/claude-haiku-4-5 via OpenRouter

&#x20;  - Reads process.env.OPENROUTER\_API\_KEY



3\. Vercel env var renamed OpenRouterDeepSeek → OPENROUTER\_API\_KEY

&#x20;  - All three environments (Production, Preview, Development)

&#x20;  - Done \~3:25 PM Apr 13



\## What's Blocked

\- Vercel Hobby plan hit "api-deployments-free-per-day" limit (>100 deploys/24h)

\- Both dashboard "Redeploy" and `vercel --prod` CLI return same error

\- Resets 24h from the limit hit — try again \~3:30 PM Apr 14



\## Tomorrow's Action (60 seconds)

1\. Vercel dashboard → base-signal → Deployments

2\. Click `...` on latest production deployment (EG2m2PCpy from Feb 14)

3\. Redeploy with "Use existing build cache" CHECKED

4\. Wait 30-60 sec

5\. Test https://base-signal.vercel.app — click 4H TA button

6\. Should return real DeepSeek/Haiku-generated TA prose



\## If The Fix Doesn't Work

\- Open browser console (F12) and check the error

\- Most likely cause: OpenRouter key value in Vercel env var is wrong/expired

\- Fallback: cut frontend over to VPS service (see "Permanent Fix" below)



\## Permanent Fix (Future Work, Not Urgent)

Cut BTC Battle frontend off Vercel API entirely:



1\. Find the React component calling /api/ta-summary

&#x20;  `findstr /s /i "ta-summary" \*.tsx \*.ts` in C:\\Users\\mikeb\\base-signal

2\. Change fetch URL from /api/ta-summary to https://ta.quantumshieldlabs.dev/summary

3\. Delete app/api/ta-summary/route.ts

4\. Delete OPENROUTER\_API\_KEY from Vercel (no longer needed)

5\. Tighten CORS on VPS service: change `res.header('Access-Control-Allow-Origin', '\*')`

&#x20;  in /opt/btc-battle-ta/server.js to the actual base-signal.vercel.app domain

6\. pm2 restart btc-battle-ta

7\. Push frontend change, deploy



This eliminates BTC Battle from Vercel quota pressure permanently.



\## Why The Daily Deploy Limit Was Hit

UNKNOWN — investigate before this becomes recurring:

`git log --oneline --since="24 hours ago"` in base-signal repo

Likely culprits: Claude Code in tight loop, runaway webhook, bad cron



\## Key Reference

| Item | Value |

|---|---|

| VPS service URL | https://ta.quantumshieldlabs.dev/summary |

| VPS health check | https://ta.quantumshieldlabs.dev/health |

| PM2 process name | btc-battle-ta |

| OpenRouter key (VPS) | btc-battle-ta-prod ($5 cap) |

| Vercel project | mike-bennetts-projects/base-signal |

| Vercel env var | OPENROUTER\_API\_KEY (renamed from OpenRouterDeepSeek) |

| Last successful prod deploy | EG2m2PCpy (Feb 14, commit 643fe61) |

| Latest commit on main | 6ead5ab "Switch API key and endpoint to OpenRouter" |

| Local repo path | C:\\Users\\mikeb\\base-signal |

| Stale duplicate (do not edit) | C:\\Users\\mikeb\\Documents\\base-signal |



\## Loose Threads From This Session

1\. polymarket-reporter PM2 process is STOPPED on VPS — investigate why

2\. polymarket-poller had only 94s uptime when checked — possible crash loop

3\. researchbot PM2 process is STOPPED on VPS — verify if intentional

&#x20;  (it's supposed to run on Windows, not VPS)

4\. C:\\Users\\mikeb\\Documents\\base-signal is stale duplicate — rename to

&#x20;  base-signal-OLD or delete after confirming nothing depends on it

5\. eth.merkle.io CORS errors on base-signal frontend — unrelated to TA fix,

&#x20;  but breaking other features. Separate ticket.

6\. Why was the migration in commit 6ead5ab not in SESSION\_HANDOFF.md?

&#x20;  Leak in the handoff system worth investigating.



\## Resume Prompt For Tomorrow's Claude Session

Resume BTC Battle TA fix from yesterday's pin. Read

C:\\Users\\mikeb\\base-signal\\BTC\_BATTLE\_TA\_HANDOFF\_APR13\_2026.md

for full context. The Vercel daily deploy limit should be reset by now.

Need to: redeploy base-signal on Vercel with build cache enabled, then

test that the TA buttons work on https://base-signal.vercel.app. If

they work, we're done. If not, fall back to cutting the frontend over

to the VPS service at https://ta.quantumshieldlabs.dev/summary.

