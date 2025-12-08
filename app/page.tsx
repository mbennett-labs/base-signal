"use client";

import { useEffect, useState, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// Types
interface PriceData {
  price: number;
  market_cap: number;
  volume_24h: number;
  change_24h: number;
}

interface DominanceData {
  btc_dominance: number;
  eth_dominance: number;
  others_dominance: number;
  stablecoin_dominance: number;
  total_market_cap: number;
}

interface OldCoinData {
  symbol: string;
  price: number;
  change_24h: number;
  vol_mcap_ratio: number;
}

interface MarketData {
  prices: Record<string, PriceData>;
  dominance: DominanceData;
  oldCoins: Record<string, OldCoinData>;
  altseasonScore: number;
  signals: string[];
  lastUpdate: Date;
}

// BTC Critical Levels (from Altseason Sentinel)
const BTC_LEVELS = {
  critical_low: 104000,
  critical_high: 105000,
  bull_confirmation: 116000,
  breakdown: 88000,
};

// Target date for altseason window
const TARGET_DATE = new Date("2025-12-15");

// Old coins to track for revival signals
const OLD_COINS = [
  "internet-computer",
  "neo",
  "ethereum-classic",
  "filecoin",
  "stellar",
  "dash",
  "zcash",
];

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize MiniKit
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Calculate altseason score (port of Python algorithm)
  const calculateAltseasonScore = useCallback(
    (
      dominance: DominanceData | null,
      btcPrice: number | null
    ): [number, string[]] => {
      let score = 0;
      const signals: string[] = [];

      if (!dominance || !btcPrice) {
        return [50, ["⏳ Loading data..."]];
      }

      // Signal 1: BTC Dominance < 61%
      if (dominance.btc_dominance < 61) {
        score += 25;
        signals.push("✅ BTC dominance < 61%");
      } else if (dominance.btc_dominance < 64) {
        score += 15;
        signals.push("⏳ BTC dom approaching threshold");
      } else {
        signals.push("❌ BTC dominance too high");
      }

      // Signal 2: Others Dominance > 30%
      if (dominance.others_dominance > 30) {
        score += 25;
        signals.push("✅ Others dominance > 30%");
      } else if (dominance.others_dominance > 25) {
        score += 15;
        signals.push("⏳ Others dominance building");
      } else {
        signals.push("❌ Others dominance weak");
      }

      // Signal 3: Stablecoin dominance rejection
      if (dominance.stablecoin_dominance < 6) {
        score += 15;
        signals.push("✅ Stablecoin dom rejected");
      } else {
        score += 5;
        signals.push("📊 Stablecoin dom neutral");
      }

      // Signal 4: BTC holding key support
      if (btcPrice >= BTC_LEVELS.critical_low) {
        score += 20;
        signals.push("✅ BTC holding key support");
      } else if (btcPrice >= BTC_LEVELS.breakdown) {
        score += 10;
        signals.push("⚠️ BTC in caution zone");
      } else {
        signals.push("🚨 BTC below key support");
      }

      // Signal 5: Time remaining
      const daysRemaining = Math.ceil(
        (TARGET_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysRemaining > 0 && daysRemaining <= 45) {
        score += 15;
        signals.push(`⏳ ${daysRemaining} days remaining`);
      } else if (daysRemaining > 45) {
        score += 5;
        signals.push(`📅 ${daysRemaining} days to target`);
      } else {
        signals.push("⏰ Past target date");
      }

      return [Math.min(score, 100), signals];
    },
    []
  );

  // Fetch market data
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch main prices
      const pricesRes = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,litecoin&order=market_cap_desc&sparkline=false&price_change_percentage=24h"
      );
      
      if (!pricesRes.ok) {
        throw new Error("Failed to fetch prices");
      }
      
      const pricesJson = await pricesRes.json();

      const prices: Record<string, PriceData> = {};
      for (const coin of pricesJson) {
        prices[coin.id] = {
          price: coin.current_price,
          market_cap: coin.market_cap,
          volume_24h: coin.total_volume,
          change_24h: coin.price_change_percentage_24h || 0,
        };
      }

      // Small delay for rate limiting
      await new Promise((r) => setTimeout(r, 500));

      // Fetch dominance
      const globalRes = await fetch("https://api.coingecko.com/api/v3/global");
      
      if (!globalRes.ok) {
        throw new Error("Failed to fetch global data");
      }
      
      const globalJson = await globalRes.json();
      const globalData = globalJson.data;

      const btc_dom = globalData.market_cap_percentage?.btc || 0;
      const eth_dom = globalData.market_cap_percentage?.eth || 0;

      const dominance: DominanceData = {
        btc_dominance: btc_dom,
        eth_dominance: eth_dom,
        others_dominance: 100 - btc_dom - eth_dom,
        stablecoin_dominance: 5.0, // Estimate
        total_market_cap: globalData.total_market_cap?.usd || 0,
      };

      // Small delay
      await new Promise((r) => setTimeout(r, 500));

      // Fetch old coins
      const oldCoinsRes = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${OLD_COINS.join(",")}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
      );
      
      const oldCoins: Record<string, OldCoinData> = {};
      
      if (oldCoinsRes.ok) {
        const oldCoinsJson = await oldCoinsRes.json();
        for (const coin of oldCoinsJson) {
          const volMcapRatio =
            coin.market_cap > 0
              ? (coin.total_volume / coin.market_cap) * 100
              : 0;
          oldCoins[coin.id] = {
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
            change_24h: coin.price_change_percentage_24h || 0,
            vol_mcap_ratio: volMcapRatio,
          };
        }
      }

      // Calculate score
      const btcPrice = prices.bitcoin?.price || null;
      const [altseasonScore, signals] = calculateAltseasonScore(
        dominance,
        btcPrice
      );

      setData({
        prices,
        dominance,
        oldCoins,
        altseasonScore,
        signals,
        lastUpdate: new Date(),
      });
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch market data. Tap to retry.");
      setLoading(false);
    }
  }, [calculateAltseasonScore]);

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  // Days remaining calculation
  const daysRemaining = Math.ceil(
    (TARGET_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // Score styling helpers
  const getScoreColor = (score: number) => {
    if (score >= 70) return "#4ade80"; // green
    if (score >= 50) return "#facc15"; // yellow
    return "#f87171"; // red
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "rgba(74, 222, 128, 0.1)";
    if (score >= 50) return "rgba(250, 204, 21, 0.1)";
    return "rgba(248, 113, 113, 0.1)";
  };

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "white",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: "4px solid #3b82f6",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: 16,
          }}
        />
        <p style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: 14 }}>
          Loading market data...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: 16,
          color: "white",
        }}
      >
        <p style={{ color: "#f87171", marginBottom: 16, textAlign: "center" }}>
          {error}
        </p>
        <button
          onClick={fetchData}
          style={{
            padding: "12px 24px",
            background: "#3b82f6",
            border: "none",
            borderRadius: 8,
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const btcPrice = data?.prices.bitcoin?.price || 0;
  const btcChange = data?.prices.bitcoin?.change_24h || 0;
  const score = data?.altseasonScore || 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10, 10, 15, 0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              <span style={{ color: "#3b82f6" }}>BASE</span> SIGNAL
            </h1>
            <p
              style={{
                fontSize: 10,
                color: "#6b7280",
                fontFamily: "monospace",
                margin: 0,
              }}
            >
              {context?.user?.displayName
                ? `Hey ${context.user.displayName} • `
                : ""}
              Updated {data?.lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "#6b7280", margin: 0 }}>Target</p>
            <p
              style={{
                fontSize: 14,
                fontFamily: "monospace",
                color: "#facc15",
                margin: 0,
                fontWeight: 600,
              }}
            >
              {daysRemaining}d
            </p>
          </div>
        </div>
      </header>

      <main style={{ padding: 16, paddingBottom: 80 }}>
        {/* Altseason Score Card */}
        <div
          style={{
            borderRadius: 16,
            padding: 20,
            background: getScoreBg(score),
            border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Altseason Probability
            </span>
            <span
              style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}
            >
              LIVE
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: getScoreColor(score),
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: 24, color: "#6b7280" }}>%</span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 8,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${score}%`,
                background: getScoreColor(score),
                borderRadius: 4,
                transition: "width 0.5s ease",
              }}
            />
          </div>

          {/* Signals */}
          <div>
            {data?.signals.map((signal, i) => (
              <p
                key={i}
                style={{
                  fontSize: 12,
                  color: "#d1d5db",
                  fontFamily: "monospace",
                  margin: "4px 0",
                }}
              >
                {signal}
              </p>
            ))}
          </div>
        </div>

        {/* BTC Price Card */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background:
              "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(249,115,22,0.05) 100%)",
            border: "1px solid rgba(249,115,22,0.2)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Bitcoin</span>
            <span
              style={{
                fontSize: 12,
                fontFamily: "monospace",
                color: btcChange >= 0 ? "#4ade80" : "#f87171",
              }}
            >
              {btcChange >= 0 ? "+" : ""}
              {btcChange.toFixed(2)}%
            </span>
          </div>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Critical Levels */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 11,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            BTC Critical Levels
          </h2>

          {[
            {
              label: "Bull Confirmation",
              price: BTC_LEVELS.bull_confirmation,
              check: btcPrice >= BTC_LEVELS.bull_confirmation,
            },
            {
              label: "Critical High",
              price: BTC_LEVELS.critical_high,
              check: btcPrice >= BTC_LEVELS.critical_high,
            },
            {
              label: "Critical Low",
              price: BTC_LEVELS.critical_low,
              check: btcPrice >= BTC_LEVELS.critical_low,
            },
            {
              label: "Breakdown",
              price: BTC_LEVELS.breakdown,
              check: btcPrice >= BTC_LEVELS.breakdown,
            },
          ].map((level) => (
            <div
              key={level.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>
                  {level.check ? "✅" : "❌"}
                </span>
                <span style={{ fontSize: 14, color: "#d1d5db" }}>
                  {level.label}
                </span>
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontFamily: "monospace",
                  color: "#9ca3af",
                }}
              >
                ${level.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Dominance Grid */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 11,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Dominance Metrics
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 4px 0" }}>
                BTC Dom
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {data?.dominance.btc_dominance.toFixed(1)}%
              </p>
              <p
                style={{
                  fontSize: 10,
                  margin: "4px 0 0 0",
                  color:
                    (data?.dominance.btc_dominance || 100) < 61
                      ? "#4ade80"
                      : "#f87171",
                }}
              >
                {(data?.dominance.btc_dominance || 100) < 61
                  ? "🟢 Falling"
                  : "🔴 High"}
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 4px 0" }}>
                Others Dom
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {data?.dominance.others_dominance.toFixed(1)}%
              </p>
              <p
                style={{
                  fontSize: 10,
                  margin: "4px 0 0 0",
                  color:
                    (data?.dominance.others_dominance || 0) > 30
                      ? "#4ade80"
                      : "#facc15",
                }}
              >
                {(data?.dominance.others_dominance || 0) > 30
                  ? "🟢 Rising"
                  : "⏳ Building"}
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 4px 0" }}>
                ETH Dom
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {data?.dominance.eth_dominance.toFixed(1)}%
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <p style={{ fontSize: 10, color: "#6b7280", margin: "0 0 4px 0" }}>
                Total MCap
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ${((data?.dominance.total_market_cap || 0) / 1e12).toFixed(2)}T
              </p>
            </div>
          </div>
        </div>

        {/* Old Coin Revival Watch */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 11,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            Old Coin Revival Watch 👀
          </h2>

          {Object.entries(data?.oldCoins || {})
            .sort((a, b) => b[1].change_24h - a[1].change_24h)
            .slice(0, 5)
            .map(([id, coin]) => {
              const isHot = coin.change_24h > 15 && coin.vol_mcap_ratio > 15;
              return (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    marginBottom: 8,
                    borderRadius: 8,
                    background: isHot
                      ? "rgba(249,115,22,0.1)"
                      : "rgba(255,255,255,0.03)",
                    border: isHot
                      ? "1px solid rgba(249,115,22,0.3)"
                      : "1px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isHot && <span>🔥</span>}
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {coin.symbol}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        fontFamily: "monospace",
                      }}
                    >
                      ${coin.price.toFixed(2)}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: coin.change_24h >= 0 ? "#4ade80" : "#f87171",
                        minWidth: 60,
                        textAlign: "right",
                      }}
                    >
                      {coin.change_24h >= 0 ? "+" : ""}
                      {coin.change_24h.toFixed(1)}%
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "#6b7280",
                        minWidth: 45,
                        textAlign: "right",
                      }}
                    >
                      {coin.vol_mcap_ratio.toFixed(0)}% V/M
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingTop: 16 }}>
          <p style={{ fontSize: 10, color: "#4b5563" }}>
            Built by QuantumShieldLabs • Not financial advice
          </p>
        </div>
      </main>
    </div>
  );
}
