"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Transaction,
  TransactionButton,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel,
} from "@coinbase/onchainkit/transaction";
import { encodeFunctionData } from "viem";
import { base } from "wagmi/chains";
import styles from "./BattleTab.module.css";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const TIP_WALLET = "0x7d9ea6549d5b86ef07b9fa2f1cbac52fc523df65" as const;
const TIP_AMOUNT = BigInt(1_000_000); // 1 USDC (6 decimals)

const erc20TransferAbi = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

interface BtcPriceData {
  usd: number;
  usd_24h_change: number;
  usd_24h_vol: number;
  usd_market_cap: number;
}

interface WhaleAlert {
  id: string;
  type: "buy" | "sell" | "transfer";
  amount: number;
  from: string;
  to: string;
  time: string;
}

const EXCHANGES = ["Binance", "Coinbase", "Kraken", "OKX", "Bitfinex"];
const WALLETS = ["Unknown Wallet", "Whale #1092", "Whale #3847", "Whale #7251"];

function generateWhaleAlerts(): WhaleAlert[] {
  const types: WhaleAlert["type"][] = ["buy", "sell", "transfer"];
  const sources = [...EXCHANGES, ...WALLETS];

  return Array.from({ length: 6 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const fromPool = type === "buy" ? EXCHANGES : sources;
    const toPool = type === "sell" ? EXCHANGES : sources;

    return {
      id: `whale-${Date.now()}-${i}`,
      type,
      amount: Math.floor(Math.random() * 4500) + 500,
      from: fromPool[Math.floor(Math.random() * fromPool.length)],
      to: toPool[Math.floor(Math.random() * toPool.length)],
      time: new Date(
        Date.now() - Math.floor(Math.random() * 3600000)
      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  });
}

export function BattleTab() {
  const [price, setPrice] = useState<BtcPriceData | null>(null);
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceError, setPriceError] = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true"
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setPrice(data.bitcoin);
        setPriceError(false);
      } catch {
        setPriceError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setWhaleAlerts(generateWhaleAlerts());
    const interval = setInterval(() => {
      setWhaleAlerts((prev) => {
        const newAlert: WhaleAlert = {
          id: `whale-${Date.now()}`,
          type: (["buy", "sell", "transfer"] as const)[
            Math.floor(Math.random() * 3)
          ],
          amount: Math.floor(Math.random() * 4500) + 500,
          from: [...EXCHANGES, ...WALLETS][
            Math.floor(Math.random() * (EXCHANGES.length + WALLETS.length))
          ],
          to: [...EXCHANGES, ...WALLETS][
            Math.floor(Math.random() * (EXCHANGES.length + WALLETS.length))
          ],
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        return [newAlert, ...prev.slice(0, 5)];
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const tipCalls = useMemo(
    () => [
      {
        to: USDC_BASE,
        data: encodeFunctionData({
          abi: erc20TransferAbi,
          functionName: "transfer",
          args: [TIP_WALLET, TIP_AMOUNT],
        }),
      },
    ],
    []
  );

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
    return `$${vol.toLocaleString()}`;
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    return `$${cap.toLocaleString()}`;
  };

  const typeLabel = (type: WhaleAlert["type"]) => {
    switch (type) {
      case "buy":
        return { text: "BUY", className: styles.typeBuy };
      case "sell":
        return { text: "SELL", className: styles.typeSell };
      case "transfer":
        return { text: "XFER", className: styles.typeTransfer };
    }
  };

  return (
    <div className={styles.container}>
      {/* BTC Price Card */}
      <div className={styles.priceCard}>
        <div className={styles.priceHeader}>
          <div className={styles.priceCoin}>
            <span className={styles.btcIcon}>&#8383;</span>
            <span>Bitcoin</span>
          </div>
          <span className={styles.priceBadge}>LIVE</span>
        </div>

        {loading ? (
          <div className={styles.priceLoading}>Loading price...</div>
        ) : priceError ? (
          <div className={styles.priceError}>Failed to load price data</div>
        ) : price ? (
          <>
            <div className={styles.priceValue}>
              ${price.usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div
              className={
                price.usd_24h_change >= 0
                  ? styles.changePositive
                  : styles.changeNegative
              }
            >
              {price.usd_24h_change >= 0 ? "+" : ""}
              {price.usd_24h_change.toFixed(2)}% (24h)
            </div>
            <div className={styles.priceStats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Vol 24h</span>
                <span className={styles.statValue}>
                  {formatVolume(price.usd_24h_vol)}
                </span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Mkt Cap</span>
                <span className={styles.statValue}>
                  {formatMarketCap(price.usd_market_cap)}
                </span>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Whale Alerts */}
      <div className={styles.whaleSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Whale Alerts</h3>
          <span className={styles.sectionBadge}>
            {whaleAlerts.length} recent
          </span>
        </div>
        <div className={styles.whaleList}>
          {whaleAlerts.map((alert) => {
            const label = typeLabel(alert.type);
            return (
              <div key={alert.id} className={styles.whaleCard}>
                <div className={styles.whaleTop}>
                  <span className={label.className}>{label.text}</span>
                  <span className={styles.whaleAmount}>
                    {alert.amount.toLocaleString()} BTC
                  </span>
                  <span className={styles.whaleTime}>{alert.time}</span>
                </div>
                <div className={styles.whaleRoute}>
                  <span className={styles.whaleFrom}>{alert.from}</span>
                  <span className={styles.whaleArrow}>&rarr;</span>
                  <span className={styles.whaleTo}>{alert.to}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tip the Builder */}
      <div className={styles.tipSection}>
        <p className={styles.tipLabel}>Support the builder</p>
        <Transaction
          chainId={base.id}
          calls={tipCalls}
          isSponsored
          onSuccess={() => console.log("Tip sent successfully!")}
          onError={(err) => console.error("Tip failed:", err)}
        >
          <TransactionButton text="Tip the Builder (1 USDC)" />
          <TransactionToast>
            <TransactionToastIcon />
            <TransactionToastLabel />
            <TransactionToastAction />
          </TransactionToast>
        </Transaction>
      </div>
    </div>
  );
}
