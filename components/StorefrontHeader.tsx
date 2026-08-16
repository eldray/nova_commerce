import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, Menu, X, Heart } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { ThemeModeSwitch } from "./ThemeModeSwitch";
import { useCart } from "../helpers/CartContext";
import styles from "./StorefrontHeader.module.css";

const NAV_LINKS = [
  { label: "Home", to: "/store" },
  { label: "Shop", to: "/shop" },
  { label: "Categories", to: "/categories" },
  { label: "About", to: "/about" },
];

interface StorefrontHeaderProps {
  storeName?: string;
}

export const StorefrontHeader = ({ storeName = "Nova Fashion Ghana" }: StorefrontHeaderProps) => {
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <span>Free delivery in Accra & Kumasi on orders over GH₵300</span>
      </div>
      <div className={styles.mainBar}>
        <button
          className={styles.menuButton}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/store" className={styles.logo}>
          {storeName}
        </Link>

        <nav className={styles.nav}>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <div className={styles.searchWrap} data-open={searchOpen}>
            {searchOpen && (
              <Input placeholder="Search products…" className={styles.searchInput} autoFocus />
            )}
            <button
              className={styles.iconButton}
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          </div>
          <Link to="/wishlist" className={styles.iconButton} aria-label="Wishlist">
            <Heart size={20} />
          </Link>
          <Link to="/cart" className={styles.iconButton} aria-label="Cart">
            <ShoppingBag size={20} />
            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
          </Link>
          <ThemeModeSwitch />
        </div>
      </div>

      {mobileOpen && (
        <nav className={styles.mobileNav}>
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={styles.mobileNavLink} onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};
