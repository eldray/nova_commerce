import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, ArrowRight, Trash2 } from "lucide-react";
import { useWishlist, useToggleWishlistItem } from "../helpers/useWishlist";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import styles from "./wishlist.module.css";

export default function WishlistPage() {
  const { data, isLoading, error } = useWishlist();
  const toggleMutation = useToggleWishlistItem();

  const handleRemove = (productId: string) => {
    if (confirm("Remove this item from your wishlist?")) {
      toggleMutation.mutate(productId);
    }
  };

  const handleAddToCart = (productSlug: string) => {
    // Navigate to product page or add to cart
    window.location.href = `/shop/${productSlug}`;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Spinner size="lg" />
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Failed to load wishlist. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <>
        <Helmet>
          <title>My Wishlist — Nova Fashion Ghana</title>
        </Helmet>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <Heart size={64} strokeWidth={1.5} className={styles.emptyIcon} />
            <h1 className={styles.emptyTitle}>Your wishlist is empty</h1>
            <p className={styles.emptySubtitle}>
              Save items you love by clicking the heart icon on any product.
            </p>
            <Button size="lg" asChild>
              <Link to="/shop">
                Browse products <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Wishlist — Nova Fashion Ghana</title>
      </Helmet>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Wishlist</h1>
          <p className={styles.subtitle}>
            {data.items.length} {data.items.length === 1 ? "item" : "items"} saved
          </p>
        </div>

        <div className={styles.grid}>
          {data.items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.imageWrap}>
                <img
                  src={item.productImageUrl || "/placeholder-product.jpg"}
                  alt={item.productName}
                  className={styles.image}
                />
                {!item.inStock && (
                  <span className={styles.outOfStockBadge}>Out of Stock</span>
                )}
              </div>

              <div className={styles.content}>
                <Link 
                  to={`/shop/${item.productSlug}`}
                  className={styles.productName}
                >
                  {item.productName}
                </Link>

                <div className={styles.priceRow}>
                  <span className={styles.price}>
                    GH₵{item.price.toFixed(2)}
                  </span>
                  {item.compareAtPrice && (
                    <span className={styles.comparePrice}>
                      GH₵{item.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className={styles.actions}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddToCart(item.productSlug)}
                    disabled={!item.inStock}
                  >
                    <ShoppingCart size={16} />
                    {item.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(item.productId)}
                    disabled={toggleMutation.isPending}
                    className={styles.removeButton}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <Button size="lg" variant="outline" asChild>
            <Link to="/shop">
              Continue Shopping <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
