import React from "react";
import { Helmet } from "react-helmet";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, MapPin, ShoppingCart, Calendar, Phone, Mail } from "lucide-react";
import { useCustomerDetail } from "../helpers/useCustomers";
import { Skeleton } from "../components/Skeleton";
import styles from "./dashboard.customers.[customerId].module.css";

const formatMoney = (amount: string, currency: string = "GHS") =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(
        Number(amount)
    );

const STATUS_VARIANT: Record<string, { background: string; color: string }> = {
    pending: { background: "#fef3c7", color: "#92400e" },
    paid: { background: "#d1fae5", color: "#065f46" },
    processing: { background: "#dbeafe", color: "#1e40af" },
    shipped: { background: "#e0e7ff", color: "#3730a3" },
    delivered: { background: "#d1fae5", color: "#065f46" },
    cancelled: { background: "#fee2e2", color: "#991b1b" },
};

export default function DashboardCustomerDetailPage() {
    const { customerId } = useParams<{ customerId: string }>();
    const customerNum = customerId ? parseInt(customerId, 10) : undefined;
    const { data, isFetching, error } = useCustomerDetail(customerNum);

    if (isFetching) {
        return (
            <div className={styles.dashboardCustomerDetailWrapper}>
                <Skeleton className={{ height: "40px", width: "200px", marginBottom: "24px" }} />
                <Skeleton className={{ height: "300px" }} />
            </div>
        );
    }

    if (error || !data?.customer) {
        return (
            <div className={styles.dashboardCustomerDetailWrapper}>
                <div className={styles.dashboardCustomerDetailErrorState}>
                    <h3>Customer not found</h3>
                    <p>{error instanceof Error ? error.message : "Failed to load customer details."}</p>
                    <Link to="/dashboard/customers">
                        <button
                            style={{
                                padding: "10px 20px",
                                border: "none",
                                borderRadius: "8px",
                                backgroundColor: "#7c3aed",
                                color: "#fff",
                                fontWeight: 500,
                                cursor: "pointer",
                            }}
                        >
                            ← Back to Customers
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const { customer } = data;

    return (
        <div className={styles.dashboardCustomerDetailWrapper}>
            <Helmet>
                <title>{customer.name} — Nova Commerce</title>
            </Helmet>

            <div className={styles.dashboardCustomerDetailHeader}>
                <Link to="/dashboard/customers" className={styles.dashboardCustomerDetailBackLink}>
                    <ArrowLeft size={20} />
                    <span>Back to Customers</span>
                </Link>
                <h1 className={styles.dashboardCustomerDetailTitle}>{customer.name}</h1>
            </div>

            <div className={styles.dashboardCustomerDetailGrid}>
                {/* Customer Information Card */}
                <div className={styles.dashboardCustomerDetailCard}>
                    <h2 className={styles.dashboardCustomerDetailCardTitle}>
                        <User size={20} />
                        Customer Information
                    </h2>
                    <div className={styles.dashboardCustomerDetailInfoGrid}>
                        <div className={styles.dashboardCustomerDetailInfoItem}>
                            <span className={styles.dashboardCustomerDetailInfoLabel}>Email</span>
                            <span className={styles.dashboardCustomerDetailInfoValue}>{customer.email || "—"}</span>
                        </div>
                        <div className={styles.dashboardCustomerDetailInfoItem}>
                            <span className={styles.dashboardCustomerDetailInfoLabel}>Phone</span>
                            <span className={styles.dashboardCustomerDetailInfoValue}>{customer.phone || "—"}</span>
                        </div>
                        <div className={styles.dashboardCustomerDetailInfoItem}>
                            <span className={styles.dashboardCustomerDetailInfoLabel}>Total Orders</span>
                            <span className={styles.dashboardCustomerDetailInfoValue}>{customer.totalOrders}</span>
                        </div>
                        <div className={styles.dashboardCustomerDetailInfoItem}>
                            <span className={styles.dashboardCustomerDetailInfoLabel}>Total Spent</span>
                            <span className={styles.dashboardCustomerDetailInfoValue}>
                                {formatMoney(customer.totalSpent, "GHS")}
                            </span>
                        </div>
                        <div className={styles.dashboardCustomerDetailInfoItem}>
                            <span className={styles.dashboardCustomerDetailInfoLabel}>Customer Since</span>
                            <span className={styles.dashboardCustomerDetailInfoValue}>
                                {new Date(customer.createdAt).toLocaleDateString("en-GH", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Addresses Card */}
                <div className={styles.dashboardCustomerDetailCard}>
                    <h2 className={styles.dashboardCustomerDetailCardTitle}>
                        <MapPin size={20} />
                        Addresses
                    </h2>
                    {customer.addresses && customer.addresses.length > 0 ? (
                        <div className={styles.dashboardCustomerDetailAddressesList}>
                            {customer.addresses.map((address) => (
                                <div key={address.id} className={styles.dashboardCustomerDetailAddressItem}>
                                    <div className={styles.dashboardCustomerDetailAddressType}>{address.type}</div>
                                    <div className={styles.dashboardCustomerDetailAddressText}>
                                        {address.address}
                                        <br />
                                        {address.city}, {address.region} {address.country}
                                    </div>
                                    {address.isDefault && (
                                        <div className={styles.dashboardCustomerDetailAddressDefault}>
                                            ✓ Default Address
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: "#6b7280", fontSize: "14px" }}>No addresses on file.</p>
                    )}
                </div>
            </div>

            {/* Order History */}
            <div className={styles.dashboardCustomerDetailCard} style={{ marginTop: "24px" }}>
                <h2 className={styles.dashboardCustomerDetailCardTitle}>
                    <ShoppingCart size={20} />
                    Order History
                </h2>
                {customer.orders && customer.orders.length > 0 ? (
                    <table className={styles.dashboardCustomerDetailOrdersTable}>
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customer.orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <Link
                                            to={`/dashboard/orders/${order.id}`}
                                            className={styles.dashboardCustomerDetailOrderLink}
                                        >
                                            #{order.orderNumber}
                                        </Link>
                                    </td>
                                    <td>
                                        {new Date(order.createdAt).toLocaleDateString("en-GH", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </td>
                                    <td>
                                        <span
                                            className={styles.dashboardCustomerDetailBadge}
                                            style={STATUS_VARIANT[order.status] || STATUS_VARIANT.pending}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>{formatMoney(order.total, order.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ color: "#6b7280", fontSize: "14px" }}>No orders yet.</p>
                )}
            </div>
        </div>
    );
}
