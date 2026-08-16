import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Package, User, CreditCard, Clock, CheckCircle } from "lucide-react";
import { useOrderDetail, useUpdateOrderStatus } from "../helpers/useOrders";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import styles from "./dashboard.orders.[orderId].module.css";

const formatMoney = (amount: string, currency: string) =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(
        Number(amount)
    );

const STATUS_OPTIONS: Array<{ value: string; label: string; icon: React.ReactNode }> = [
    { value: "pending", label: "Pending", icon: <Clock size={16} /> },
    { value: "processing", label: "Processing", icon: <Package size={16} /> },
    { value: "shipped", label: "Shipped", icon: <Package size={16} /> },
    { value: "delivered", label: "Delivered", icon: <CheckCircle size={16} /> },
    { value: "cancelled", label: "Cancelled", icon: <CheckCircle size={16} /> },
];

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning" | "destructive" | "outline"> = {
    pending: "warning",
    processing: "secondary",
    shipped: "outline",
    delivered: "success",
    cancelled: "destructive",
};

export default function DashboardOrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const orderNum = orderId ? parseInt(orderId, 10) : undefined;
    const { data, isFetching, error } = useOrderDetail(orderNum);
    const updateStatus = useUpdateOrderStatus();
    const [selectedStatus, setSelectedStatus] = useState<string>("");

    React.useEffect(() => {
        if (data?.order) {
            setSelectedStatus(data.order.status);
        }
    }, [data]);

    const handleStatusUpdate = () => {
        if (!orderNum || selectedStatus === data?.order.status) return;
        updateStatus.mutate({ orderId: orderNum, status: selectedStatus });
    };

    if (isFetching) {
        return (
            <div className={styles.wrapper}>
                <Skeleton className={styles.headerSkeleton} />
                <Skeleton className={styles.contentSkeleton} />
            </div>
        );
    }

    if (error || !data?.order) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.errorState}>
                    <h3>Order not found</h3>
                    <p>{error instanceof Error ? error.message : "Failed to load order details."}</p>
                    <Link to="/dashboard/orders">
                        <Button variant="secondary">← Back to Orders</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const { order } = data;

    return (
        <div className={styles.wrapper}>
            <Helmet>
                <title>Order #{order.orderNumber} — Nova Commerce</title>
            </Helmet>

            <div className={styles.header}>
                <Link to="/dashboard/orders" className={styles.backLink}>
                    <ArrowLeft size={20} />
                    <span>Back to Orders</span>
                </Link>
                <div className={styles.headerActions}>
                    <h1 className={styles.title}>Order #{order.orderNumber}</h1>
                    <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"} className={styles.statusBadge}>
                        {order.status}
                    </Badge>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Order Details Card */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Order Information</h2>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Order Date</span>
                            <span className={styles.infoValue}>
                                {new Date(order.createdAt).toLocaleDateString("en-GH", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Payment Status</span>
                            <Badge variant={order.paymentStatus === "paid" ? "success" : "secondary"}>
                                {order.paymentStatus}
                            </Badge>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Total Amount</span>
                            <span className={styles.infoValue}>{formatMoney(order.total, order.currency)}</span>
                        </div>
                        {order.deliveryFee && Number(order.deliveryFee) > 0 && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Delivery Fee</span>
                                <span className={styles.infoValue}>{formatMoney(order.deliveryFee, order.currency)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Customer Details Card */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>
                        <User size={18} className={styles.cardIcon} />
                        Customer Details
                    </h2>
                    {order.customer ? (
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Name</span>
                                <span className={styles.infoValue}>{order.customer.name}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Email</span>
                                <span className={styles.infoValue}>{order.customer.email}</span>
                            </div>
                            {order.customer.phone && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Phone</span>
                                    <span className={styles.infoValue}>{order.customer.phone}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Recipient Name</span>
                                <span className={styles.infoValue}>{order.recipientName}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Phone</span>
                                <span className={styles.infoValue}>{order.recipientPhone}</span>
                            </div>
                        </div>
                    )}
                    <div className={styles.addressBox}>
                        <strong>Delivery Address:</strong>
                        <p>{order.recipientAddress}</p>
                    </div>
                </div>

                {/* Order Items Card */}
                <div className={`${styles.card} ${styles.fullWidth}`}>
                    <h2 className={styles.cardTitle}>
                        <Package size={18} className={styles.cardIcon} />
                        Order Items
                    </h2>
                    <div className={styles.itemsTable}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Variant</th>
                                    <th>Unit Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className={styles.productName}>{item.productName}</div>
                                            {item.productSlug && (
                                                <div className={styles.productSlug}>/{item.productSlug}</div>
                                            )}
                                        </td>
                                        <td>{item.variantName || "-"}</td>
                                        <td>{formatMoney(item.unitPrice, order.currency)}</td>
                                        <td>{item.quantity}</td>
                                        <td className={styles.itemTotal}>{formatMoney(item.total, order.currency)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment History Card */}
                {order.payments && order.payments.length > 0 && (
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>
                            <CreditCard size={18} className={styles.cardIcon} />
                            Payment History
                        </h2>
                        <div className={styles.paymentList}>
                            {order.payments.map((payment) => (
                                <div key={payment.id} className={styles.paymentItem}>
                                    <div className={styles.paymentInfo}>
                                        <span className={styles.paymentProvider}>{payment.provider}</span>
                                        <span className={styles.paymentAmount}>{formatMoney(payment.amount, payment.currency)}</span>
                                    </div>
                                    <div className={styles.paymentMeta}>
                                        <Badge variant={payment.status === "success" ? "success" : "secondary"}>
                                            {payment.status}
                                        </Badge>
                                        {payment.paidAt && (
                                            <span className={styles.paymentDate}>
                                                {new Date(payment.paidAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    {payment.transactionRef && (
                                        <div className={styles.paymentRef}>Ref: {payment.transactionRef}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Update Status Card */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Update Order Status</h2>
                    <div className={styles.statusSelector}>
                        {STATUS_OPTIONS.map((option) => (
                            <label key={option.value} className={styles.statusOption}>
                                <input
                                    type="radio"
                                    name="status"
                                    value={option.value}
                                    checked={selectedStatus === option.value}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                />
                                <span className={styles.statusRadioContent}>
                                    {option.icon}
                                    <span>{option.label}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                    <Button
                        onClick={handleStatusUpdate}
                        disabled={updateStatus.isPending || selectedStatus === data?.order.status}
                        className={styles.updateButton}
                    >
                        {updateStatus.isPending ? "Updating..." : "Update Status"}
                    </Button>
                    {updateStatus.isSuccess && (
                        <p className={styles.successMessage}>Status updated successfully!</p>
                    )}
                    {updateStatus.isError && (
                        <p className={styles.errorMessage}>Failed to update status. Please try again.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
