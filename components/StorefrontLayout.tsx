import React from "react";
import { StorefrontHeader } from "./StorefrontHeader";
import { StorefrontFooter } from "./StorefrontFooter";
import { WhatsAppButton } from "./WhatsAppButton";
import styles from "./StorefrontLayout.module.css";

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

export const StorefrontLayout = ({ children }: StorefrontLayoutProps) => {
  return (
    <div className={styles.wrapper}>
      <StorefrontHeader />
      <main className={styles.main}>{children}</main>
      <StorefrontFooter />
      <WhatsAppButton />
    </div>
  );
};
