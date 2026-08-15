import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Log in — Nova Commerce</title>
      </Helmet>
      <h1 className={styles.title}>Welcome back</h1>
      <p className={styles.subtitle}>Log in to manage your store.</p>
      <PasswordLoginForm />
      <p className={styles.footerText}>
        Don't have a store yet? <Link to="/register" className={styles.link}>Register your business</Link>
      </p>
    </>
  );
}
