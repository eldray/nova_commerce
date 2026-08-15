import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserPlus,
  Tag,
  Truck,
  BarChart3,
  Settings,
  Store,
} from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { useMyStores } from "../helpers/useMyStores";
import { ThemeModeSwitch } from "./ThemeModeSwitch";
import { Skeleton } from "./Skeleton";
import styles from "./DashboardLayout.module.css";

const NAV_ITEMS = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "Products", to: "/dashboard/products", icon: Package },
  { label: "Orders", to: "/dashboard/orders", icon: ShoppingCart },
  { label: "Customers", to: "/dashboard/customers", icon: Users },
  { label: "Staff", to: "/dashboard/staff", icon: UserPlus },
  { label: "Coupons", to: "/dashboard/coupons", icon: Tag },
  { label: "Delivery", to: "/dashboard/delivery", icon: Truck },
  { label: "Analytics", to: "/dashboard/analytics", icon: BarChart3 },
  { 
    label: "Settings", 
    to: "/dashboard/settings", 
    icon: Settings,
    children: [
      { label: "Store Settings", to: "/dashboard/settings/store" },
      { label: "Payment Settings", to: "/dashboard/settings/payments" },
    ]
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { authState, logout } = useAuth();
  const { data, isFetching } = useMyStores();
  const location = useLocation();
  const store = data?.stores[0];

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logo}>Nova Commerce</span>
          {isFetching ? (
            <Skeleton className={styles.storeNameSkeleton} />
          ) : (
            <div className={styles.storeChip}>
              <Store size={14} />
              <span>{store?.storeName ?? "Your store"}</span>
            </div>
          )}
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.to === "/dashboard"
                ? location.pathname === "/dashboard"
                : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={styles.navLink}
                data-active={isActive}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          {authState.type === "authenticated" && (
            <>
              <span className={styles.userName}>{authState.user.displayName}</span>
              <span className={styles.roleTag}>{store?.role ?? ""}</span>
              <button className={styles.logoutButton} onClick={() => logout()}>
                Log out
              </button>
            </>
          )}
        </div>
      </aside>

      <div className={styles.contentColumn}>
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>
            {NAV_ITEMS.find((item) =>
              item.to === "/dashboard"
                ? location.pathname === "/dashboard"
                : location.pathname.startsWith(item.to)
            )?.label ?? "Dashboard"}
          </span>
          <ThemeModeSwitch />
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
};