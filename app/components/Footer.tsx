"use client";
import { useAccount } from "wagmi";
import styles from "./Footer.module.css";

export function Footer() {
  const { address, isConnected } = useAccount();

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <footer className={styles.footer}>
      {isConnected && address ? (
        <div className={styles.walletInfo}>
          <span className={styles.dot} />
          <span className={styles.label}>Connected:</span>
          <span className={styles.address}>{truncateAddress(address)}</span>
        </div>
      ) : (
        <div className={styles.walletInfo}>
          <span className={styles.dotDisconnected} />
          <span className={styles.label}>Wallet not connected</span>
        </div>
      )}
    </footer>
  );
}
