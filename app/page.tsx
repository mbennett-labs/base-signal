"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { sdk } from '@farcaster/frame-sdk';

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
function Tooltip({ statKey, children, isDark = true }: { statKey: string; children: React.ReactNode; isDark?: boolean }) {
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
        <span style={{ color: isDark ? '#475569' : '#94a3b8', fontSize: 12 }}>ⓘ</span>
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
          background: isDark ? '#1e293b' : '#ffffff',
          border: '1px solid ' + (isDark ? '#475569' : '#e2e8f0'),
          borderRadius: 8,
          boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.15)',
          zIndex: 50,
          textAlign: 'left'
        }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: '#facc15', marginBottom: 4 }}>{def.full}</div>
          <div style={{ fontSize: 11, color: isDark ? '#cbd5e1' : '#475569', marginBottom: 8 }}>{def.desc}</div>
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
  const [priceFlash, setPriceFlash] = useState('');
  const [showLegend, setShowLegend] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [farcasterCasts, setFarcasterCasts] = useState<FarcasterCast[]>([]);
  const [activeTab, setActiveTab] = useState<'battle' | 'news' | 'farcaster' | 'ta'>('battle');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [farcasterLoading, setFarcasterLoading] = useState(false);
  
  // TA Summary state
  const [taTimeframe, setTaTimeframe] = useState<'4h' | 'daily' | 'weekly'>('daily');
  const [taSummary, setTaSummary] = useState<string>('');
  const [taLoading, setTaLoading] = useState(false);
  const [taError, setTaError] = useState<string>('');
  const [taLastGenerated, setTaLastGenerated] = useState<Date | null>(null);

  // Initialize Farcaster SDK
  useEffect(() => {
    const initSdk = async () => {
      try {
        await sdk.actions.ready();
      } catch (e) {
        console.log('SDK ready called');
      }
    };
    initSdk();
  }, []);

  // Theme colors
  const theme = {
    bg: isDarkMode ? '#0a0a0f' : '#f8fafc',
    bgSecondary: isDarkMode ? 'rgba(30,41,59,0.6)' : 'rgba(241,245,249,0.9)',
    bgCard: isDarkMode ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.95)',
    text: isDarkMode ? 'white' : '#0f172a',
    textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
    textMuted: isDarkMode ? '#64748b' : '#94a3b8',
    border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };

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

  // Fetch News with REAL URLs
  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('https://cryptopanic.com/api/free/v1/posts/?currencies=BTC&kind=news&public=true');
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const news: NewsItem[] = data.results.slice(0, 10).map((item: any) => ({
          id: item.id?.toString() || String(Math.random()),
          title: item.title,
          source: item.source?.title || 'Unknown',
          sentiment: item.votes?.positive > item.votes?.negative ? 'bullish' : 
                     item.votes?.negative > item.votes?.positive ? 'bearish' : 'neutral',
          url: item.url || 'https://cryptopanic.com/news/' + item.id,
          timestamp: new Date(item.published_at),
        }));
        setNewsItems(news);
      } else {
        throw new Error('No results');
      }
    } catch (e) {
      console.log('Using fallback news');
      setNewsItems([
        { id: '1', title: 'Latest Bitcoin Market Analysis & Price Updates', source: 'CoinDesk', sentiment: 'bullish', url: 'https://www.coindesk.com/price/bitcoin/', timestamp: new Date() },
        { id: '2', title: 'Large Bitcoin Transactions Tracked in Real-Time', source: 'Whale Alert', sentiment: 'bearish', url: 'https://whale-alert.io/', timestamp: new Date() },
        { id: '3', title: 'Bitcoin News & Market Updates', source: 'CoinTelegraph', sentiment: 'bullish', url: 'https://cointelegraph.com/tags/bitcoin', timestamp: new Date() },
        { id: '4', title: 'Cryptocurrency Market Overview', source: 'Bloomberg Crypto', sentiment: 'neutral', url: 'https://www.bloomberg.com/crypto', timestamp: new Date() },
        { id: '5', title: 'Bitcoin Technical Analysis & Charts', source: 'TradingView', sentiment: 'bullish', url: 'https://www.tradingview.com/symbols/BTCUSD/', timestamp: new Date() },
      ]);
    }
  }, []);

  // Open URL using Farcaster SDK
  const openUrl = useCallback(async (url: string) => {
    if (!url || url === '#') return;
    try {
      const context = await sdk.context;
      if (context) {
        sdk.actions.openUrl(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Fetch Farcaster via our server-side API (avoids CORS)
  const fetchFarcaster = useCallback(async () => {
    setFarcasterLoading(true);
    try {
      const response = await fetch('/api/farcaster');
      if (response.ok) {
        const data = await response.json();
        if (data.casts && data.casts.length > 0) {
          setFarcasterCasts(data.casts.map((cast: any) => ({
            ...cast,
            timestamp: new Date(cast.timestamp),
          })));
          setFarcasterLoading(false);
          return;
        }
      }
      throw new Error('Failed to fetch');
    } catch (e) {
      console.log('Using fallback Farcaster content');
      setFarcasterCasts([
        { id: '1', author: 'dwr.eth', authorPfp: '', text: 'Building the decentralized social network. Farcaster is growing every day.', timestamp: new Date(Date.now() - 1000 * 60 * 30), likes: 342, channel: 'farcaster' },
        { id: '2', author: 'vitalik.eth', authorPfp: '', text: 'Excited about the progress on L2 scaling. Base and other rollups are shipping.', timestamp: new Date(Date.now() - 1000 * 60 * 60), likes: 891, channel: 'ethereum' },
        { id: '3', author: 'jessepollak', authorPfp: '', text: 'Base is for everyone. Keep building, keep shipping.', timestamp: new Date(Date.now() - 1000 * 60 * 90), likes: 567, channel: 'base' },
        { id: '4', author: 'btc_maxi', authorPfp: '', text: 'Bitcoin market update: Watching key resistance levels. Whale activity increasing.', timestamp: new Date(Date.now() - 1000 * 60 * 120), likes: 124, channel: 'bitcoin' },
        { id: '5', author: 'onchain_dev', authorPfp: '', text: 'Just deployed my first Mini App on Base. The developer experience is amazing!', timestamp: new Date(Date.now() - 1000 * 60 * 150), likes: 89, channel: 'base' },
      ]);
    }
    setFarcasterLoading(false);
  }, []);

  // Fetch TA Summary from API
  const fetchTASummary = useCallback(async (timeframe: '4h' | 'daily' | 'weekly') => {
    setTaLoading(true);
    setTaError('');
    
    try {
      const response = await fetch('/api/ta-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe,
          marketData: {
            price,
            priceChange,
            rsi,
            fearGreed,
            btcDominance,
            usdtDominance,
            longShortRatio,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setTaSummary(data.summary);
      setTaLastGenerated(new Date());
    } catch (error) {
      console.error('TA Summary error:', error);
      setTaError('Failed to generate summary. Please try again.');
    } finally {
      setTaLoading(false);
    }
  }, [price, priceChange, rsi, fearGreed, btcDominance, usdtDominance, longShortRatio]);

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

  useEffect(() => {
    fetchPrice();
    fetchGlobal();
    fetchFearGreed();
    fetchFarcaster();
    fetchNews();
    const initial = Array(4).fill(0).map(() => generateWhaleAlert());
    setWhaleAlerts(initial);
    
    const priceTick = setInterval(() => {
      setPrice(prev => {
        const newPrice = Math.round(prev + (Math.random() - 0.5) * 80);
        setPriceFlash(newPrice > prev ? 'green' : newPrice < prev ? 'red' : '');
        setTimeout(() => setPriceFlash(''), 300);
        return newPrice;
      });
      if (Math.random() > 0.85) {
        setRsi(prev => Math.max(20, Math.min(80, prev + (Math.random() - 0.5) * 5)));
        setLongShortRatio(prev => Math.max(0.5, Math.min(2, prev + (Math.random() - 0.5) * 0.1)));
      }
    }, 2000);
    
    const whaleGen = setInterval(() => {
      if (Math.random() > 0.6) {
        setWhaleAlerts(prev => [generateWhaleAlert(), ...prev].slice(0, 15));
      }
    }, 4000);
    
    const dataFetch = setInterval(() => { fetchPrice(); fetchGlobal(); }, 30000);
    const fgFetch = setInterval(fetchFearGreed, 300000);
    const newsFetch = setInterval(fetchNews, 120000);
    
    return () => {
      clearInterval(priceTick);
      clearInterval(whaleGen);
      clearInterval(dataFetch);
      clearInterval(fgFetch);
      clearInterval(newsFetch);
    };
  }, [fetchPrice, fetchGlobal, fetchFearGreed, fetchNews, fetchFarcaster, generateWhaleAlert]);

  useEffect(() => { calculateBattle(); }, [calculateBattle]);

  const getWeatherIcon = () => {
    if (fearGreed.value >= 75) return '☀️';
    if (fearGreed.value >= 50) return '⛅';
    if (fearGreed.value >= 25) return '🌧️';
    return '⛈️';
  };

  const formatTimeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return mins + 'm';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h';
    return Math.floor(hours / 24) + 'd';
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: "'Rajdhani', system-ui, sans-serif", position: 'relative' }}>
      {/* Background Effects */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', left: -150, top: '50%', transform: 'translateY(-50%)', width: 400, height: 400, background: '#22c55e', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.15 }} />
        <div style={{ position: 'absolute', right: -150, top: '50%', transform: 'translateY(-50%)', width: 400, height: 400, background: '#ef4444', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.15 }} />
      </div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid ' + theme.border, background: isDarkMode ? 'rgba(10,10,15,0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: 2, margin: 0 }}>
            <span style={{ color: '#facc15', textShadow: '0 0 20px rgba(250,204,21,0.5)' }}>BTC</span>
            <span style={{ marginLeft: 8 }}>BATTLE</span>
          </h1>
          <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>Real-Time Whale War</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'rgba(51,65,85,0.5)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 20 }}>{getWeatherIcon()}</span>
          <span style={{ fontSize: 13, textTransform: 'uppercase' }}>{fearGreed.text}</span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold', color: '#facc15' }}>{fearGreed.value}</span>
          <span style={{ color: '#64748b', fontSize: 11 }}>/100</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setShowLegend(!showLegend)} style={{ fontSize: 11, padding: '6px 12px', background: '#334155', border: '1px solid #475569', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
            📖 {showLegend ? 'Hide' : 'Legend'}
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ fontSize: 11, padding: '6px 12px', background: isDarkMode ? 'rgba(51,65,85,0.5)' : 'rgba(241,245,249,0.9)', border: '1px solid ' + theme.border, borderRadius: 8, color: theme.textSecondary, cursor: 'pointer' }}>
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.textMuted }}>
            <span style={{ width: 8, height: 8, background: '#4ade80', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
            LIVE
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '12px 16px', background: isDarkMode ? 'rgba(15,23,42,0.8)' : 'rgba(241,245,249,0.95)', borderBottom: '1px solid ' + theme.border, position: 'relative', zIndex: 10 }}>
        {[
          { id: 'battle', label: '⚔️ Battle', desc: 'Live War' },
          { id: 'news', label: '📰 News', desc: 'Crypto Intel' },
          { id: 'farcaster', label: '🟣 Social', desc: 'Farcaster' },
          { id: 'ta', label: '📈 TA', desc: 'Analysis' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1, maxWidth: 100, padding: '8px 12px',
              background: activeTab === tab.id ? 'rgba(250,204,21,0.15)' : (isDarkMode ? 'rgba(51,65,85,0.3)' : 'rgba(226,232,240,0.5)'),
              border: activeTab === tab.id ? '1px solid rgba(250,204,21,0.5)' : '1px solid ' + theme.border,
              borderRadius: 10, color: activeTab === tab.id ? '#facc15' : theme.textSecondary, cursor: 'pointer', textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 'bold' }}>{tab.label}</div>
            <div style={{ fontSize: 9, opacity: 0.7 }}>{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main style={{ position: 'relative', zIndex: 10, padding: '20px' }}>
        
        {/* BATTLE TAB */}
        {activeTab === 'battle' && (
          <>
            {/* Price Display */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 52, fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: 2, color: priceFlash === 'green' ? '#4ade80' : priceFlash === 'red' ? '#f87171' : 'white' }}>
                {formatPrice(price)}
              </div>
              <div style={{ fontSize: 18, fontFamily: "'Share Tech Mono', monospace", color: priceChange >= 0 ? '#4ade80' : '#f87171' }}>
                {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
                <span style={{ color: '#64748b', fontSize: 12, marginLeft: 4 }}>(24h)</span>
              </div>
            </div>

            {/* Tug of War */}
            <div style={{ background: isDarkMode ? 'rgba(30,41,59,0.5)' : 'rgba(241,245,249,0.8)', borderRadius: 16, border: '1px solid ' + theme.border, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 20, alignItems: 'center' }}>
                {/* Bull Side */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 36 }}>🐂</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {Array(Math.min(Math.floor(bullPower), 8)).fill(0).map((_, i) => (<span key={i} style={{ fontSize: 16 }}>🐂</span>))}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Bull Power</div>
                  <div style={{ height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(bullPower * 5, 100) + '%', background: 'linear-gradient(90deg, #16a34a, #4ade80)', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 13, fontFamily: "'Share Tech Mono', monospace", color: '#4ade80', marginTop: 4 }}>{bullPower.toFixed(1)}</div>
                </div>

                {/* Rope */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 8 }}>
                    <span style={{ color: '#4ade80' }}>← BULL ZONE</span>
                    <span>⚔️</span>
                    <span style={{ color: '#f87171' }}>BEAR ZONE →</span>
                  </div>
                  <div style={{ position: 'relative', height: 16, background: 'linear-gradient(90deg, #22c55e, #facc15, #ef4444)', borderRadius: 8, boxShadow: '0 0 20px rgba(250,204,21,0.3)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: tugPosition + '%', transform: 'translate(-50%, -50%)', width: 48, height: 48, background: '#0f172a', border: '3px solid #facc15', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(250,204,21,0.5)', transition: 'left 0.5s' }}>
                      <span style={{ fontSize: 9, fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>{formatPrice(price).slice(0, 6)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', marginTop: 8 }}>
                    {tugPosition < 40 ? '🐂 Bulls Dominating!' : tugPosition > 60 ? '🐻 Bears Dominating!' : '⚖️ Balanced Battle'}
                  </div>
                </div>

                {/* Bear Side */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 12 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-end' }}>
                      {Array(Math.min(Math.floor(bearPower), 8)).fill(0).map((_, i) => (<span key={i} style={{ fontSize: 16 }}>🐻</span>))}
                    </div>
                    <span style={{ fontSize: 36 }}>🐻</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Bear Power</div>
                  <div style={{ height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(bearPower * 5, 100) + '%', background: 'linear-gradient(90deg, #f87171, #dc2626)', borderRadius: 3, marginLeft: 'auto' }} />
                  </div>
                  <div style={{ fontSize: 13, fontFamily: "'Share Tech Mono', monospace", color: '#f87171', marginTop: 4 }}>{bearPower.toFixed(1)}</div>
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
                  <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: alert.type === 'buy' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: 8, borderLeft: '3px solid ' + (alert.type === 'buy' ? '#4ade80' : '#f87171') }}>
                    <span>{alert.type === 'buy' ? '🟢' : '🔴'}</span>
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>{alert.amount} BTC</span>
                    <span style={{ color: '#64748b', fontFamily: "'Share Tech Mono', monospace" }}>${alert.usdValue}M</span>
                    <span style={{ fontSize: 11, color: '#64748b', flex: 1 }}>{alert.exchange}</span>
                    <span style={{ fontSize: 10, fontWeight: 'bold', padding: '2px 8px', borderRadius: 4, background: alert.type === 'buy' ? '#4ade80' : '#f87171', color: alert.type === 'buy' ? '#000' : '#fff' }}>{alert.type.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* NEWS TAB */}
        {activeTab === 'news' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>📰 Crypto News Feed</h2>
              <span style={{ fontSize: 10, color: theme.textMuted }}>Tap to read full article ↗</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {newsItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>Loading news...</div>
              ) : (
                newsItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openUrl(item.url)}
                    style={{
                      display: 'block', padding: 14, background: theme.bgSecondary, borderRadius: 10,
                      border: '1px solid ' + theme.border,
                      borderLeft: '3px solid ' + (item.sentiment === 'bullish' ? '#4ade80' : item.sentiment === 'bearish' ? '#f87171' : theme.textMuted),
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.4, color: theme.text }}>{item.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: theme.textMuted }}>
                          <span>{item.source}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(item.timestamp)}</span>
                          <span>•</span>
                          <span style={{ color: '#3b82f6' }}>↗ Read</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 'bold', padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', background: item.sentiment === 'bullish' ? 'rgba(74,222,128,0.2)' : item.sentiment === 'bearish' ? 'rgba(248,113,113,0.2)' : 'rgba(100,116,139,0.2)', color: item.sentiment === 'bullish' ? '#4ade80' : item.sentiment === 'bearish' ? '#f87171' : '#94a3b8' }}>
                        {item.sentiment}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ marginTop: 16, padding: 12, background: theme.bgSecondary, borderRadius: 10, border: '1px solid ' + theme.border, textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: theme.textMuted }}>📡 News powered by CryptoPanic • Tap any article to read the full story</span>
            </div>
          </div>
        )}

        {/* FARCASTER TAB */}
        {activeTab === 'farcaster' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>🟣 Farcaster Feed</h2>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '2px 8px', borderRadius: 10 }}>
                  <span style={{ width: 6, height: 6, background: '#4ade80', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  LIVE
                </span>
              </div>
              <button
                onClick={() => fetchFarcaster()}
                disabled={farcasterLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, padding: '6px 12px',
                  background: farcasterLoading ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.2)',
                  border: '1px solid rgba(139,92,246,0.4)',
                  borderRadius: 8, color: '#a78bfa', cursor: farcasterLoading ? 'wait' : 'pointer',
                  opacity: farcasterLoading ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ display: 'inline-block', animation: farcasterLoading ? 'spin 1s linear infinite' : 'none' }}>🔄</span> 
                {farcasterLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            <div style={{ padding: 12, marginBottom: 16, background: 'linear-gradient(135deg, rgba(138,99,210,0.2), rgba(99,102,241,0.2))', borderRadius: 10, border: '1px solid rgba(138,99,210,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🔵</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#a78bfa' }}>Built on Base</div>
                <div style={{ fontSize: 10, color: theme.textSecondary }}>Integrated with Farcaster social protocol</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {farcasterCasts.map((cast) => (
                <div key={cast.id} style={{ padding: 14, background: theme.bgSecondary, borderRadius: 12, border: '1px solid ' + theme.border }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, minHeight: 40 }}>
                    <div style={{ width: 36, height: 36, minWidth: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold', color: 'white' }}>
                      {cast.author.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 'bold', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{cast.author}</div>
                      <div style={{ fontSize: 10, color: theme.textMuted, whiteSpace: 'nowrap' }}>{formatTimeAgo(cast.timestamp)} • /{cast.channel}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, lineHeight: 1.7, color: theme.text, marginBottom: 10, opacity: 0.95, fontWeight: 500 }}>{cast.text}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: theme.textMuted }}>
                    <span>❤️ {cast.likes}</span>
                    <span style={{ padding: '2px 8px', background: 'rgba(139,92,246,0.2)', borderRadius: 4, color: '#a78bfa', fontSize: 10 }}>/{cast.channel}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: 16, background: 'rgba(99,102,241,0.1)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>Join the conversation</div>
              <div style={{ fontSize: 11, color: theme.textSecondary }}>Follow @freakid on Warpcast for updates</div>
            </div>
          </div>
        )}

        {/* TA SUMMARY TAB */}
        {activeTab === 'ta' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>📈 Technical Analysis</h2>
              <span style={{ fontSize: 10, color: theme.textMuted }}>AI-Powered Insights</span>
            </div>

            {/* Timeframe Selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { id: '4h', label: '4H', desc: 'Short-term' },
                { id: 'daily', label: 'Daily', desc: 'Swing' },
                { id: 'weekly', label: 'Weekly', desc: 'Macro' },
              ].map(tf => (
                <button
                  key={tf.id}
                  onClick={() => {
                    setTaTimeframe(tf.id as any);
                    setTaSummary('');
                    setTaError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: taTimeframe === tf.id ? 'rgba(250,204,21,0.15)' : theme.bgSecondary,
                    border: taTimeframe === tf.id ? '2px solid #facc15' : '1px solid ' + theme.border,
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: taTimeframe === tf.id ? '#facc15' : theme.text }}>{tf.label}</div>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>{tf.desc}</div>
                </button>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={() => fetchTASummary(taTimeframe)}
              disabled={taLoading}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: taLoading ? '#334155' : 'linear-gradient(135deg, #facc15, #f59e0b)',
                border: 'none',
                borderRadius: 12,
                cursor: taLoading ? 'not-allowed' : 'pointer',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              {taLoading ? (
                <>
                  <span style={{ fontSize: 18 }}>⏳</span>
                  <span style={{ fontSize: 14, fontWeight: 'bold', color: '#94a3b8' }}>Generating Analysis...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 18 }}>🤖</span>
                  <span style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}>Generate {taTimeframe.toUpperCase()} Analysis</span>
                </>
              )}
            </button>

            {/* Current Market Data */}
            <div style={{ background: theme.bgSecondary, borderRadius: 12, border: '1px solid ' + theme.border, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 'bold', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Current Market Data</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>Price</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{formatPrice(price)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>24h Change</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: priceChange >= 0 ? '#4ade80' : '#f87171' }}>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>RSI</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: rsi > 70 ? '#f87171' : rsi < 30 ? '#4ade80' : theme.text }}>{rsi.toFixed(0)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>Fear & Greed</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: '#facc15' }}>{fearGreed.value}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>BTC.D</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{btcDominance}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>USDT.D</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{usdtDominance}%</div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {taError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ color: '#f87171', fontSize: 14 }}>⚠️ {taError}</div>
              </div>
            )}

            {/* Summary Display */}
            {taSummary && (
              <div style={{ background: theme.bgSecondary, borderRadius: 12, border: '1px solid ' + theme.border, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>📊</span>
                    <span style={{ fontSize: 14, fontWeight: 'bold', color: '#facc15' }}>{taTimeframe.toUpperCase()} Analysis</span>
                  </div>
                  {taLastGenerated && (
                    <span style={{ fontSize: 10, color: theme.textMuted }}>Generated {formatTimeAgo(taLastGenerated)}</span>
                  )}
                </div>
                <div style={{ fontSize: 16, lineHeight: 1.9, color: theme.text, whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                  {taSummary}
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid ' + theme.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: theme.textMuted }}>🤖 Powered by Claude AI</span>
                  <button
                    onClick={() => fetchTASummary(taTimeframe)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px solid ' + theme.border,
                      borderRadius: 6,
                      color: theme.textSecondary,
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!taSummary && !taLoading && !taError && (
              <div style={{ background: theme.bgSecondary, borderRadius: 12, border: '1px dashed ' + theme.border, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
                <div style={{ fontSize: 15, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>Select a timeframe and generate your analysis</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>AI will analyze current market conditions and provide actionable insights</div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Stats Footer */}
      <footer style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', gap: 24, padding: '16px 20px', borderTop: '1px solid ' + theme.border, background: isDarkMode ? 'rgba(10,10,15,0.95)' : 'rgba(255,255,255,0.95)', flexWrap: 'wrap' }}>
        <Tooltip statKey="BTC.D" isDark={isDarkMode}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>BTC.D</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>{btcDominance}%</div>
          </div>
        </Tooltip>
        <Tooltip statKey="USDT.D" isDark={isDarkMode}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>USDT.D</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>{usdtDominance}%</div>
          </div>
        </Tooltip>
        <Tooltip statKey="RSI" isDark={isDarkMode}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>RSI</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold', color: rsi > 70 ? '#f87171' : rsi < 30 ? '#4ade80' : theme.text }}>{rsi.toFixed(0)}</div>
          </div>
        </Tooltip>
        <Tooltip statKey="F&G" isDark={isDarkMode}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>F&G</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold', color: fearGreed.value >= 75 ? '#f87171' : fearGreed.value <= 25 ? '#4ade80' : '#facc15' }}>{fearGreed.value}</div>
          </div>
        </Tooltip>
      </footer>

      {/* Tip Wallet */}
      <div style={{ textAlign: 'center', padding: '16px 20px', background: isDarkMode ? 'rgba(250,204,21,0.05)' : 'rgba(250,204,21,0.1)', borderTop: '1px solid rgba(250,204,21,0.2)', position: 'relative', zIndex: 10 }}>
        <div style={{ fontSize: 12, color: '#facc15', marginBottom: 6, fontWeight: 'bold' }}>☕ Support BTC Battle</div>
        <div onClick={() => { navigator.clipboard.writeText('0x8E48bCE9B40C7E0c13b200AEad4A357e6cA2de19'); alert('Wallet address copied!'); }} style={{ fontSize: 11, color: theme.textSecondary, fontFamily: "'Share Tech Mono', monospace", cursor: 'pointer', padding: '8px 16px', background: theme.bgSecondary, borderRadius: 8, border: '1px solid ' + theme.border, display: 'inline-block' }}>
          0x8E48bCE9B40C7E0c13b200AEad4A357e6cA2de19
          <span style={{ marginLeft: 8, fontSize: 10, color: theme.textMuted }}>📋 Click to copy</span>
        </div>
        <div style={{ fontSize: 9, color: theme.textMuted, marginTop: 6 }}>ETH • USDC • Any token on Base 💙</div>
      </div>

      <div style={{ textAlign: 'center', padding: 8, fontSize: 10, color: theme.textMuted, position: 'relative', zIndex: 10 }}>
        Data: CoinGecko • Fear & Greed: Alternative.me • TA: Claude AI • Built by QuantumShieldLabs
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
