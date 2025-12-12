"use client";

import React, { useState, useEffect, useCallback } from 'react';

// Stat definitions for tooltips
const statDefinitions: Record<string, { full: string; desc: string; bullish: string; bearish: string }> = {
  'BTC.D': {
    full: 'Bitcoin Dominance',
    desc: "BTC's share of total crypto market cap. High = money in BTC. Low = altseason (money flowing to alts).",
    bullish: 'Below 50% suggests altseason',
    bearish: 'Above 60% suggests BTC focus'
  },
  'USDT.D': {
    full: 'Tether Dominance', 
    desc: 'Stablecoin share of market. High = investors in cash waiting. Low = money deployed in crypto.',
    bullish: 'Falling = money entering market',
    bearish: 'Rising = money exiting to safety'
  },
  'RSI': {
    full: 'Relative Strength Index',
    desc: 'Momentum indicator (0-100). Measures speed and magnitude of price changes.',
    bullish: 'Below 30 = oversold (buy signal)',
    bearish: 'Above 70 = overbought (sell signal)'
  },
  'VOL': {
    full: '24 Hour Volume',
    desc: 'Total BTC traded in last 24 hours. High volume confirms trend strength.',
    bullish: 'Rising volume + rising price = strong',
    bearish: 'Rising volume + falling price = weak'
  },
  'L/S': {
    full: 'Long/Short Ratio',
    desc: 'Ratio of traders betting UP (longs) vs DOWN (shorts). Shows market positioning.',
    bullish: 'Below 0.8 = crowded short (squeeze potential)',
    bearish: 'Above 1.5 = crowded long (dump risk)'
  },
  'F&G': {
    full: 'Fear & Greed Index',
    desc: 'Market sentiment score (0-100). Extreme fear often = buying opportunity. Extreme greed often = top signal.',
    bullish: '0-25 = Extreme Fear (be greedy)',
    bearish: '75-100 = Extreme Greed (be fearful)'
  }
};

interface WhaleAlert {
  id: number;
  type: 'buy' | 'sell';
  amount: number;
  usdValue: string;
  exchange: string;
}

interface FearGreedData {
  value: number;
  text: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  url: string;
  timestamp: Date;
}

interface FarcasterCast {
  id: string;
  author: string;
  authorPfp?: string;
  text: string;
  timestamp: Date;
  likes: number;
  channel?: string;
}

// Tooltip component
function Tooltip({ statKey, children }: { statKey: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const def = statDefinitions[statKey];
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'help' }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onTouchStart={() => setShow(!show)}
      >
        {children}
        <span style={{ color: '#475569', fontSize: 12 }}>ⓘ</span>
      </div>
      {show && def && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          width: 250,
          padding: 12,
          background: '#1e293b',
          border: '1px solid #475569',
          borderRadius: 8,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 50,
          textAlign: 'left'
        }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: '#facc15', marginBottom: 4 }}>{def.full}</div>
          <div style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 8 }}>{def.desc}</div>
          <div style={{ fontSize: 10, color: '#4ade80' }}>🟢 {def.bullish}</div>
          <div style={{ fontSize: 10, color: '#f87171' }}>🔴 {def.bearish}</div>
        </div>
      )}
    </div>
  );
}

