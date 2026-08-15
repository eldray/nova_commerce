import React from "react";
import { Helmet } from "react-helmet";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "../components/Button";
import { ProductCard, ProductCardData } from "../components/ProductCard";
import styles from "./_index.module.css";
import { useAuth } from "../helpers/useAuth";
import { usePublicProducts } from "../helpers/usePublicProducts";
import { Skeleton } from "../components/Skeleton";
import { Package } from "lucide-react";

const formatMoney = (amount: number | string, currency: string = "GHS") =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    Number(amount)
  );

const categories = [
  { name: "Dresses", slug: "dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80" },
  { name: "Menswear", slug: "menswear", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&q=80" },
  { name: "Footwear", slug: "footwear", image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80" },
  { name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80" },
];

const testimonials = [
  { name: "Abena K.", city: "Accra", quote: "Delivery was fast and the fabric quality is even better than the photos. My go-to store now." },
  { name: "Kwame O.", city: "Kumasi", quote: "Paid with MoMo, order arrived in two days. Sizing chart was spot on too." },
  { name: "Efua D.", city: "Takoradi", quote: "Customer support replied on WhatsApp within minutes. Felt like shopping with a friend." },
];

export default function IndexPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const storeSlug = searchParams.get("store");
  
  // Fetch products if we have a store context
  const { data: productsData, isFetching } = usePublicProducts();
  
  const featuredProducts: ProductCardData[] = (productsData?.products || []).slice(0, 4).map(p => ({
    slug: p.slug,
    name: p.name,
    imageUrl: p.imageUrl || "",
    price: Number(p.salePrice ?? p.price),
    compareAtPrice: p.salePrice ? Number(p.price) : undefined,
    badge: p.salePrice ? "Sale" : p.stockQuantity <= 0 ? "Out of Stock" : undefined,
    rating: 4.5,
    reviewCount: Math.floor(Math.random() * 50) + 10,
  }));

  const bestSellers: ProductCardData[] = (productsData?.products || [])
    .sort((a, b) => b.stockQuantity - a.stockQuantity)
    .slice(0, 4)
    .map(p => ({
      slug: p.slug,
      name: p.name,
      imageUrl: p.imageUrl || "",
      price: Number(p.salePrice ?? p.price),
      badge: "Bestseller",
      rating: 4.7,
      reviewCount: Math.floor(Math.random() * 80) + 20,
    }));

  return (
    <>
      <Helmet>
        <title>{storeSlug ? `${storeSlug} — Nova Commerce` : "Nova Fashion Ghana — Contemporary African Fashion"}</title>
        <meta
          name="description"
          content="Shop contemporary African-inspired fashion, footwear and accessories. Nationwide delivery across Ghana, pay by Mobile Money or card."
        />
      </Helmet>

      {/* Top bar with auth links */}
      <div className={styles.topBar}>
        <div className={styles.topBarContent}>
          <span className={styles.topBarText}>Free delivery on orders over GH₵500</span>
          <div className={styles.topBarActions}>
            {user ? (
              <>
                <span className={styles.topBarUser}>Hi, {user.displayName}</span>
                <Link to="/customer-home" className={styles.topBarLink}>My Account</Link>
                <Link to="/dashboard" className={styles.topBarLink}>Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.topBarLink}>Log in</Link>
                <Link to="/register" className={styles.topBarLink}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>New Season Arrivals</span>
          <h1 className={styles.heroTitle}>Fashion rooted in Ghana, styled for now.</h1>
          <p className={styles.heroSubtitle}>
            Contemporary pieces crafted with local textiles — delivered nationwide, pay by Mobile Money or card.
          </p>
          <div className={styles.heroActions}>
            <Button size="lg" asChild>
              <Link to="/shop">
                Shop the collection <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/categories">Browse categories</Link>
            </Button>
          </div>
        </div>
        <div className={styles.heroImageWrap}>
          <img
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&q=80"
            alt="Model wearing Nova Fashion Ghana collection"
            className={styles.heroImage}
          />
        </div>
      </section>

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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Shop by Category</h2>
        <div className={styles.categoryGrid}>
          {categories.map((cat) => (
            <Link key={cat.slug} to={`/shop?category=${cat.slug}`} className={styles.categoryCard}>
              <img src={cat.image} alt={cat.name} className={styles.categoryImage} />
              <span className={styles.categoryName}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Products</h2>
          <Link to="/shop" className={styles.sectionLink}>View all <ArrowRight size={14} /></Link>
        </div>
        
        {isFetching ? (
          <div className={styles.productGrid}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className={styles.cardSkeleton} />
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className={styles.productGrid}>
            {featuredProducts.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Package size={48} className={styles.emptyIcon} />
            <h3>No products available yet</h3>
            <p>Check back soon for amazing items!</p>
          </div>
        )}
      </section>

      <section className={styles.banner}>
        <div className={styles.bannerContent}>
          <h2 className={styles.bannerTitle}>End of Season Sale</h2>
          <p className={styles.bannerSubtitle}>Up to 30% off selected styles — while stocks last.</p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/shop?filter=sale">Shop the sale</Link>
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Best Sellers</h2>
          <Link to="/shop?filter=bestsellers" className={styles.sectionLink}>View all <ArrowRight size={14} /></Link>
        </div>
        
        {isFetching ? (
          <div className={styles.productGrid}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className={styles.cardSkeleton} />
            ))}
          </div>
        ) : bestSellers.length > 0 ? (
          <div className={styles.productGrid}>
            {bestSellers.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What customers say</h2>
        <div className={styles.testimonialGrid}>
          {testimonials.map((t) => (
            <div key={t.name} className={styles.testimonialCard}>
              <p className={styles.testimonialQuote}>"{t.quote}"</p>
              <span className={styles.testimonialAuthor}>{t.name} · {t.city}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
