import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { useMyStores } from "../helpers/useMyStores";
import { useProducts } from "../helpers/useProducts";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import styles from "./dashboard.products.module.css";

const formatMoney = (amount: string, currency: string = "GHS") =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(
        Number(amount)
    );

const STATUS_VARIANT: Record<string, "success" | "secondary" | "outline"> = {
    active: "success",
    draft: "secondary",
    archived: "outline",
};

export default function DashboardProductsPage() {
    const { data: storesData } = useMyStores();
    const tenantId = storesData?.stores[0]?.tenantId;
    const { data, isFetching, error } = useProducts(tenantId);

    return (
        <div className={styles.wrapper}>
            <Helmet>
                <title>Products — Nova Commerce</title>
            </Helmet>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Products</h1>
                    <p className={styles.subtitle}>Manage your catalog, pricing, and stock.</p>
                </div>
                <Button asChild>
                    <Link to="/dashboard/products/new">
                        <Plus size={16} /> Add product
                    </Link>
                </Button>
            </div>

            {isFetching && (
                <div className={styles.tableCard}>
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className={styles.rowSkeleton} />
                    ))}
                </div>
            )}

            {error && (
                <div className={styles.tableCard}>
                    <p className={styles.errorText}>{error instanceof Error ? error.message : "Failed to load products."}</p>
                </div>
            )}

            {data && data.products.length === 0 && !isFetching && (
                <div className={styles.emptyState}>
                    <Package size={32} className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>No products yet</h3>
                    <p className={styles.emptySubtitle}>Add your first product to start selling.</p>
                    <Button asChild>
                        <Link to="/dashboard/products/new">
                            <Plus size={16} /> Add product
                        </Link>
                    </Button>
                </div>
            )}

            {data && data.products.length > 0 && (
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.products.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className={styles.productCell}>
                                            <div className={styles.thumb}>
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} alt={p.name} />
                                                ) : (
                                                    <Package size={16} />
                                                )}
                                            </div>
                                            <div>
                                                <div className={styles.productName}>{p.name}</div>
                                                {p.sku && <div className={styles.productSku}>SKU: {p.sku}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.mutedCell}>{p.categoryName ?? "—"}</td>
                                    <td>
                                        <span className={styles.price}>{formatMoney(p.price)}</span>
                                        {p.salePrice && (
                                            <span className={styles.comparePrice}>{formatMoney(p.salePrice)}</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.stockValue}>
                                            {p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0 && (
                                                <AlertTriangle size={14} className={styles.lowStockIcon} />
                                            )}
                                            {p.stockQuantity}
                                        </span>
                                    </td>
                                    <td>
                                        <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"} className={styles.statusBadge}>
                                            {p.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}