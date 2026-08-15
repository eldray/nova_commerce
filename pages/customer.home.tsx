import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Package, TrendingUp, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { usePublicProducts } from "../helpers/usePublicProducts";
import { useTrendingProducts } from "../helpers/useTrending";
import { useCart } from "../helpers/CartContext";
import { useWishlist } from "../helpers/useWishlist";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import styles from "./customer.home.module.css";

const formatMoney = (amount: number | string, currency: string = "GHS") =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    Number(amount)
  );

export default function CustomerHomePage() {
  const { user } = useAuth();
  const { data: trendingData, isFetching: trendingLoading } = useTrendingProducts(8);
  const { data: allProductsData } = usePublicProducts();
  const { items: cartItems, itemCount, subtotal } = useCart();
  const { data: wishlistData, isFetching: wishlistLoading } = useWishlist();

  const featuredProducts = allProductsData?.products?.slice(0, 4) || [];
  const wishlistItems = wishlistData?.items || [];
  const recentWishlistItems = wishlistItems.slice(0, 4);

  return (
    <div className={styles.wrapper}>
      <Helmet>
        <title>Welcome — Nova Commerce</title>
      </Helmet>

      {/* Welcome Header */}
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>
            Welcome back{user?.displayName ? `, ${user.displayName}` : ''}! 👋
          </h1>
          <p className={styles.welcomeSubtitle}>
            Discover amazing products from Ghanaian businesses. Shop securely with Mobile Money or card.
          </p>
          <div className={styles.quickStats}>
            <Link to="/cart" className={styles.statCard}>
              <div className={styles.statIcon}><ShoppingCart size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{itemCount}</span>
                <span className={styles.statLabel}>Items in Cart</span>
              </div>
              {subtotal > 0 && (
                <div className={styles.statExtra}>{formatMoney(subtotal)}</div>
              )}
            </Link>
            <Link to="/wishlist" className={styles.statCard}>
              <div className={styles.statIcon}><Heart size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{wishlistData?.total || 0}</span>
                <span className={styles.statLabel}>Wishlist Items</span>
              </div>
            </Link>
            <Link to="/shop" className={styles.statCard}>
              <div className={styles.statIcon}><Package size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{allProductsData?.products.length || 0}</span>
                <span className={styles.statLabel}>Products Available</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className={styles.trustBar}>
        <div className={styles.trustItem}>
          <Truck size={20} /> Nationwide delivery
        </div>
        <div className={styles.trustItem}>
          <ShieldCheck size={20} /> Secure MoMo & card payment
        </div>
        <div className={styles.trustItem}>
          <RotateCcw size={20} /> Easy 7-day returns
        </div>
      </section>

      {/* Trending Products */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
            <TrendingUp size={24} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Trending Now</h2>
          </div>
          <Link to="/shop?filter=trending" className={styles.sectionLink}>View all</Link>
        </div>
        
        {trendingLoading ? (
          <div className={styles.grid}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className={styles.cardSkeleton} />
            ))}
          </div>
        ) : trendingData && trendingData.length > 0 ? (
          <div className={styles.grid}>
            {trendingData.map((product) => (
              <Link key={product.id} to={`/product/${product.slug}`} className={styles.productCard}>
                <div className={styles.productImageWrap}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className={styles.productImage} loading="lazy" />
                  ) : (
                    <div className={styles.placeholderImage}><Package size={32} /></div>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <div className={styles.productPrice}>
                    {product.sale_price ? (
                      <>
                        <span className={styles.salePrice}>{formatMoney(product.sale_price)}</span>
                        <span className={styles.originalPrice}>{formatMoney(product.price)}</span>
                      </>
                    ) : (
                      <span className={styles.price}>{formatMoney(product.price)}</span>
                    )}
                  </div>
                  {product.category_name && (
                    <span className={styles.category}>{product.category_name}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Package size={48} className={styles.emptyIcon} />
            <p>No trending products yet. Check out our latest arrivals!</p>
            <Button asChild>
              <Link to="/shop">Browse All Products</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Products</h2>
          <Link to="/shop" className={styles.sectionLink}>View all</Link>
        </div>
        
        {featuredProducts.length > 0 ? (
          <div className={styles.grid}>
            {featuredProducts.map((product) => {
              const displayPrice = Number(product.salePrice ?? product.price);
              const outOfStock = product.stockQuantity <= 0;
              return (
                <Link key={product.id} to={`/product/${product.slug}`} className={styles.productCard}>
                  <div className={styles.productImageWrap}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className={styles.productImage} loading="lazy" />
                    ) : (
                      <div className={styles.placeholderImage}><Package size={32} /></div>
                    )}
                    {outOfStock && <span className={styles.outOfStockBadge}>Out of Stock</span>}
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <div className={styles.productPrice}>
                      {product.salePrice ? (
                        <>
                          <span className={styles.salePrice}>{formatMoney(displayPrice)}</span>
                          <span className={styles.originalPrice}>{formatMoney(product.price)}</span>
                        </>
                      ) : (
                        <span className={styles.price}>{formatMoney(displayPrice)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Package size={48} className={styles.emptyIcon} />
            <p>No products available yet.</p>
          </div>
        )}
      </section>

      {/* Wishlist Section */}
      {wishlistItems.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <Heart size={24} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Your Wishlist</h2>
            </div>
            <Link to="/wishlist" className={styles.sectionLink}>View all ({wishlistData?.total || 0})</Link>
          </div>
          
          <div className={styles.grid}>
            {recentWishlistItems.map((item) => (
              <Link key={item.id} to={`/product/${item.productSlug}`} className={styles.productCard}>
                <div className={styles.productImageWrap}>
                  {item.productImageUrl ? (
                    <img src={item.productImageUrl} alt={item.productName} className={styles.productImage} loading="lazy" />
                  ) : (
                    <div className={styles.placeholderImage}><Package size={32} /></div>
                  )}
                  {!item.inStock && <span className={styles.outOfStockBadge}>Out of Stock</span>}
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{item.productName}</h3>
                  <div className={styles.productPrice}>
                    <span className={styles.price}>{formatMoney(item.price, item.currency)}</span>
                  </div>
                  {!item.inStock && <span className={styles.stockStatus}>Out of Stock</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories Quick Links */}
      <section className={styles.categoriesSection}>
        <h2 className={styles.sectionTitle}>Shop by Category</h2>
        <div className={styles.categoryGrid}>
          <Link to="/shop?category=fashion" className={styles.categoryCard}>
            <span>Fashion</span>
          </Link>
          <Link to="/shop?category=electronics" className={styles.categoryCard}>
            <span>Electronics</span>
          </Link>
          <Link to="/shop?category=home" className={styles.categoryCard}>
            <span>Home & Living</span>
          </Link>
          <Link to="/shop?category=beauty" className={styles.categoryCard}>
            <span>Beauty</span>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to start shopping?</h2>
          <p className={styles.ctaSubtitle}>
            Browse hundreds of products from trusted Ghanaian businesses
          </p>
          <div className={styles.ctaButtons}>
            <Button size="lg" asChild>
              <Link to="/shop">Browse All Products</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/categories">Explore Categories</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
