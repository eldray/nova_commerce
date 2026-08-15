import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Package, ShoppingCart } from "lucide-react";
import { usePublicStore } from "../helpers/usePublicStore";
import { usePublicProducts } from "../helpers/usePublicProducts";
import { useCart } from "../helpers/CartContext";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import styles from "./shop.module.css";

const formatMoney = (amount: string, currency: string) =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(
        Number(amount)
    );

export default function ShopPage() {
    const { data: storeData } = usePublicStore();
    const store = storeData?.store;
    const { data, isFetching } = usePublicProducts(store?.tenantId);
    const { addItem } = useCart();

    return (
        <div className={styles.wrapper}>
            <Helmet>
                <title>Shop — {store?.storeName ?? "Nova Commerce"}</title>
            </Helmet>
            <div className={styles.header}>
                <h1 className={styles.title}>Shop all products</h1>
                <p className={styles.subtitle}>{data?.products.length ?? 0} products available</p>
            </div>

            {isFetching && (
                <div className={styles.grid}>
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className={styles.cardSkeleton} />
                    ))}
                </div>
            )}

            {!isFetching && (!data || data.products.length === 0) && (
                <div className={styles.emptyState}>
                    <Package size={32} className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>No products available yet</h3>
                    <p className={styles.emptySubtitle}>Check back soon.</p>
                </div>
            )}

            {data && data.products.length > 0 && (
                <div className={styles.grid}>
                    {data.products.map((p) => {
                        const displayPrice = Number(p.salePrice ?? p.price);
                        const outOfStock = p.stockQuantity <= 0;
                        return (
                            <div key={p.id} className={styles.card}>
                                <Link to={`/product/${p.slug}`} className={styles.imageLink}>
                                    <div className={styles.imageWrap}>
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.name} className={styles.image} loading="lazy" />
                                        ) : (
                                            <Package size={28} className={styles.placeholderIcon} />
                                        )}
                                    </div>
                                </Link>
                                <div className={styles.info}>
                                    <Link to={`/product/${p.slug}`} className={styles.name}>
                                        {p.name}
                                    </Link>
                                    <div className={styles.priceRow}>
                                        <span className={styles.price}>
                                            {formatMoney(String(displayPrice), store?.currency ?? "GHS")}
                                        </span>
                                        {p.salePrice && (
                                            <span className={styles.comparePrice}>
                                                {formatMoney(p.price, store?.currency ?? "GHS")}
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={outOfStock}
                                        onClick={() =>
                                            addItem({
                                                productId: p.id,
                                                slug: p.slug,
                                                name: p.name,
                                                price: displayPrice,
                                                imageUrl: p.imageUrl ?? "",
                                            })
                                        }
                                        className={styles.addButton}
                                    >
                                        <ShoppingCart size={14} /> {outOfStock ? "Out of stock" : "Add to cart"}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}