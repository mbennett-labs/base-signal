"use client";
import { useState, useEffect, useCallback } from "react";
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
import { useAccount, useConnect, useDisconnect } from "wagmi";
import styles from "./Header.module.css";

function MobileWallet() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = useCallback(() => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  }, [connectors, connect]);

  const truncatedAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "";

  if (!isConnected) {
    return (
      <button className={styles.mobileWalletBtn} onClick={handleConnect}>
        Connect
      </button>
    );
  }

  return (
    <div className={styles.mobileWalletWrap}>
      <button
        className={styles.mobileWalletBtn}
        onClick={() => setShowMenu((v) => !v)}
      >
        {truncatedAddress}
      </button>
      {showMenu && (
        <div className={styles.mobileWalletMenu}>
          <div className={styles.mobileWalletAddr}>{truncatedAddress}</div>
          <button
            className={styles.mobileDisconnectBtn}
            onClick={() => {
              disconnect();
              setShowMenu(false);
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const addFrame = useAddFrame();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
        {isMobile ? (
          <MobileWallet />
        ) : (
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
        )}
      </div>
    </header>
  );
}
