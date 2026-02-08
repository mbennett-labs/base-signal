"use client";
import { useComposeCast, useMiniKit } from "@coinbase/onchainkit/minikit";
import styles from "./FarcasterTab.module.css";

export function FarcasterTab() {
  const { composeCastAsync } = useComposeCast();
  const { context } = useMiniKit();

  const handleShare = async () => {
    try {
      const result = await composeCastAsync({
        text: "Check out BTC Battle - real-time whale tracking and market signals on Base!",
        embeds: [
          process.env.NEXT_PUBLIC_URL || "https://base-signal.vercel.app",
        ],
      });

      if (result?.cast) {
        console.log("Cast shared:", result.cast.hash);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <div className={styles.container}>
      {/* User Context */}
      {context?.user && (
        <div className={styles.userCard}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {context.user.displayName || `FID #${context.user.fid}`}
            </span>
            {context.user.fid && (
              <span className={styles.userFid}>FID #{context.user.fid}</span>
            )}
          </div>
        </div>
      )}

      {/* Share Battle */}
      <div className={styles.shareSection}>
        <h3 className={styles.sectionTitle}>Share to Farcaster</h3>
        <p className={styles.shareDescription}>
          Cast your BTC battle signals and predictions to the Farcaster network.
        </p>
        <button onClick={handleShare} className={styles.shareButton}>
          Share Battle
        </button>
      </div>

      {/* Community Signals */}
      <div className={styles.feedSection}>
        <div className={styles.feedHeader}>
          <h3 className={styles.sectionTitle}>Community Signals</h3>
        </div>
        <div className={styles.feedList}>
          <div className={styles.signalCard}>
            <div className={styles.signalIcon}>&#128200;</div>
            <div className={styles.signalContent}>
              <span className={styles.signalAuthor}>BTC Analyst</span>
              <p className={styles.signalText}>
                Major accumulation detected. Whales moved 2,400 BTC off
                exchanges in the last 4 hours.
              </p>
              <span className={styles.signalTime}>2h ago</span>
            </div>
          </div>

          <div className={styles.signalCard}>
            <div className={styles.signalIcon}>&#9888;&#65039;</div>
            <div className={styles.signalContent}>
              <span className={styles.signalAuthor}>Whale Watcher</span>
              <p className={styles.signalText}>
                Large transfer: 1,800 BTC moved from cold storage to Coinbase.
                Watch for potential sell pressure.
              </p>
              <span className={styles.signalTime}>5h ago</span>
            </div>
          </div>

          <div className={styles.signalCard}>
            <div className={styles.signalIcon}>&#128640;</div>
            <div className={styles.signalContent}>
              <span className={styles.signalAuthor}>Base Signal Bot</span>
              <p className={styles.signalText}>
                BTC dominance rising. Altseason index at 28/100 - Bitcoin season
                continues.
              </p>
              <span className={styles.signalTime}>8h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
