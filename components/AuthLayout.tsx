import React from "react";
import { Link } from "react-router-dom";
import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Link to="/">
            <h1>Nova Commerce</h1>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
