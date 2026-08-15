import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "./Badge";
import styles from "./ProductCard.module.css";

export interface ProductCardData {
  slug: string;
  name: string;
  imageUrl: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  badge?: string;
  rating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export const ProductCard = ({ product, className }: ProductCardProps) => {
  const currency = product.currency ?? "GHS";
  return (
    <Link to={`/product/${product.slug}`} className={[styles.card, className].filter(Boolean).join(" ")}>
      <div className={styles.imageWrap}>
        <img src={product.imageUrl} alt={product.name} className={styles.image} loading="lazy" />
        {product.badge && <Badge className={styles.badge}>{product.badge}</Badge>}
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{product.name}</h3>
        {typeof product.rating === "number" && (
          <div className={styles.ratingRow}>
            <span className={styles.stars} aria-hidden="true">
              {"★".repeat(Math.round(product.rating))}
              {"☆".repeat(5 - Math.round(product.rating))}
            </span>
            {product.reviewCount !== undefined && (
              <span className={styles.reviewCount}>({product.reviewCount})</span>
            )}
          </div>
        )}
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatMoney(product.price, currency)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className={styles.comparePrice}>{formatMoney(product.compareAtPrice, currency)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};