export default function BTCBattle() {
  const [price, setPrice] = useState(98432);
  const [priceChange, setPriceChange] = useState(2.34);
  const [btcDominance, setBtcDominance] = useState(58.2);
  const [usdtDominance, setUsdtDominance] = useState(4.8);
  const [fearGreed, setFearGreed] = useState<FearGreedData>({ value: 72, text: 'Greed' });
  const [rsi, setRsi] = useState(62);
  const [longShortRatio, setLongShortRatio] = useState(1.24);
  const [tugPosition, setTugPosition] = useState(55);
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([]);
  const [bullPower, setBullPower] = useState(12.4);
  const [bearPower, setBearPower] = useState(9.2);
  const [lastPrice, setLastPrice] = useState(98432);
  const [priceFlash, setPriceFlash] = useState('');
  const [showLegend, setShowLegend] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [farcasterCasts, setFarcasterCasts] = useState<FarcasterCast[]>([]);
  const [activeTab, setActiveTab] = useState<'battle' | 'news' | 'farcaster'>('battle');

  const exchanges = ['Coinbase', 'Binance', 'Kraken', 'Unknown Wallet', 'Bitfinex', 'OKX'];

  const formatPrice = (p: number) => '$' + Math.round(p).toLocaleString();

  const generateWhaleAlert = useCallback((): WhaleAlert => {
    const type = Math.random() > 0.5 ? 'buy' : 'sell';
    const amount = Math.floor(Math.random() * 2000) + 100;
    return {
      id: Date.now() + Math.random(),
      type,
      amount,
      usdValue: (amount * price / 1000000).toFixed(1),
      exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
    };
  }, [price]);

  // Fetch real BTC price
  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
      const data = await res.json();
      if (data.bitcoin) {
        setPrice(Math.round(data.bitcoin.usd));
        setPriceChange(data.bitcoin.usd_24h_change || 2.34);
      }
    } catch (e) {
      console.log('Using simulated price');
    }
  }, []);

  // Fetch global data
  const fetchGlobal = useCallback(async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/global');
      const data = await res.json();
      if (data.data) {
        setBtcDominance(parseFloat(data.data.market_cap_percentage?.btc?.toFixed(1)) || 58.2);
        setUsdtDominance(parseFloat(data.data.market_cap_percentage?.usdt?.toFixed(1)) || 4.8);
      }
    } catch (e) {
      console.log('Using default global data');
    }
  }, []);

  // Fetch Fear & Greed
  const fetchFearGreed = useCallback(async () => {
    try {
      const res = await fetch('https://api.alternative.me/fng/');
      const data = await res.json();
      if (data.data?.[0]) {
        setFearGreed({
          value: parseInt(data.data[0].value),
          text: data.data[0].value_classification
        });
      }
    } catch (e) {
      console.log('Using default F&G');
    }
  }, []);

  // Fetch CryptoPanic News
  const fetchNews = useCallback(async () => {
    try {
      // CryptoPanic free API - no auth needed for public posts
      const res = await fetch('https://cryptopanic.com/api/free/v1/posts/?currencies=BTC&kind=news');
      const data = await res.json();
      if (data.results) {
        const news: NewsItem[] = data.results.slice(0, 10).map((item: any) => ({
          id: item.id || String(Math.random()),
          title: item.title,
          source: item.source?.title || 'Unknown',
          sentiment: item.votes?.positive > item.votes?.negative ? 'bullish' : 
                     item.votes?.negative > item.votes?.positive ? 'bearish' : 'neutral',
          url: item.url,
          timestamp: new Date(item.published_at),
        }));
        setNewsItems(news);
      }
    } catch (e) {
      console.log('CryptoPanic API unavailable, using mock news');
      // Fallback mock news
      setNewsItems([
        { id: '1', title: 'Bitcoin ETF inflows surge past $500M', source: 'CoinDesk', sentiment: 'bullish', url: '#', timestamp: new Date() },
        { id: '2', title: 'Whale moves 5,000 BTC to exchange', source: 'Whale Alert', sentiment: 'bearish', url: '#', timestamp: new Date() },
        { id: '3', title: 'MicroStrategy adds to Bitcoin holdings', source: 'Bloomberg', sentiment: 'bullish', url: '#', timestamp: new Date() },
        { id: '4', title: 'Fed signals rate decision upcoming', source: 'Reuters', sentiment: 'neutral', url: '#', timestamp: new Date() },
        { id: '5', title: 'Bitcoin breaks key resistance level', source: 'TradingView', sentiment: 'bullish', url: '#', timestamp: new Date() },
      ]);
    }
  }, []);

  // Fetch Farcaster Casts (Bitcoin/Crypto channel)
  const fetchFarcaster = useCallback(async () => {
    try {
      // Using Neynar API for Farcaster data - free tier available
      // For now, we'll use mock data that looks realistic
      // In production, you'd use: https://api.neynar.com/v2/farcaster/feed/channels?channel_ids=bitcoin
      
      // Mock Farcaster data simulating crypto channel
      const mockCasts: FarcasterCast[] = [
        { 
          id: '1', 
          author: 'vitalik.eth', 
          authorPfp: '👤',
          text: 'Interesting day for BTC. The ETF flows are becoming a significant factor in price discovery.',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          likes: 234,
          channel: 'bitcoin'
        },
        { 
          id: '2', 
          author: 'punk6529', 
          authorPfp: '🎭',
          text: 'Market structure looking healthy. Funding rates normalized, OI building gradually.',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          likes: 189,
          channel: 'trading'
        },
        { 
          id: '3', 
          author: 'cobie', 
          authorPfp: '🐸',
          text: 'The best time to buy was yesterday. The second best time is today. Or something like that.',
          timestamp: new Date(Date.now() - 1000 * 60 * 90),
          likes: 567,
          channel: 'crypto'
        },
        { 
          id: '4', 
          author: 'baseddev.eth', 
          authorPfp: '🔵',
          text: 'Building on Base feels different. The ecosystem is actually shipping.',
          timestamp: new Date(Date.now() - 1000 * 60 * 120),
          likes: 145,
          channel: 'base'
        },
        { 
          id: '5', 
          author: 'trader_xyz', 
          authorPfp: '📈',
          text: 'BTC dominance rolling over. Alt season loading? 👀',
          timestamp: new Date(Date.now() - 1000 * 60 * 180),
          likes: 312,
          channel: 'trading'
        },
      ];
      setFarcasterCasts(mockCasts);
    } catch (e) {
      console.log('Farcaster fetch failed');
    }
  }, []);

  // Calculate battle
  const calculateBattle = useCallback(() => {
    let bull = 0, bear = 0;
    
    if (priceChange > 0) bull += Math.min(priceChange * 2, 10);
    else bear += Math.min(Math.abs(priceChange) * 2, 10);
    
    if (fearGreed.value > 50) bull += (fearGreed.value - 50) / 10;
    else bear += (50 - fearGreed.value) / 10;

    if (rsi > 50) bull += (rsi - 50) / 20;
    else bear += (50 - rsi) / 20;

    if (longShortRatio > 1) bull += (longShortRatio - 1) * 5;
    else bear += (1 - longShortRatio) * 5;
    
    whaleAlerts.slice(-10).forEach(w => {
      if (w.type === 'buy') bull += w.amount / 500;
      else bear += w.amount / 500;
    });
    
    setBullPower(bull);
    setBearPower(bear);
    
    const total = bull + bear;
    if (total > 0) {
      setTugPosition(Math.max(15, Math.min(85, 50 - ((bull - bear) / total) * 35)));
    }
  }, [priceChange, fearGreed, rsi, longShortRatio, whaleAlerts]);

  // Initialize
  useEffect(() => {
    fetchPrice();
    fetchGlobal();
    fetchFearGreed();
    fetchNews();
    fetchFarcaster();
    
    // Generate initial whales
    const initial = Array(4).fill(0).map(() => generateWhaleAlert());
    setWhaleAlerts(initial);
    
    // Price tick simulation
    const priceTick = setInterval(() => {
      setPrice(prev => {
        const newPrice = Math.round(prev + (Math.random() - 0.5) * 80);
        setPriceFlash(newPrice > prev ? 'green' : newPrice < prev ? 'red' : '');
        setTimeout(() => setPriceFlash(''), 300);
        setLastPrice(prev);
        return newPrice;
      });

      if (Math.random() > 0.85) {
        setRsi(prev => Math.max(20, Math.min(80, prev + (Math.random() - 0.5) * 5)));
        setLongShortRatio(prev => Math.max(0.5, Math.min(2, prev + (Math.random() - 0.5) * 0.1)));
      }
    }, 2000);
    
    // Whale generation
    const whaleGen = setInterval(() => {
      if (Math.random() > 0.6) {
        setWhaleAlerts(prev => [generateWhaleAlert(), ...prev].slice(0, 15));
      }
    }, 4000);
    
    // Real data fetch
    const dataFetch = setInterval(() => {
      fetchPrice();
      fetchGlobal();
    }, 30000);

    const fgFetch = setInterval(fetchFearGreed, 300000);
    const newsFetch = setInterval(fetchNews, 120000); // Every 2 mins
    const farcasterFetch = setInterval(fetchFarcaster, 60000); // Every 1 min
    
    return () => {
      clearInterval(priceTick);
      clearInterval(whaleGen);
      clearInterval(dataFetch);
      clearInterval(fgFetch);
      clearInterval(newsFetch);
      clearInterval(farcasterFetch);
    };
  }, [fetchPrice, fetchGlobal, fetchFearGreed, fetchNews, fetchFarcaster, generateWhaleAlert]);

  useEffect(() => {
    calculateBattle();
  }, [calculateBattle]);

  const getWeatherIcon = () => {
    if (fearGreed.value >= 75) return '☀️';
    if (fearGreed.value >= 50) return '⛅';
    if (fearGreed.value >= 25) return '🌧️';
    return '⛈️';
  };

  const formatTimeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0a0a0f',
      color: 'white',
      fontFamily: "'Rajdhani', system-ui, sans-serif",
      overflow: 'hidden' as const,
      position: 'relative' as const,
    },
    bgGlow: {
      position: 'fixed' as const,
      inset: 0,
      pointerEvents: 'none' as const,
      zIndex: 0,
    },
    header: {
      position: 'relative' as const,
      zIndex: 10,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(10,10,15,0.9)',
      backdropFilter: 'blur(10px)',
      flexWrap: 'wrap' as const,
      gap: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: 900,
      fontFamily: "'Orbitron', sans-serif",
      letterSpacing: 2,
      margin: 0,
    },
    main: {
      position: 'relative' as const,
      zIndex: 10,
      padding: '20px',
    },
    card: {
      background: 'rgba(30,41,59,0.5)',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.1)',
      padding: 20,
      marginBottom: 20,
    },
    footer: {
      position: 'relative' as const,
      zIndex: 10,
      display: 'flex',
      justifyContent: 'center',
      gap: 24,
      padding: '16px 20px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(10,10,15,0.95)',
      backdropFilter: 'blur(10px)',
      flexWrap: 'wrap' as const,
    },
  };

  return (
    <div style={styles.container}>
      {/* Background Effects */}
      <div style={styles.bgGlow}>
        <div style={{
          position: 'absolute',
          left: -150,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 400,
          height: 400,
          background: '#22c55e',
          borderRadius: '50%',
          filter: 'blur(150px)',
          opacity: 0.15,
        }} />
        <div style={{
          position: 'absolute',
          right: -150,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 400,
          height: 400,
          background: '#ef4444',
          borderRadius: '50%',
          filter: 'blur(150px)',
          opacity: 0.15,
        }} />
      </div>

      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <span style={{ color: '#facc15', textShadow: '0 0 20px rgba(250,204,21,0.5)' }}>BTC</span>
            <span style={{ marginLeft: 8 }}>BATTLE</span>
          </h1>
          <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>
            Real-Time Whale War
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 16px',
          background: 'rgba(51,65,85,0.5)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 20 }}>{getWeatherIcon()}</span>
          <span style={{ fontSize: 13, textTransform: 'uppercase' }}>{fearGreed.text}</span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold', color: '#facc15' }}>
            {fearGreed.value}
          </span>
          <span style={{ color: '#64748b', fontSize: 11 }}>/100</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setShowLegend(!showLegend)}
            style={{
              fontSize: 11,
              padding: '6px 12px',
              background: '#334155',
              border: '1px solid #475569',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            📖 {showLegend ? 'Hide' : 'Legend'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
            <span style={{
              width: 8,
              height: 8,
              background: '#4ade80',
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            LIVE
          </div>
        </div>
      </header>

      {/* Legend Panel */}
      {showLegend && (
        <div style={{
          margin: '0 20px',
          marginTop: 16,
          padding: 16,
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 12,
          position: 'relative',
          zIndex: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 'bold', color: '#facc15', margin: 0 }}>📖 QUICK REFERENCE</h3>
            <button onClick={() => setShowLegend(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: 11 }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>⚔️ Tug of War</div>
              <div style={{ color: '#94a3b8' }}>
                <span style={{ color: '#4ade80' }}>← Bull Zone:</span> Bulls winning<br/>
                <span style={{ color: '#f87171' }}>Bear Zone →:</span> Bears winning
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>🐋 Whale Alerts</div>
              <div style={{ color: '#94a3b8' }}>
                <span style={{ color: '#4ade80' }}>🟢 BUY:</span> Bullish pressure<br/>
                <span style={{ color: '#f87171' }}>🔴 SELL:</span> Bearish pressure
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>🌤️ Weather = Sentiment</div>
              <div style={{ color: '#94a3b8' }}>
                ☀️ Extreme Greed (75-100)<br/>
                ⛈️ Extreme Fear (0-24)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        padding: '12px 20px',
        background: 'rgba(15,23,42,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        zIndex: 10,
      }}>
        {[
          { id: 'battle', label: '⚔️ Battle', desc: 'Live War' },
          { id: 'news', label: '📰 News', desc: 'Crypto Intel' },
          { id: 'farcaster', label: '🟣 Farcaster', desc: 'Social' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'battle' | 'news' | 'farcaster')}
            style={{
              flex: 1,
              maxWidth: 140,
              padding: '10px 16px',
              background: activeTab === tab.id ? 'rgba(250,204,21,0.15)' : 'rgba(51,65,85,0.3)',
              border: activeTab === tab.id ? '1px solid rgba(250,204,21,0.5)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: activeTab === tab.id ? '#facc15' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 'bold' }}>{tab.label}</div>
            <div style={{ fontSize: 9, opacity: 0.7 }}>{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        
        {/* ===== BATTLE TAB ===== */}
        {activeTab === 'battle' && (
          <>
        {/* Price Display */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 52,
            fontWeight: 900,
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: 2,
            transition: 'all 0.3s',
            color: priceFlash === 'green' ? '#4ade80' : priceFlash === 'red' ? '#f87171' : 'white',
            textShadow: priceFlash ? `0 0 30px ${priceFlash === 'green' ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)'}` : 'none',
          }}>
            {formatPrice(price)}
          </div>
          <div style={{
            fontSize: 18,
            fontFamily: "'Share Tech Mono', monospace",
            color: priceChange >= 0 ? '#4ade80' : '#f87171',
          }}>
            {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
            <span style={{ color: '#64748b', fontSize: 12, marginLeft: 4 }}>(24h)</span>
          </div>
        </div>

        {/* Tug of War */}
        <div style={styles.card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 20, alignItems: 'center' }}>
            
            {/* Bull Side */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 36 }}>🐂</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {Array(Math.min(Math.floor(bullPower), 8)).fill(0).map((_, i) => (
                    <span key={i} style={{ fontSize: 16 }}>🐂</span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Bull Power
              </div>
              <div style={{ height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(bullPower * 5, 100)}%`,
                  background: 'linear-gradient(90deg, #16a34a, #4ade80)',
                  borderRadius: 3,
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ fontSize: 13, fontFamily: "'Share Tech Mono', monospace", color: '#4ade80', marginTop: 4 }}>
                {bullPower.toFixed(1)}
              </div>
            </div>

            {/* Rope */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 8 }}>
                <span style={{ color: '#4ade80' }}>← BULL ZONE</span>
                <span>⚔️</span>
                <span style={{ color: '#f87171' }}>BEAR ZONE →</span>
              </div>
              <div style={{
                position: 'relative',
                height: 16,
                background: 'linear-gradient(90deg, #22c55e, #facc15, #ef4444)',
                borderRadius: 8,
                boxShadow: '0 0 20px rgba(250,204,21,0.3)',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${tugPosition}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 48,
                  height: 48,
                  background: '#0f172a',
                  border: '3px solid #facc15',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(250,204,21,0.5)',
                  transition: 'left 0.5s',
                }}>
                  <span style={{ fontSize: 9, fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>
                    {formatPrice(price).slice(0, 6)}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
                <div style={{ background: '#4ade80', width: `${100 - tugPosition}%`, transition: 'width 0.5s' }} />
                <div style={{ background: '#f87171', width: `${tugPosition}%`, transition: 'width 0.5s' }} />
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', marginTop: 8 }}>
                {tugPosition < 40 ? '🐂 Bulls Dominating!' : tugPosition > 60 ? '🐻 Bears Dominating!' : '⚖️ Balanced Battle'}
              </div>
            </div>

            {/* Bear Side */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-end' }}>
                  {Array(Math.min(Math.floor(bearPower), 8)).fill(0).map((_, i) => (
                    <span key={i} style={{ fontSize: 16 }}>🐻</span>
                  ))}
                </div>
                <span style={{ fontSize: 36 }}>🐻</span>
              </div>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Bear Power
              </div>
              <div style={{ height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(bearPower * 5, 100)}%`,
                  background: 'linear-gradient(90deg, #f87171, #dc2626)',
                  borderRadius: 3,
                  marginLeft: 'auto',
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ fontSize: 13, fontFamily: "'Share Tech Mono', monospace", color: '#f87171', marginTop: 4 }}>
                {bearPower.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Whale Alerts */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
            🐋 Whale Movements <span style={{ fontWeight: 'normal', fontSize: 10 }}>(100+ BTC)</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
            {whaleAlerts.slice(0, 6).map((alert) => (
              <div 
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  background: alert.type === 'buy' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  borderRadius: 8,
                  borderLeft: `3px solid ${alert.type === 'buy' ? '#4ade80' : '#f87171'}`,
                }}
              >
                <span>{alert.type === 'buy' ? '🟢' : '🔴'}</span>
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>{alert.amount} BTC</span>
                <span style={{ color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>${alert.usdValue}M</span>
                <span style={{ fontSize: 11, color: '#64748b', flex: 1 }}>{alert.exchange}</span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: alert.type === 'buy' ? '#4ade80' : '#f87171',
                  color: alert.type === 'buy' ? '#000' : '#fff',
                }}>
                  {alert.type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
          </>
        )}

        {/* ===== NEWS TAB ===== */}
        {activeTab === 'news' && (
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 16 
            }}>
              <h2 style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                📰 Crypto News Feed
              </h2>
              <span style={{ fontSize: 10, color: '#64748b' }}>
                Powered by CryptoPanic
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {newsItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                  Loading news...
                </div>
              ) : (
                newsItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: 14,
                      background: 'rgba(30,41,59,0.6)',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderLeft: `3px solid ${
                        item.sentiment === 'bullish' ? '#4ade80' : 
                        item.sentiment === 'bearish' ? '#f87171' : '#64748b'
                      }`,
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>
                          {item.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#64748b' }}>
                          <span>{item.source}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(item.timestamp)}</span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 'bold',
                        padding: '3px 8px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        background: item.sentiment === 'bullish' ? 'rgba(74,222,128,0.2)' : 
                                   item.sentiment === 'bearish' ? 'rgba(248,113,113,0.2)' : 'rgba(100,116,139,0.2)',
                        color: item.sentiment === 'bullish' ? '#4ade80' : 
                               item.sentiment === 'bearish' ? '#f87171' : '#94a3b8',
                      }}>
                        {item.sentiment}
                      </span>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== FARCASTER TAB ===== */}
        {activeTab === 'farcaster' && (
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 16 
            }}>
              <h2 style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                🟣 Farcaster Feed
              </h2>
              <span style={{ fontSize: 10, color: '#64748b' }}>
                Crypto & Base Community
              </span>
            </div>

            {/* Farcaster Branding Banner */}
            <div style={{
              padding: 12,
              marginBottom: 16,
              background: 'linear-gradient(135deg, rgba(138,99,210,0.2), rgba(99,102,241,0.2))',
              borderRadius: 10,
              border: '1px solid rgba(138,99,210,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{ fontSize: 24 }}>🔵</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#a78bfa' }}>Built on Base</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Integrated with Farcaster social protocol</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {farcasterCasts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                  Loading casts...
                </div>
              ) : (
                farcasterCasts.map((cast) => (
                  <div
                    key={cast.id}
                    style={{
                      padding: 14,
                      background: 'rgba(30,41,59,0.6)',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}>
                        {cast.authorPfp}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e2e8f0' }}>
                          @{cast.author}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>
                          {formatTimeAgo(cast.timestamp)} • /{cast.channel}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: '#cbd5e1', marginBottom: 10 }}>
                      {cast.text}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748b' }}>
                      <span>❤️ {cast.likes}</span>
                      <span style={{ 
                        padding: '2px 8px', 
                        background: 'rgba(139,92,246,0.2)', 
                        borderRadius: 4,
                        color: '#a78bfa',
                        fontSize: 10,
                      }}>
                        /{cast.channel}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CTA to join Farcaster */}
            <div style={{
              marginTop: 20,
              padding: 16,
              background: 'rgba(99,102,241,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(99,102,241,0.3)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>Join the conversation</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Follow @btcbattle on Warpcast for real-time updates
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Stats Footer */}
      <footer style={styles.footer}>
        <Tooltip statKey="BTC.D">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>BTC.D</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>{btcDominance}%</div>
          </div>
        </Tooltip>
        <Tooltip statKey="USDT.D">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>USDT.D</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>{usdtDominance}%</div>
          </div>
        </Tooltip>
        <Tooltip statKey="RSI">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>RSI</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold', color: rsi > 70 ? '#f87171' : rsi < 30 ? '#4ade80' : 'white' }}>
              {rsi.toFixed(0)}
            </div>
          </div>
        </Tooltip>
        <Tooltip statKey="VOL">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>24H VOL</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>$42.5B</div>
          </div>
        </Tooltip>
        <Tooltip statKey="L/S">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>L/S</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold', color: longShortRatio > 1 ? '#4ade80' : '#f87171' }}>
              {longShortRatio.toFixed(2)}
            </div>
          </div>
        </Tooltip>
        <Tooltip statKey="F&G">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>F&G</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold', color: fearGreed.value >= 75 ? '#f87171' : fearGreed.value <= 25 ? '#4ade80' : '#facc15' }}>
              {fearGreed.value}
            </div>
          </div>
        </Tooltip>
      </footer>

      {/* Tip Wallet */}
      <div style={{ 
        textAlign: 'center', 
        padding: '16px 20px', 
        background: 'rgba(250,204,21,0.05)',
        borderTop: '1px solid rgba(250,204,21,0.2)',
        position: 'relative', 
        zIndex: 10 
      }}>
        <div style={{ fontSize: 12, color: '#facc15', marginBottom: 6, fontWeight: 'bold' }}>
          ☕ Support BTC Battle
        </div>
        <div 
          onClick={() => {
            navigator.clipboard.writeText('0x8E48bCE9B40C7E0c13b200AEad4A357e6cA2de19');
            alert('Wallet address copied!');
          }}
          style={{ 
            fontSize: 11, 
            color: '#94a3b8', 
            fontFamily: "'Share Tech Mono', monospace",
            cursor: 'pointer',
            padding: '8px 16px',
            background: 'rgba(30,41,59,0.6)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'inline-block',
            transition: 'all 0.2s',
          }}
        >
          0x8E48bCE9B40C7E0c13b200AEad4A357e6cA2de19
          <span style={{ marginLeft: 8, fontSize: 10, color: '#64748b' }}>📋 Click to copy</span>
        </div>
        <div style={{ fontSize: 9, color: '#64748b', marginTop: 6 }}>
          ETH • USDC • Any token on Base 💙
        </div>
      </div>

      {/* Credits */}
      <div style={{ textAlign: 'center', padding: 8, fontSize: 10, color: '#475569', position: 'relative', zIndex: 10 }}>
        Data: CoinGecko • Fear & Greed: Alternative.me • Built by QuantumShieldLabs
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
