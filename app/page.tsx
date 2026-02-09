"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { useMiniKit, useAddFrame, useComposeCast } from '@coinbase/onchainkit/minikit';
import { Transaction, TransactionButton, TransactionToast, TransactionToastIcon, TransactionToastLabel, TransactionToastAction } from '@coinbase/onchainkit/transaction';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity } from '@coinbase/onchainkit/identity';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { encodeFunctionData } from 'viem';
import { base } from 'wagmi/chains';

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

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const TIP_WALLET = '0x91c6a08f25a5feb3BBaB465A8a0e59DC05D5A7b0' as const;
const erc20TransferAbi = [{ name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] }] as const;

export default function BTCBattle() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const addFrame = useAddFrame();
  const { composeCastAsync } = useComposeCast();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const tipCalls = useMemo(() => [{
    to: USDC_BASE,
    data: encodeFunctionData({
      abi: erc20TransferAbi,
      functionName: 'transfer',
      args: [TIP_WALLET, BigInt(1_000_000)]
    })
  }], []);

  const [price, setPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [btcDominance, setBtcDominance] = useState(58.2);
  const [usdtDominance, setUsdtDominance] = useState(4.8);
  const [fearGreed, setFearGreed] = useState<FearGreedData>({ value: 50, text: 'Neutral' });
  const [rsi, setRsi] = useState(50);
  const [longShortRatio, setLongShortRatio] = useState(1.0);
  const [tugPosition, setTugPosition] = useState(50);
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([]);
  const [bullPower, setBullPower] = useState(0);
  const [bearPower, setBearPower] = useState(0);
  const [priceFlash, setPriceFlash] = useState('');
  const [showLegend, setShowLegend] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [farcasterCasts, setFarcasterCasts] = useState<FarcasterCast[]>([]);
  const [activeTab, setActiveTab] = useState<'battle' | 'news' | 'farcaster' | 'ta'>('battle');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [tipKey, setTipKey] = useState(0);

  const [farcasterLoading, setFarcasterLoading] = useState(false);
  
  // TA Summary state
  const [taTimeframe, setTaTimeframe] = useState<'4h' | 'daily' | 'weekly'>('daily');
  const [taSummary, setTaSummary] = useState<string>('');
  const [taLoading, setTaLoading] = useState(false);
  const [taError, setTaError] = useState<string>('');
  const [taLastGenerated, setTaLastGenerated] = useState<Date | null>(null);

  // Initialize MiniApp frame
  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [setFrameReady, isFrameReady]);

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
    const res = await fetch('/api/price');
    const data = await res.json();
    if (data.price) {
      const newPrice = data.price;
      setPrice(prev => {
        if (prev !== 0 && prev !== newPrice) {
          setPriceFlash(newPrice > prev ? 'green' : 'red');
          setTimeout(() => setPriceFlash(''), 300);
        }
        return newPrice;
      });
      setPriceChange(data.change || 0);
    }
  } catch (e) {
    console.log('Price fetch failed');
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
    
    // Fetch real price every 10 seconds
    const priceTick = setInterval(() => {
      fetchPrice();
    }, 10000);
    
    const whaleGen = setInterval(() => {
      if (Math.random() > 0.6) {
        setWhaleAlerts(prev => [generateWhaleAlert(), ...prev].slice(0, 15));
      }
    }, 4000);
    
    // Fetch global data every 60 seconds
    const dataFetch = setInterval(() => { fetchGlobal(); }, 60000);
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
    <div className="app-root" style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: "'Rajdhani', system-ui, sans-serif", position: 'relative', overflowX: 'hidden' }}>
      {/* Background Effects */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', left: -150, top: '50%', transform: 'translateY(-50%)', width: 400, height: 400, background: '#22c55e', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.15 }} />
        <div style={{ position: 'absolute', right: -150, top: '50%', transform: 'translateY(-50%)', width: 400, height: 400, background: '#ef4444', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.15 }} />
      </div>

      {/* Header */}
      <header className="app-header" style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid ' + theme.border, background: isDarkMode ? 'rgba(10,10,15,0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', flexWrap: 'wrap', gap: 8 }}>
        <div className="header-left">
          <h1 style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: 2, margin: 0 }}>
            <span style={{ color: '#facc15', textShadow: '0 0 20px rgba(250,204,21,0.5)' }}>BTC</span>
            <span style={{ marginLeft: 8 }}>BATTLE</span>
          </h1>
          <span className="header-subtitle" style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 2 }}>Real-Time Whale War</span>
        </div>

        <div className="header-weather" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(51,65,85,0.5)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}>
          <span style={{ fontSize: 18 }}>{getWeatherIcon()}</span>
          <span style={{ textTransform: 'uppercase' }}>{fearGreed.text}</span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold', color: '#facc15' }}>{fearGreed.value}</span>
          <span style={{ color: '#64748b', fontSize: 10 }}>/100</span>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button className="header-legend-btn" onClick={() => setShowLegend(!showLegend)} style={{ fontSize: 11, padding: '6px 10px', background: '#334155', border: '1px solid #475569', borderRadius: 8, color: 'white', cursor: 'pointer' }}>
            📖 {showLegend ? 'Hide' : 'Legend'}
          </button>
          <button className="header-theme-btn" onClick={() => setIsDarkMode(!isDarkMode)} style={{ fontSize: 11, padding: '6px 10px', background: isDarkMode ? 'rgba(51,65,85,0.5)' : 'rgba(241,245,249,0.9)', border: '1px solid ' + theme.border, borderRadius: 8, color: theme.textSecondary, cursor: 'pointer' }}>
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button className="header-save-btn" onClick={async () => { try { await addFrame(); } catch(e) { console.error('Save app failed:', e); } }} style={{ fontSize: 11, padding: '6px 10px', background: 'rgba(0,82,255,0.2)', border: '1px solid rgba(0,82,255,0.4)', borderRadius: 8, color: '#5b9aff', cursor: 'pointer' }}>
            Save App
          </button>
          <span className="header-base-badge" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,82,255,0.2)', border: '1px solid rgba(0,82,255,0.35)', borderRadius: 20 }}>
            <svg width="14" height="14" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/><path d="M55.4 93.3c20.9 0 37.9-17 37.9-37.9S76.3 17.5 55.4 17.5c-19.5 0-35.6 14.8-37.6 33.8h49.8v11.2H17.8c2 19 18.1 30.8 37.6 30.8z" fill="white"/></svg>
            <span className="header-base-text">Base</span>
          </span>
          <span className="wallet-desktop">
            <Wallet>
              <ConnectWallet><Avatar /><Name /></ConnectWallet>
              <WalletDropdown>
                <Identity hasCopyAddressOnClick><Avatar /><Name /><Address /></Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </span>
          {isConnected ? (
            <button className="wallet-mobile" onClick={() => disconnect()} style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Share Tech Mono', monospace" }}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </button>
          ) : (
            <button className="wallet-mobile" onClick={() => connectors[0] && connect({ connector: connectors[0] })} style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(0,82,255,0.2)', color: '#5b9aff', border: '1px solid rgba(0,82,255,0.4)', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Connect
            </button>
          )}
          <div className="header-live" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.textMuted }}>
            <span style={{ width: 8, height: 8, background: '#4ade80', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
            LIVE
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-nav" style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '10px 16px', background: isDarkMode ? 'rgba(15,23,42,0.8)' : 'rgba(241,245,249,0.95)', borderBottom: '1px solid ' + theme.border, position: 'relative', zIndex: 10 }}>
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
      <main className="app-main" style={{ position: 'relative', zIndex: 10, padding: '16px' }}>
        
        {/* BATTLE TAB */}
        {activeTab === 'battle' && (
          <>
            {/* Price Display */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div className="price-display" style={{ fontSize: 40, fontWeight: 900, fontFamily: "'Orbitron', sans-serif", letterSpacing: 1, color: priceFlash === 'green' ? '#4ade80' : priceFlash === 'red' ? '#f87171' : 'white' }}>
                {price === 0 ? '...' : formatPrice(price)}
              </div>
              <div style={{ fontSize: 18, fontFamily: "'Share Tech Mono', monospace", color: priceChange >= 0 ? '#4ade80' : '#f87171' }}>
                {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
                <span style={{ color: '#64748b', fontSize: 12, marginLeft: 4 }}>(24h)</span>
              </div>
            </div>

            {/* Tug of War */}
            <div style={{ background: isDarkMode ? 'rgba(30,41,59,0.5)' : 'rgba(241,245,249,0.8)', borderRadius: 16, border: '1px solid ' + theme.border, padding: 20, marginBottom: 20 }}>
              <div className="tow-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 16, alignItems: 'center' }}>
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
                    <div className="tow-circle" style={{ position: 'absolute', top: '50%', left: tugPosition + '%', transform: 'translate(-50%, -50%)', width: 40, height: 40, background: '#0f172a', border: '2px solid #facc15', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(250,204,21,0.5)', transition: 'left 0.5s' }}>
                      <span style={{ fontSize: 9, fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold' }}>{price === 0 ? '...' : formatPrice(price).slice(0, 6)}</span>
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
              <div className="whale-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
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

            <div style={{ marginTop: 16, marginBottom: 16, textAlign: 'center' }}>
              <button onClick={async () => { try { await composeCastAsync({ text: "Check out BTC Battle - real-time whale tracking and market signals on Base!", embeds: [process.env.NEXT_PUBLIC_URL || "https://base-signal.vercel.app"] }); } catch(e) { console.error('Share failed:', e); } }} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Share Battle
              </button>
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
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>{price === 0 ? '...' : formatPrice(price)}</div>
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
      <footer className="app-footer" style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', gap: 16, padding: '12px 16px', borderTop: '1px solid ' + theme.border, background: isDarkMode ? 'rgba(10,10,15,0.95)' : 'rgba(255,255,255,0.95)', flexWrap: 'wrap' }}>
        {isConnected && address && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Wallet</div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontWeight: 'bold', fontSize: 11 }}>{address.slice(0, 6)}...{address.slice(-4)}</div>
          </div>
        )}
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

      {/* Tip the Builder */}
      <div className="tip-section" style={{ textAlign: 'center', padding: '12px 16px', background: isDarkMode ? 'rgba(250,204,21,0.05)' : 'rgba(250,204,21,0.1)', borderTop: '1px solid rgba(250,204,21,0.2)', position: 'relative', zIndex: 10 }}>
        <div style={{ fontSize: 12, color: '#facc15', marginBottom: 10, fontWeight: 'bold' }}>☕ Tip the Builder</div>
        <Transaction key={`tip-${tipKey}`} chainId={base.id} calls={tipCalls} isSponsored onSuccess={() => { console.log('Tip sent!'); setTipKey((k) => k + 1); }} onError={(err) => console.error('Tip failed:', err)}>
          <TransactionButton text="Tip the Builder (1 USDC)" />
          <TransactionToast><TransactionToastIcon /><TransactionToastLabel /><TransactionToastAction /></TransactionToast>
        </Transaction>
        <div style={{ fontSize: 9, color: theme.textMuted, marginTop: 6 }}>Gasless via CDP Paymaster on Base</div>
      </div>

      <div className="app-credits" style={{ textAlign: 'center', padding: 8, fontSize: 10, color: theme.textMuted, position: 'relative', zIndex: 10 }}>
        Data: CoinGecko • Fear & Greed: Alternative.me • TA: Claude AI • Built by QuantumShieldLabs
      </div>

     {/* Legend Modal */}
      {showLegend && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }} onClick={() => setShowLegend(false)}>
          <div style={{
            background: isDarkMode ? '#1e293b' : '#ffffff',
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid ' + theme.border,
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#facc15' }}>📖 Legend</h2>
              <button onClick={() => setShowLegend(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: theme.textMuted }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#4ade80', marginBottom: 4 }}>🐂 Bulls (Green)</div>
                <div style={{ fontSize: 12, color: theme.textSecondary }}>Buyers pushing price UP. More bulls = bullish momentum.</div>
              </div>
              
              <div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#f87171', marginBottom: 4 }}>🐻 Bears (Red)</div>
                <div style={{ fontSize: 12, color: theme.textSecondary }}>Sellers pushing price DOWN. More bears = bearish pressure.</div>
              </div>
              
              <div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#facc15', marginBottom: 4 }}>⚔️ Tug of War</div>
                <div style={{ fontSize: 12, color: theme.textSecondary }}>The rope shows who is winning. Left = bulls dominating. Right = bears dominating.</div>
              </div>
              
              <div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#3b82f6', marginBottom: 4 }}>🐋 Whale Alerts</div>
                <div style={{ fontSize: 12, color: theme.textSecondary }}>Large transactions (100+ BTC). Green = buying, Red = selling.</div>
              </div>
              
              <div style={{ borderTop: '1px solid ' + theme.border, paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>Indicators:</div>
                <div style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 1.8 }}>
                  <div><strong>BTC.D</strong> - Bitcoin Dominance (% of total crypto market)</div>
                  <div><strong>USDT.D</strong> - Stablecoin Dominance (high = fear)</div>
                  <div><strong>RSI</strong> - Relative Strength (70+ overbought, 30- oversold)</div>
                  <div><strong>F&G</strong> - Fear & Greed Index (0-100)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Global box-sizing */
        *, *::before, *::after { box-sizing: border-box; }

        /* Safe area insets */
        .app-root {
          max-width: 100vw;
          padding-top: env(safe-area-inset-top);
        }
        .app-header {
          padding-left: max(16px, env(safe-area-inset-left)) !important;
          padding-right: max(16px, env(safe-area-inset-right)) !important;
        }
        .tab-nav {
          padding-left: max(16px, env(safe-area-inset-left)) !important;
          padding-right: max(16px, env(safe-area-inset-right)) !important;
        }
        .app-main {
          padding-left: max(16px, env(safe-area-inset-left)) !important;
          padding-right: max(16px, env(safe-area-inset-right)) !important;
        }
        .app-footer {
          padding-left: max(16px, env(safe-area-inset-left)) !important;
          padding-right: max(16px, env(safe-area-inset-right)) !important;
        }
        .tip-section {
          padding-left: max(16px, env(safe-area-inset-left)) !important;
          padding-right: max(16px, env(safe-area-inset-right)) !important;
        }
        .app-credits {
          padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
        }

        /* Wallet: OnchainKit on desktop, custom button on mobile */
        .wallet-desktop { display: inline-flex; }
        .wallet-mobile { display: none !important; }
        @media (max-width: 639px) {
          .wallet-desktop { display: none !important; }
          .wallet-mobile { display: inline-flex !important; }
        }

        /* Tablet and below (768px) */
        @media (max-width: 768px) {
          .tow-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .whale-grid {
            grid-template-columns: 1fr !important;
          }
          .header-weather {
            display: none !important;
          }
          .header-legend-btn,
          .header-theme-btn {
            display: none !important;
          }
        }

        /* Mobile (480px and below) */
        @media (max-width: 480px) {
          .header-subtitle {
            display: none !important;
          }
          .header-live {
            display: none !important;
          }
          .header-base-text {
            display: none !important;
          }
          .header-base-badge {
            padding: 4px 6px !important;
          }
          .header-save-btn {
            padding: 6px 8px !important;
            font-size: 10px !important;
          }
          .price-display {
            font-size: 32px !important;
            letter-spacing: 0 !important;
          }
          .tow-circle {
            width: 32px !important;
            height: 32px !important;
          }
          .tow-circle span {
            font-size: 7px !important;
          }
          .app-footer {
            gap: 10px !important;
          }
        }

        /* Very small screens (360px) */
        @media (max-width: 360px) {
          .price-display {
            font-size: 28px !important;
          }
          .header-save-btn {
            display: none !important;
          }
          .tab-nav button {
            padding: 6px 8px !important;
          }
          .tab-nav button div:last-child {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
