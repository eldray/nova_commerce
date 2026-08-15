import React from "react";
import { Helmet } from "react-helmet";
import { ShieldCheck, Sparkles, Heart, Globe } from "lucide-react";
import styles from "./about.module.css";

export default function AboutPage() {
  return (
    <div className={styles.wrapper}>
      <Helmet>
        <title>About Us — Nova Commerce</title>
      </Helmet>

      <section className={styles.hero}>
        <h1 className={styles.title}>Empowering West African E-Commerce</h1>
        <p className={styles.subtitle}>
          Nova Commerce is a modern multi-tenant e-commerce platform built to power African brands, local artisans, and growing businesses with high-converting online storefronts and seamless Mobile Money payments.
        </p>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.imageFrame}>
          <img src="/static/demo/fashion_dress.png" alt="African Fashion Craftsmanship" className={styles.heroImage} />
        </div>
        <div className={styles.textBlock}>
          <h2 className={styles.heading}>Craftsmanship Meets Modern Technology</h2>
          <p className={styles.paragraph}>
            From authentic hand-woven Kente cloth to handmade leather accessories and bespoke couture, our platform connects merchants directly with customers across Ghana and globally.
          </p>
          <p className={styles.paragraph}>
            Every store powered by Nova Commerce benefits from localized checkout options, instant Mobile Money integration via Paystack & Hubtel, and real-time inventory management.
          </p>
        </div>
      </section>

      <section>
        <h2 className={styles.heading} style={{ textAlign: "center" }}>Why Choose Nova Commerce</h2>
        <div className={styles.valuesGrid}>
          <div className={styles.valueCard}>
            <Sparkles className={styles.valueIcon} size={32} />
            <h3 className={styles.valueTitle}>Authentic Quality</h3>
            <p className={styles.valueText}>Curated craftsmanship celebrating authentic African heritage, premium textiles, and meticulous detail.</p>
          </div>
          <div className={styles.valueCard}>
            <ShieldCheck className={styles.valueIcon} size={32} />
            <h3 className={styles.valueTitle}>Secure Payments</h3>
            <p className={styles.valueText}>Native support for Mobile Money (MTN, Telecel, AT) and Visa/Mastercard payments via Paystack and Hubtel.</p>
          </div>
          <div className={styles.valueCard}>
            <Globe className={styles.valueIcon} size={32} />
            <h3 className={styles.valueTitle}>Fast Local Delivery</h3>
            <p className={styles.valueText}>Integrated delivery zones across Accra, Kumasi, Tema, and nationwide door-to-door shipping.</p>
          </div>
          <div className={styles.valueCard}>
            <Heart className={styles.valueIcon} size={32} />
            <h3 className={styles.valueTitle}>Merchant Support</h3>
            <p className={styles.valueText}>Direct WhatsApp integration and dedicated support helping local merchants grow their online footprint.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
