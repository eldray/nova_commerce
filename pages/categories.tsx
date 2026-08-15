import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ArrowRight, Layers } from "lucide-react";
import styles from "./categories.module.css";

const CATEGORIES_DATA = [
  {
    id: 1,
    name: "Women's Fashion",
    slug: "womens-fashion",
    description: "Vibrant Ankara dresses, tailored jumpsuits, and handcrafted skirts designed for elegance.",
    image: "/static/demo/fashion_dress.png",
  },
  {
    id: 2,
    name: "Men's Wear",
    slug: "mens-wear",
    description: "Tailored Kente suits, blazers, and modern contemporary African menswear.",
    image: "/static/demo/kente_suit.png",
  },
  {
    id: 3,
    name: "Accessories",
    slug: "accessories",
    description: "Handcrafted genuine leather bags, Krobo glass bead necklaces, and artisan jewelry.",
    image: "/static/demo/leather_handbag.png",
  },
  {
    id: 4,
    name: "Footwear",
    slug: "footwear",
    description: "Handcrafted artisan leather shoes, woven sandals, and traditional slippers.",
    image: "/static/demo/beaded_necklace.png",
  },
];

export default function CategoriesPage() {
  return (
    <div className={styles.wrapper}>
      <Helmet>
        <title>Shop by Category — Nova Commerce</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Browse Categories</h1>
        <p className={styles.subtitle}>
          Explore curated collections of authentic Ghanaian craftsmanship, modern apparel, and luxury accessories.
        </p>
      </header>

      <div className={styles.grid}>
        {CATEGORIES_DATA.map((cat) => (
          <Link key={cat.id} to={`/shop?category=${cat.slug}`} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img src={cat.image} alt={cat.name} className={styles.image} />
            </div>
            <div className={styles.content}>
              <h2 className={styles.categoryName}>{cat.name}</h2>
              <p className={styles.categoryDesc}>{cat.description}</p>
              <span className={styles.exploreLink}>
                Explore Collection <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
