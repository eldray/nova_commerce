import React from "react";
import { Helmet } from "react-helmet";
import { ShoppingCart } from "lucide-react";
import { useMyStores } from "../helpers/useMyStores";
import { useOrders } from "../helpers/useOrders";
import { Badge } from "../components/Badge";
import { Skeleton } from "../components/Skeleton";
import styles from "./dashboard.orders.module.css";

const formatMoney = (amount: string, currency: string) =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(
        Number(amount)
    );

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning" | "destructive" | "outline"> = {
    pending: "warning",
    paid: "secondary",
    processing: "secondary",
    shipped: "outline",
    delivered: "success",
    cancelled: "destructive",
};

export default function DashboardOrdersPage() {
    const { data: storesData } = useMyStores();
    const tenantId = storesData?.stores[0]?.tenantId;
    const { data, isFetching, error } = useOrders(tenantId);

    return (
        <div className={styles.wrapper}>
            <Helmet>
                <title>Orders — Nova Commerce</title>
            </Helmet>
            <div className={styles.header}>
                <h1 className={styles.title}>Orders</h1>
                <p className={styles.subtitle}>Track and fulfil customer orders.</p>
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
                    <p className={styles.errorText}>{error instanceof Error ? error.message : "Failed to load orders."}</p>
                </div>
            )}

            {data && data.orders.length === 0 && !isFetching && (
                <div className={styles.emptyState}>
                    <ShoppingCart size={32} className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>No orders yet</h3>
                    <p className={styles.emptySubtitle}>Orders placed on your storefront will show up here.</p>
                </div>
            )}

            {data && data.orders.length > 0 && (
                <div className={styles.tableCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.orders.map((o) => (
                                <tr key={o.id}>
                                    <td>
                                        <div className={styles.orderNumber}>{o.orderNumber}</div>
                                        <div className={styles.orderDate}>
                                            {new Date(o.createdAt).toLocaleDateString("en-GH", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </div>
                                    </td>
                                    <td>{o.recipientName}</td>
                                    <td className={styles.mutedCell}>{o.itemCount}</td>
                                    <td className={styles.totalCell}>{formatMoney(o.total, o.currency)}</td>
                                    <td>
                                        <Badge variant={o.paymentStatus === "paid" ? "success" : "secondary"} className={styles.badge}>
                                            {o.paymentStatus}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge variant={STATUS_VARIANT[o.status] ?? "secondary"} className={styles.badge}>
                                            {o.status}
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