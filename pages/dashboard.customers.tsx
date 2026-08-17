import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Users, Search } from "lucide-react";
import { useCustomers } from "../helpers/useCustomers";
import { useMyStores } from "../helpers/useMyStores";
import { Skeleton } from "../components/Skeleton";
import styles from "./dashboard.customers.module.css";

const formatMoney = (amount: string, currency: string = "GHS") =>
    new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(
        Number(amount)
    );

export default function DashboardCustomersPage() {
    const { data: storesData } = useMyStores();
    const tenantId = storesData?.stores[0]?.tenantId;
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 20;

    const { data, isFetching, error } = useCustomers(tenantId, page, limit, search || undefined);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
    };

    const totalPages = data?.totalPages || 1;

    return (
        <div className={styles.dashboardCustomersWrapper}>
            <Helmet>
                <title>Customers — Nova Commerce</title>
            </Helmet>

            <div className={styles.dashboardCustomersHeader}>
                <div>
                    <h1 className={styles.dashboardCustomersTitle}>Customers</h1>
                    <p className={styles.dashboardCustomersSubtitle}>Manage your customer relationships.</p>
                </div>
            </div>

            <form onSubmit={handleSearch} className={styles.dashboardCustomersSearch}>
                <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.dashboardCustomersSearchInput}
                />
            </form>

            {isFetching && !data && (
                <div className={styles.dashboardCustomersTableCard}>
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className={styles.dashboardRowSkeleton} />
                    ))}
                </div>
            )}

            {error && (
                <div className={styles.dashboardCustomersTableCard}>
                    <p className={styles.dashboardErrorText}>
                        {error instanceof Error ? error.message : "Failed to load customers."}
                    </p>
                </div>
            )}

            {data && data.customers.length === 0 && !isFetching && (
                <div className={styles.dashboardEmptyState}>
                    <Users size={48} className={styles.dashboardEmptyIcon} />
                    <h3 className={styles.dashboardEmptyTitle}>No customers yet</h3>
                    <p className={styles.dashboardEmptySubtitle}>
                        Customers who place orders on your storefront will appear here.
                    </p>
                </div>
            )}

            {data && data.customers.length > 0 && (
                <>
                    <div className={styles.dashboardCustomersTableCard}>
                        <table className={styles.dashboardCustomersTable}>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Orders</th>
                                    <th>Total Spent</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <Link to={`/dashboard/customers/${customer.id}`} className={styles.dashboardCustomerLink}>
                                                <span className={styles.dashboardCustomerName}>{customer.name}</span>
                                                <span className={styles.dashboardCustomerEmail}>{customer.email}</span>
                                            </Link>
                                        </td>
                                        <td className={styles.dashboardCustomerPhone}>
                                            {customer.phone || "—"}
                                        </td>
                                        <td className={styles.dashboardMutedCell}>{customer.totalOrders}</td>
                                        <td className={styles.dashboardTotalCell}>
                                            {formatMoney(customer.totalSpent, "GHS")}
                                        </td>
                                        <td className={styles.dashboardMutedCell}>
                                            {new Date(customer.createdAt).toLocaleDateString("en-GH", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className={styles.dashboardPagination}>
                            <div className={styles.dashboardPaginationInfo}>
                                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.total)} of {data.total} customers
                            </div>
                            <div className={styles.dashboardPaginationButtons}>
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{
                                        padding: "8px 16px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        backgroundColor: page === 1 ? "#f3f4f6" : "#fff",
                                        cursor: page === 1 ? "not-allowed" : "pointer",
                                        opacity: page === 1 ? 0.5 : 1,
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    style={{
                                        padding: "8px 16px",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        backgroundColor: page === totalPages ? "#f3f4f6" : "#fff",
                                        cursor: page === totalPages ? "not-allowed" : "pointer",
                                        opacity: page === totalPages ? 0.5 : 1,
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
