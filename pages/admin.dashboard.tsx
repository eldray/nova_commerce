import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import styles from "./admin.dashboard.module.css";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  status: "draft" | "published" | "suspended";
  plan: "free" | "starter" | "growth" | "enterprise";
  createdAt: string;
  ownerEmail: string;
  productCount: number;
  orderCount: number;
  revenueTotal: number;
}

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

async function fetchPlatformStats(): Promise<PlatformStats> {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

async function fetchTenants(): Promise<Tenant[]> {
  const res = await fetch("/api/admin/tenants");
  if (!res.ok) throw new Error("Failed to fetch tenants");
  return res.json();
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchPlatformStats,
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: fetchTenants,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredTenants = tenants?.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (statsLoading || tenantsLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading platform data...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Platform Administration</h1>
          <p className={styles.subtitle}>Nova Commerce SaaS Dashboard</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnSecondary}>Export Report</button>
          <button className={styles.btnPrimary}>Add Manual Tenant</button>
        </div>
      </header>

      {/* Stats Overview */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🏪</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats?.totalTenants ?? 0}</div>
            <div className={styles.statLabel}>Total Stores</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats?.activeTenants ?? 0}</div>
            <div className={styles.statLabel}>Active Stores</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              GH₵ {(stats?.totalRevenue ?? 0).toLocaleString()}
            </div>
            <div className={styles.statLabel}>Platform Revenue</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats?.totalOrders ?? 0}</div>
            <div className={styles.statLabel}>Total Orders</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🛍️</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats?.totalProducts ?? 0}</div>
            <div className={styles.statLabel}>Total Products</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats?.totalCustomers ?? 0}</div>
            <div className={styles.statLabel}>Total Customers</div>
          </div>
        </div>
      </section>

      {/* Tenants Table */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>All Stores</h2>
          <input
            type="text"
            placeholder="Search stores..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Slug</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Products</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants?.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <strong>{tenant.name}</strong>
                  </td>
                  <td>
                    <code className={styles.slug}>{tenant.slug}</code>
                  </td>
                  <td>{tenant.ownerEmail}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        styles[`badge${tenant.status}`]
                      }`}
                    >
                      {tenant.status}
                    </span>
                  </td>
                  <td>
                    <span className={styles.planBadge}>{tenant.plan}</span>
                  </td>
                  <td>{tenant.productCount}</td>
                  <td>{tenant.orderCount}</td>
                  <td>GH₵ {tenant.revenueTotal.toLocaleString()}</td>
                  <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <a
                        href={`https://${tenant.slug}.novacommerce.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.btnLink}
                      >
                        Visit
                      </a>
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className={styles.btnLink}
                      >
                        Manage
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTenants?.length === 0 && (
            <div className={styles.emptyState}>
              <p>No stores found</p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickActions}>
          <Link href="/admin/tenants" className={styles.actionCard}>
            <div className={styles.actionIcon}>🏪</div>
            <h3>Manage Stores</h3>
            <p>View and manage all tenant stores</p>
          </Link>

          <Link href="/admin/users" className={styles.actionCard}>
            <div className={styles.actionIcon}>👥</div>
            <h3>User Management</h3>
            <p>Manage platform users and roles</p>
          </Link>

          <Link href="/admin/billing" className={styles.actionCard}>
            <div className={styles.actionIcon}>💳</div>
            <h3>Billing & Plans</h3>
            <p>Configure subscription plans</p>
          </Link>

          <Link href="/admin/settings" className={styles.actionCard}>
            <div className={styles.actionIcon}>⚙️</div>
            <h3>Platform Settings</h3>
            <p>Configure platform-wide settings</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
