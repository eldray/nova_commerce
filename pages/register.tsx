import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useSearchParams } from "react-router-dom";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";
import styles from "./login.module.css";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type");
  const isMerchant = typeParam === "merchant";
  
  return (
    <>
      <Helmet>
        <title>{isMerchant ? "Start selling — Nova Commerce" : "Join Nova Commerce"}</title>
      </Helmet>
      
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 className={styles.title}>
          {isMerchant ? "Start selling in minutes" : "Welcome to Nova Commerce"}
        </h1>
        <p className={styles.subtitle}>
          {isMerchant 
            ? "Create your merchant account to set up your online store." 
            : "Create an account to shop amazing products from Ghanaian businesses."}
        </p>
        
        {/* User Type Toggle */}
        <div style={{ 
          display: "flex", 
          gap: "0.5rem", 
          justifyContent: "center", 
          margin: "1.5rem 0",
          padding: "0.25rem",
          backgroundColor: "#f3f4f6",
          borderRadius: "0.5rem",
          maxWidth: "400px",
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          <Link 
            to="/register?type=customer" 
            style={{
              flex: 1,
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontWeight: !isMerchant ? 600 : 400,
              backgroundColor: !isMerchant ? "white" : "transparent",
              color: !isMerchant ? "#111827" : "#6b7280",
              boxShadow: !isMerchant ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s"
            }}
          >
            🛍️ Shop as Customer
          </Link>
          <Link 
            to="/register?type=merchant" 
            style={{
              flex: 1,
              padding: "0.75rem 1.5rem",
              borderRadius: "0.375rem",
              textDecoration: "none",
              fontWeight: isMerchant ? 600 : 400,
              backgroundColor: isMerchant ? "white" : "transparent",
              color: isMerchant ? "#111827" : "#6b7280",
              boxShadow: isMerchant ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s"
            }}
          >
            🏪 Sell as Merchant
          </Link>
        </div>
      </div>
      
      <PasswordRegisterForm redirectTo={isMerchant ? "/onboarding/business-info" : "/customer-home"} />
      
      <p className={styles.footerText}>
        Already have an account? <Link to="/login" className={styles.link}>Log in</Link>
      </p>
    </>
  );
}
