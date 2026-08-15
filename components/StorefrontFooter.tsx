import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import styles from "./StorefrontFooter.module.css";

interface StorefrontFooterProps {
  storeName?: string;
}

export const StorefrontFooter = ({ storeName = "Nova Fashion Ghana" }: StorefrontFooterProps) => {
  return (
    <footer className={styles.footer}>
      <div className={styles.newsletter}>
        <div className={styles.newsletterInner}>
          <div>
            <h3 className={styles.newsletterTitle}>Join the list</h3>
            <p className={styles.newsletterSubtitle}>New arrivals, restocks & offers — no spam.</p>
          </div>
          <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
            <Input type="email" placeholder="you@example.com" className={styles.newsletterInput} />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.column}>
          <span className={styles.logo}>{storeName}</span>
          <p className={styles.tagline}>Contemporary fashion for the modern Ghanaian, delivered nationwide.</p>
          <div className={styles.social}>
            <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
          </div>
        </div>

        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Shop</h4>
          <Link to="/shop" className={styles.link}>All Products</Link>
          <Link to="/categories" className={styles.link}>Categories</Link>
          <Link to="/shop?filter=new" className={styles.link}>New Arrivals</Link>
          <Link to="/shop?filter=sale" className={styles.link}>Sale</Link>
        </div>

        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Customer Care</h4>
          <Link to="/account/orders" className={styles.link}>Track Order</Link>
          <Link to="/policies/shipping" className={styles.link}>Shipping Info</Link>
          <Link to="/policies/returns" className={styles.link}>Returns</Link>
          <Link to="/contact" className={styles.link}>Contact Us</Link>
        </div>

        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Contact</h4>
          <a href="mailto:hello@novafashion.gh" className={styles.link}>
            <Mail size={14} /> hello@novafashion.gh
          </a>
          <span className={styles.link}>+233 24 000 0000</span>
          <span className={styles.link}>Kumasi, Ghana</span>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} {storeName}. All rights reserved.</span>
        <span className={styles.poweredBy}>Powered by Nova Commerce</span>
      </div>
    </footer>
  );
};
