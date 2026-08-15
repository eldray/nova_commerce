import React from "react";
import { Helmet } from "react-helmet";
import { Store, Users, Package, ShieldCheck } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { useMyStores } from "../helpers/useMyStores";
import { Skeleton } from "../components/Skeleton";
import { Badge } from "../components/Badge";
import { ThemeModeSwitch } from "../components/ThemeModeSwitch";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { authState, logout } = useAuth();
  const { data, isFetching, error } = useMyStores();

  const store = data?.stores[0];

  return (
    <div className={styles.wrapper}>
      <Helmet>
        <title>Dashboard — Nova Commerce</title>
      </Helmet>
      <header className={styles.header}>
        <span className={styles.logo}>Nova Commerce</span>
        <div className={styles.headerActions}>
          <ThemeModeSwitch />
          {authState.type === "authenticated" && (
            <button className={styles.logoutButton} onClick={() => logout()}>
              Log out ({authState.user.displayName})
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {isFetching && (
          <div className={styles.card}>
            <Skeleton className={styles.skeletonLine} />
            <Skeleton className={styles.skeletonLine} />
            <Skeleton className={styles.skeletonLineShort} />
          </div>
        )}

        {error && (
          <div className={styles.card}>
            <p className={styles.errorText}>{error instanceof Error ? error.message : "Failed to load your store."}</p>
          </div>
        )}

        {store && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Store size={22} />
              <div>
                <h1 className={styles.storeName}>{store.storeName}</h1>
                <span className={styles.tenantName}>{store.tenantName}</span>
              </div>
              <Badge variant={store.tenantStatus === "trial" ? "secondary" : "success"} className={styles.statusBadge}>
                {store.tenantStatus}
              </Badge>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <ShieldCheck size={16} />
                <span>Your role: <strong>{store.role}</strong></span>
              </div>
              <div className={styles.infoItem}>
                <Package size={16} />
                <span>Onboarding step: <strong>{store.onboardingStep ?? "complete"}</strong></span>
              </div>
              <div className={styles.infoItem}>
                <Users size={16} />
                <span>Store published: <strong>{store.isPublished ? "Yes" : "Not yet"}</strong></span>
              </div>
            </div>

            <p className={styles.nextUp}>
              Foundation complete: multi-tenant data model, JWT auth, and role-based access are wired up
              and isolated per store. Next up: the full merchant dashboard, product catalog, and storefront wiring.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
