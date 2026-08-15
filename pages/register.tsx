import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";
import styles from "./login.module.css";

export default function RegisterPage() {
  return (
    <>
      <Helmet>
        <title>Register your business — Nova Commerce</title>
      </Helmet>
      <h1 className={styles.title}>Start selling in minutes</h1>
      <p className={styles.subtitle}>Create your account to set up your store.</p>
      <PasswordRegisterForm redirectTo="/onboarding/business-info" />
      <p className={styles.footerText}>
        Already have a store? <Link to="/login" className={styles.link}>Log in</Link>
      </p>
    </>
  );
}
