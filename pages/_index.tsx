import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { Button } from "../components/Button";
import { ProductCard, ProductCardData } from "../components/ProductCard";
import styles from "./_index.module.css";

const categories = [
  { name: "Dresses", slug: "dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80" },
  { name: "Menswear", slug: "menswear", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&q=80" },
  { name: "Footwear", slug: "footwear", image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&q=80" },
  { name: "Accessories", slug: "accessories", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80" },
];

const featuredProducts: ProductCardData[] = [
  { slug: "kente-print-wrap-dress", name: "Kente-Print Wrap Dress", imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&q=80", price: 289, compareAtPrice: 349, badge: "New", rating: 4.5, reviewCount: 32 },
  { slug: "tailored-linen-shirt", name: "Tailored Linen Shirt", imageUrl: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=500&q=80", price: 199, rating: 4.8, reviewCount: 58 },
  { slug: "ankara-block-heels", name: "Ankara Block Heels", imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80", price: 249, compareAtPrice: 299, badge: "Sale", rating: 4.3, reviewCount: 21 },
  { slug: "beaded-statement-necklace", name: "Beaded Statement Necklace", imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&q=80", price: 129, rating: 4.6, reviewCount: 14 },
];

const bestSellers: ProductCardData[] = [
  { slug: "classic-agbada-set", name: "Classic Agbada Set", imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&q=80", price: 459, badge: "Bestseller", rating: 4.9, reviewCount: 87 },
  { slug: "high-waist-denim", name: "High-Waist Denim", imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80", price: 179, rating: 4.4, reviewCount: 45 },
  { slug: "canvas-tote-bag", name: "Canvas Tote Bag", imageUrl: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=500&q=80", price: 99, rating: 4.7, reviewCount: 63 },
  { slug: "silk-headwrap", name: "Silk Headwrap", imageUrl: "https://images.unsplash.com/photo-1600091166971-7f9faad6c1e2?w=500&q=80", price: 79, rating: 4.5, reviewCount: 29 },
];

const testimonials = [
  { name: "Abena K.", city: "Accra", quote: "Delivery was fast and the fabric quality is even better than the photos. My go-to store now." },
  { name: "Kwame O.", city: "Kumasi", quote: "Paid with MoMo, order arrived in two days. Sizing chart was spot on too." },
  { name: "Efua D.", city: "Takoradi", quote: "Customer support replied on WhatsApp within minutes. Felt like shopping with a friend." },
];

export default function IndexPage() {
  return (
    <>
      <Helmet>
        <title>Nova Fashion Ghana — Contemporary African Fashion</title>
        <meta
          name="description"
          content="Shop contemporary African-inspired fashion, footwear and accessories. Nationwide delivery across Ghana, pay by Mobile Money or card."
        />
      </Helmet>

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
        <div className={styles.productGrid}>
          {featuredProducts.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
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
        <div className={styles.productGrid}>
          {bestSellers.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
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
