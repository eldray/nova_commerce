import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Badge } from "./Badge";
import { useToggleWishlistItem, useIsInWishlist } from "../helpers/useWishlist";
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
  id?: string; // For wishlist functionality
}

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
  showWishlist?: boolean;
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export const ProductCard = ({ product, className, showWishlist = true }: ProductCardProps) => {
  const currency = product.currency ?? "GHS";
  const isInWishlist = useIsInWishlist(product.id || "");
  const toggleMutation = useToggleWishlistItem();

  const handleWishlistClick = (e: React.MouseEvent) => {
    if (!showWishlist || !product.id) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    toggleMutation.mutate(product.id);
  };

  return (
    <div className={[styles.cardWrapper, className].filter(Boolean).join(" ")}>
      <Link to={`/product/${product.slug}`} className={styles.card}>
        <div className={styles.imageWrap}>
          <img src={product.imageUrl} alt={product.name} className={styles.image} loading="lazy" />
          {product.badge && <Badge className={styles.badge}>{product.badge}</Badge>}
          {showWishlist && product.id && (
            <button
              className={styles.wishlistButton}
              onClick={handleWishlistClick}
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              type="button"
            >
              <Heart 
                size={18} 
                fill={isInWishlist ? "currentColor" : "none"} 
                className={isInWishlist ? styles.wishlistActive : ""}
              />
            </button>
          )}
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
    </div>
  );
};
