import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { TrendingUp, ShoppingCart, Users, DollarSign, Package, CheckCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMyStores } from "../helpers/useMyStores";
import { useDashboardAnalytics } from "../helpers/useAnalytics";
import { Skeleton } from "../components/Skeleton";
import { Badge } from "../components/Badge";
import styles from "./dashboard.analytics.module.css";

const formatMoney = (amount: string, currency: string = "GHS") =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(
        Number(amount)
    );

const PERIOD_OPTIONS: Array<{ value: "7d" | "30d" | "90d" | "1y"; label: string }> = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "1y", label: "Last year" },
];

export default function DashboardAnalyticsPage() {
    const { data: storesData } = useMyStores();
    const tenantId = storesData?.stores[0]?.tenantId;
    const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
    const { data, isFetching, error } = useDashboardAnalytics(tenantId, period);

    return (
        <div className={styles.wrapper}>
            <Helmet>
                <title>Analytics — Nova Commerce</title>
            </Helmet>

            <div className={styles.header}>
                <h1 className={styles.title}>Analytics</h1>
                <p className={styles.subtitle}>Track your store performance and sales.</p>
            </div>

            {/* Period Selector */}
            <div className={styles.periodSelector}>
                {PERIOD_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        className={`${styles.periodButton} ${period === option.value ? styles.active : ""}`}
                        onClick={() => setPeriod(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {isFetching && (
                <>
                    <div className={styles.metricsGrid}>
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className={styles.metricCard} />
                        ))}
                    </div>
                    <Skeleton className={styles.chartCard} />
                </>
            )}

            {error && (
                <div className={styles.errorState}>
                    <h3>Failed to load analytics</h3>
                    <p>{error instanceof Error ? error.message : "Unknown error"}</p>
                </div>
            )}

            {data && !isFetching && (
                <>
                    {/* Metrics Grid */}
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Total Revenue</div>
                            <div className={styles.metricValue}>{formatMoney(data.metrics.totalRevenue)}</div>
                            <div className={styles.metricTrend}>
                                <TrendingUp size={14} style={{ display: "inline", marginRight: 4 }} />
                                {data.metrics.totalOrders} orders
                            </div>
                        </div>

                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Total Orders</div>
                            <div className={styles.metricValue}>{data.metrics.totalOrders}</div>
                            <div className={styles.metricTrend}>
                                <ShoppingCart size={14} style={{ display: "inline", marginRight: 4 }} />
                                Avg. {Math.round(data.metrics.totalOrders / (period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365))} per day
                            </div>
                        </div>

                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Total Customers</div>
                            <div className={styles.metricValue}>{data.metrics.totalCustomers}</div>
                            <div className={styles.metricTrend}>
                                <Users size={14} style={{ display: "inline", marginRight: 4 }} />
                                Unique buyers
                            </div>
                        </div>

                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Average Order Value</div>
                            <div className={styles.metricValue}>{formatMoney(data.metrics.averageOrderValue)}</div>
                            <div className={styles.metricTrend}>
                                <DollarSign size={14} style={{ display: "inline", marginRight: 4 }} />
                                Per transaction
                            </div>
                        </div>

                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Pending Orders</div>
                            <div className={styles.metricValue}>{data.metrics.pendingOrders}</div>
                            <div className={styles.metricTrend}>
                                <Package size={14} style={{ display: "inline", marginRight: 4 }} />
                                Needs attention
                            </div>
                        </div>

                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Completed Orders</div>
                            <div className={styles.metricValue}>{data.metrics.completedOrders}</div>
                            <div className={styles.metricTrend}>
                                <CheckCircle size={14} style={{ display: "inline", marginRight: 4 }} />
                                Successfully delivered
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className={styles.chartsGrid}>
                        {/* Revenue Chart */}
                        <div className={styles.chartCard}>
                            <h2 className={styles.cardTitle}>Revenue & Orders Over Time</h2>
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.revenueByDay}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return `${date.getDate()}/${date.getMonth() + 1}`;
                                            }}
                                        />
                                        <YAxis 
                                            yAxisId="left"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => `GH₵${Number(value).toFixed(0)}`}
                                        />
                                        <YAxis 
                                            yAxisId="right"
                                            orientation="right"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip 
                                            formatter={(value: any, name: any) => {
                                                if (name === "revenue") return formatMoney(value);
                                                return [value, name];
                                            }}
                                            labelFormatter={(label) => {
                                                const date = new Date(String(label));
                                                return date.toLocaleDateString("en-GH");
                                            }}
                                        />
                                        <Legend />
                                        <Line 
                                            yAxisId="left"
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#8b5cf6" 
                                            strokeWidth={2}
                                            name="Revenue"
                                            dot={false}
                                        />
                                        <Line 
                                            yAxisId="right"
                                            type="monotone" 
                                            dataKey="orders" 
                                            stroke="#22c55e" 
                                            strokeWidth={2}
                                            name="Orders"
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className={styles.chartCard}>
                            <h2 className={styles.cardTitle}>Top Products</h2>
                            <div className={styles.productsList}>
                                {data.topProducts.length === 0 ? (
                                    <p className={styles.mutedCell}>No products sold yet</p>
                                ) : (
                                    data.topProducts.map((product, index) => (
                                        <div key={product.productId} className={styles.productItem}>
                                            <div className={styles.productInfo}>
                                                <div className={styles.productName}>
                                                    #{index + 1} {product.productName}
                                                </div>
                                                {product.productSlug && (
                                                    <div className={styles.productSlug}>/{product.productSlug}</div>
                                                )}
                                            </div>
                                            <div className={styles.productStats}>
                                                <div className={styles.quantitySold}>{product.quantitySold} sold</div>
                                                <div className={styles.revenue}>{formatMoney(product.revenue)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className={styles.recentOrdersCard}>
                        <h2 className={styles.cardTitle}>Recent Orders</h2>
                        {data.recentOrders.length === 0 ? (
                            <p className={styles.mutedCell}>No orders yet</p>
                        ) : (
                            <table className={styles.ordersTable}>
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentOrders.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <Link to={`/dashboard/orders/${order.id}`} className={styles.orderLink}>
                                                    {order.orderNumber}
                                                </Link>
                                            </td>
                                            <td>{order.customerName}</td>
                                            <td>{formatMoney(order.total)}</td>
                                            <td>
                                                <Badge 
                                                    variant={
                                                        order.status === "delivered" ? "success" :
                                                        order.status === "pending" ? "warning" :
                                                        order.status === "cancelled" ? "destructive" : "secondary"
                                                    }
                                                >
                                                    {order.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
