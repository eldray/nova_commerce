import React from "react";
import { Link } from "react-router-dom";
import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className={styles.wrapper}>
      <Link to="/" className={styles.logo}>Nova Commerce</Link>
      <div className={styles.card}>{children}</div>
    </div>
  );
};
