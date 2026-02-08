"use client";
import { useAddFrame } from "@coinbase/onchainkit/minikit";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
} from "@coinbase/onchainkit/identity";
import styles from "./Header.module.css";

export function Header() {
  const addFrame = useAddFrame();

  const handleSaveApp = async () => {
    try {
      await addFrame();
    } catch (err) {
      console.error("Failed to save app:", err);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>&#9889;</span>
        <h1 className={styles.title}>BTC Battle</h1>
      </div>
      <div className={styles.actions}>
        <button onClick={handleSaveApp} className={styles.saveButton}>
          Save App
        </button>
        <span className={styles.baseBadge}>
          <svg width="14" height="14" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
            <path d="M55.4 93.3c20.9 0 37.9-17 37.9-37.9S76.3 17.5 55.4 17.5c-19.5 0-35.6 14.8-37.6 33.8h49.8v11.2H17.8c2 19 18.1 30.8 37.6 30.8z" fill="white"/>
          </svg>
          Base
        </span>
        <Wallet>
          <ConnectWallet>
            <Avatar />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>
    </header>
  );
}
