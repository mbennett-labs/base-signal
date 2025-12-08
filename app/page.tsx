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

type TabType = "signals" | "watchlist" | "about";

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("signals");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Check for first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("baseSignal_onboarded");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Check system color scheme preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDarkMode(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  const dismissOnboarding = () => {
    localStorage.setItem("baseSignal_onboarded", "true");
    setShowOnboarding(false);
  };

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
        signals.push(`⏳ ${daysRemaining} days to target`);
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

      const pricesRes = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,litecoin&order=market_cap_desc&sparkline=false&price_change_percentage=24h"
      );

      if (!pricesRes.ok) throw new Error("Failed to fetch prices");

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

      await new Promise((r) => setTimeout(r, 500));

      const globalRes = await fetch("https://api.coingecko.com/api/v3/global");
      if (!globalRes.ok) throw new Error("Failed to fetch global data");

      const globalJson = await globalRes.json();
      const globalData = globalJson.data;
      const btc_dom = globalData.market_cap_percentage?.btc || 0;
      const eth_dom = globalData.market_cap_percentage?.eth || 0;

      const dominance: DominanceData = {
        btc_dominance: btc_dom,
        eth_dominance: eth_dom,
        others_dominance: 100 - btc_dom - eth_dom,
        stablecoin_dominance: 5.0,
        total_market_cap: globalData.total_market_cap?.usd || 0,
      };

      await new Promise((r) => setTimeout(r, 500));

      const oldCoinsRes = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${OLD_COINS.join(",")}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
      );

      const oldCoins: Record<string, OldCoinData> = {};
      if (oldCoinsRes.ok) {
        const oldCoinsJson = await oldCoinsRes.json();
        for (const coin of oldCoinsJson) {
          const volMcapRatio =
            coin.market_cap > 0 ? (coin.total_volume / coin.market_cap) * 100 : 0;
          oldCoins[coin.id] = {
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
            change_24h: coin.price_change_percentage_24h || 0,
            vol_mcap_ratio: volMcapRatio,
          };
        }
      }

      const btcPrice = prices.bitcoin?.price || null;
      const [altseasonScore, signals] = calculateAltseasonScore(dominance, btcPrice);

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Theme colors
  const theme = {
    bg: isDarkMode ? "#0a0a0f" : "#f5f5f7",
    bgCard: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    bgCardHover: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    text: isDarkMode ? "#ffffff" : "#1a1a1a",
    textSecondary: isDarkMode ? "#9ca3af" : "#6b7280",
    textMuted: isDarkMode ? "#6b7280" : "#9ca3af",
    border: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    accent: "#3b82f6",
    green: "#4ade80",
    red: "#f87171",
    yellow: "#facc15",
  };

  const daysRemaining = Math.ceil(
    (TARGET_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const getScoreColor = (score: number) => {
    if (score >= 70) return theme.green;
    if (score >= 50) return theme.yellow;
    return theme.red;
  };

  // Onboarding Modal
  const OnboardingModal = () => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        style={{
          background: theme.bg,
          borderRadius: 20,
          padding: 24,
          maxWidth: 340,
          width: "100%",
          border: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 48 }}>📊</span>
        </div>
        <h2
          style={{
            color: theme.text,
            fontSize: 22,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Welcome to Base Signal
        </h2>
        <p
          style={{
            color: theme.textSecondary,
            fontSize: 14,
            lineHeight: 1.6,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Your real-time altseason radar. We track BTC dominance, market structure, 
          and historical patterns to calculate the probability of altseason conditions.
        </p>
        
        <div
          style={{
            background: theme.bgCard,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <p style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 8 }}>
            <strong style={{ color: theme.text }}>How the score works:</strong>
          </p>
          <ul style={{ color: theme.textSecondary, fontSize: 12, paddingLeft: 16, margin: 0 }}>
            <li style={{ marginBottom: 4 }}>BTC dominance falling below 61%</li>
            <li style={{ marginBottom: 4 }}>Altcoin (&quot;Others&quot;) dominance rising</li>
            <li style={{ marginBottom: 4 }}>Stablecoin capital rotating out</li>
            <li style={{ marginBottom: 4 }}>BTC holding key support levels</li>
          </ul>
        </div>

        <button
          onClick={dismissOnboarding}
          style={{
            width: "100%",
            padding: 16,
            background: theme.accent,
            border: "none",
            borderRadius: 12,
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            minHeight: 52,
          }}
        >
          Got it, let&apos;s go!
        </button>
      </div>
    </div>
  );

  // User Header Component
  const UserHeader = () => (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: isDarkMode ? "rgba(10, 10, 15, 0.95)" : "rgba(245, 245, 247, 0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${theme.border}`,
        padding: "12px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* User Avatar */}
          {context?.user?.pfpUrl ? (
            <img
              src={context.user.pfpUrl}
              alt="Profile"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `2px solid ${theme.accent}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: theme.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              👤
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: theme.text }}>
              <span style={{ color: theme.accent }}>BASE</span> SIGNAL
            </h1>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>
              {context?.user?.displayName || context?.user?.username || "Welcome"}
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, color: theme.textMuted, margin: 0 }}>Target</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: theme.yellow, margin: 0 }}>
            {daysRemaining}d
          </p>
        </div>
      </div>
    </header>
  );

  // Bottom Navigation
  const BottomNav = () => (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: isDarkMode ? "rgba(10, 10, 15, 0.98)" : "rgba(245, 245, 247, 0.98)",
        backdropFilter: "blur(8px)",
        borderTop: `1px solid ${theme.border}`,
        padding: "8px 16px 24px",
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        {[
          { id: "signals" as TabType, icon: "📊", label: "Signals" },
          { id: "watchlist" as TabType, icon: "👀", label: "Watchlist" },
          { id: "about" as TabType, icon: "ℹ️", label: "About" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "8px 16px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              minWidth: 64,
              minHeight: 48,
              borderRadius: 12,
              transition: "background 0.2s",
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? theme.accent : theme.textSecondary,
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );

  // Signals Tab Content
  const SignalsTab = () => {
    const score = data?.altseasonScore || 0;
    const btcPrice = data?.prices.bitcoin?.price || 0;
    const btcChange = data?.prices.bitcoin?.change_24h || 0;

    return (
      <div style={{ padding: 16, paddingBottom: 100 }}>
        {/* Altseason Score */}
        <div
          style={{
            borderRadius: 16,
            padding: 20,
            background: `linear-gradient(135deg, ${getScoreColor(score)}15 0%, ${getScoreColor(score)}05 100%)`,
            border: `1px solid ${theme.border}`,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>
              Altseason Probability
            </span>
            <span style={{ fontSize: 10, color: theme.textMuted }}>LIVE</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: getScoreColor(score) }}>{score}</span>
            <span style={{ fontSize: 24, color: theme.textMuted }}>%</span>
          </div>
          <div style={{ height: 8, background: theme.bgCard, borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${score}%`, background: getScoreColor(score), borderRadius: 4 }} />
          </div>
          {data?.signals.map((signal, i) => (
            <p key={i} style={{ fontSize: 12, color: theme.textSecondary, margin: "4px 0" }}>{signal}</p>
          ))}
        </div>

        {/* BTC Price */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background: "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(249,115,22,0.05) 100%)",
            border: "1px solid rgba(249,115,22,0.2)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: theme.textSecondary }}>Bitcoin</span>
            <span style={{ fontSize: 12, color: btcChange >= 0 ? theme.green : theme.red }}>
              {btcChange >= 0 ? "+" : ""}{btcChange.toFixed(2)}%
            </span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: theme.text }}>
            ${btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Critical Levels */}
        <div style={{ borderRadius: 16, padding: 16, background: theme.bgCard, border: `1px solid ${theme.border}`, marginBottom: 16 }}>
          <h2 style={{ fontSize: 11, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginTop: 0 }}>
            BTC Critical Levels
          </h2>
          {[
            { label: "Bull Confirmation", price: BTC_LEVELS.bull_confirmation, check: btcPrice >= BTC_LEVELS.bull_confirmation },
            { label: "Critical High", price: BTC_LEVELS.critical_high, check: btcPrice >= BTC_LEVELS.critical_high },
            { label: "Critical Low", price: BTC_LEVELS.critical_low, check: btcPrice >= BTC_LEVELS.critical_low },
            { label: "Breakdown", price: BTC_LEVELS.breakdown, check: btcPrice >= BTC_LEVELS.breakdown },
          ].map((level) => (
            <div key={level.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{level.check ? "✅" : "❌"}</span>
                <span style={{ fontSize: 14, color: theme.textSecondary }}>{level.label}</span>
              </div>
              <span style={{ fontSize: 14, color: theme.textMuted }}>${level.price.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Dominance Grid */}
        <div style={{ borderRadius: 16, padding: 16, background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          <h2 style={{ fontSize: 11, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, marginTop: 0 }}>
            Dominance Metrics
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "BTC Dom", value: `${data?.dominance.btc_dominance.toFixed(1)}%`, signal: (data?.dominance.btc_dominance || 100) < 61 ? "🟢 Falling" : "🔴 High", color: (data?.dominance.btc_dominance || 100) < 61 ? theme.green : theme.red },
              { label: "Others Dom", value: `${data?.dominance.others_dominance.toFixed(1)}%`, signal: (data?.dominance.others_dominance || 0) > 30 ? "🟢 Rising" : "⏳ Building", color: (data?.dominance.others_dominance || 0) > 30 ? theme.green : theme.yellow },
              { label: "ETH Dom", value: `${data?.dominance.eth_dominance.toFixed(1)}%`, signal: "", color: "" },
              { label: "Total MCap", value: `$${((data?.dominance.total_market_cap || 0) / 1e12).toFixed(2)}T`, signal: "", color: "" },
            ].map((item) => (
              <div key={item.label} style={{ background: theme.bgCardHover, borderRadius: 12, padding: 12 }}>
                <p style={{ fontSize: 10, color: theme.textMuted, margin: "0 0 4px 0" }}>{item.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: theme.text }}>{item.value}</p>
                {item.signal && <p style={{ fontSize: 10, margin: "4px 0 0 0", color: item.color }}>{item.signal}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Watchlist Tab Content
  const WatchlistTab = () => (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 4 }}>Old Coin Revival Watch</h2>
        <p style={{ fontSize: 12, color: theme.textSecondary, margin: 0 }}>
          Tracking historical coins for volume spikes and revival signals
        </p>
      </div>

      {Object.entries(data?.oldCoins || {})
        .sort((a, b) => b[1].change_24h - a[1].change_24h)
        .map(([id, coin]) => {
          const isHot = coin.change_24h > 15 && coin.vol_mcap_ratio > 15;
          return (
            <div
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                marginBottom: 8,
                borderRadius: 12,
                background: isHot ? "rgba(249,115,22,0.1)" : theme.bgCard,
                border: isHot ? "1px solid rgba(249,115,22,0.3)" : `1px solid ${theme.border}`,
                minHeight: 56,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {isHot && <span style={{ fontSize: 20 }}>🔥</span>}
                <div>
                  <span style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{coin.symbol}</span>
                  <p style={{ fontSize: 11, color: theme.textMuted, margin: 0 }}>
                    {coin.vol_mcap_ratio.toFixed(0)}% vol/mcap
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: theme.text, margin: 0 }}>
                  ${coin.price.toFixed(2)}
                </p>
                <p style={{ fontSize: 12, color: coin.change_24h >= 0 ? theme.green : theme.red, margin: 0 }}>
                  {coin.change_24h >= 0 ? "+" : ""}{coin.change_24h.toFixed(1)}%
                </p>
              </div>
            </div>
          );
        })}

      <div style={{ background: theme.bgCard, borderRadius: 12, padding: 16, marginTop: 16, border: `1px solid ${theme.border}` }}>
        <p style={{ fontSize: 12, color: theme.textSecondary, margin: 0 }}>
          💡 <strong>Tip:</strong> High volume/mcap ratio combined with price increase often signals renewed interest in older coins during altseason rotations.
        </p>
      </div>
    </div>
  );

  // About Tab Content
  const AboutTab = () => (
    <div style={{ padding: 16, paddingBottom: 100 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span style={{ fontSize: 56 }}>📊</span>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: theme.text, marginBottom: 4 }}>Base Signal</h2>
        <p style={{ fontSize: 14, color: theme.textSecondary }}>Your Altseason Radar</p>
      </div>

      <div style={{ background: theme.bgCard, borderRadius: 16, padding: 16, marginBottom: 16, border: `1px solid ${theme.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 8 }}>What is this?</h3>
        <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
          Base Signal tracks market structure indicators to calculate the probability of favorable altseason conditions. 
          Our algorithm monitors BTC dominance, altcoin flows, and key support levels in real-time.
        </p>
      </div>

      <div style={{ background: theme.bgCard, borderRadius: 16, padding: 16, marginBottom: 16, border: `1px solid ${theme.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 8 }}>How the Score Works</h3>
        <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.8 }}>
          <p style={{ margin: "0 0 8px 0" }}><strong>+25 pts</strong> — BTC dominance below 61%</p>
          <p style={{ margin: "0 0 8px 0" }}><strong>+25 pts</strong> — Others dominance above 30%</p>
          <p style={{ margin: "0 0 8px 0" }}><strong>+15 pts</strong> — Stablecoin dominance rejected</p>
          <p style={{ margin: "0 0 8px 0" }}><strong>+20 pts</strong> — BTC holding key support</p>
          <p style={{ margin: 0 }}><strong>+15 pts</strong> — Within target time window</p>
        </div>
      </div>

      <div style={{ background: theme.bgCard, borderRadius: 16, padding: 16, marginBottom: 16, border: `1px solid ${theme.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 8 }}>Old Coin Revival</h3>
        <p style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>
          During altseasons, capital often rotates into older, &quot;forgotten&quot; coins. We track volume spikes 
          and price movements in historical projects to spot potential revival signals.
        </p>
      </div>

      <div style={{ background: theme.bgCard, borderRadius: 16, padding: 16, border: `1px solid ${theme.border}` }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 8 }}>Built By</h3>
        <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>
          QuantumShieldLabs LLC
        </p>
        <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 8 }}>
          ⚠️ Not financial advice. Always do your own research.
        </p>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: 16,
          marginTop: 24,
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          color: theme.textSecondary,
          fontSize: 14,
          cursor: "pointer",
          minHeight: 52,
        }}
      >
        {isDarkMode ? "☀️ Switch to Light Mode" : "🌙 Switch to Dark Mode"}
      </button>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ width: 48, height: 48, border: `4px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 16 }} />
        <p style={{ color: theme.textSecondary, fontSize: 14 }}>Loading market data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 16 }}>
        <p style={{ color: theme.red, marginBottom: 16, textAlign: "center" }}>{error}</p>
        <button onClick={fetchData} style={{ padding: "16px 32px", background: theme.accent, border: "none", borderRadius: 12, color: "#fff", fontWeight: 600, cursor: "pointer", minHeight: 52 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
      {showOnboarding && <OnboardingModal />}
      <UserHeader />
      
      <main>
        {activeTab === "signals" && <SignalsTab />}
        {activeTab === "watchlist" && <WatchlistTab />}
        {activeTab === "about" && <AboutTab />}
      </main>

      <BottomNav />
    </div>
  );
}
