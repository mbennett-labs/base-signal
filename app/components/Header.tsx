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
