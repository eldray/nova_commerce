import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlobalContextProviders } from "./components/_globalContextProviders";

// Page imports
import LandingPage from "./pages/landing";
import IndexPage from "./pages/_index";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import WishlistPage from "./pages/wishlist";
import OnboardingBusinessInfoPage from "./pages/onboarding.business-info";
import OnboardingBrandingPage from "./pages/onboarding.branding";
import OnboardingStoreSettingsPage from "./pages/onboarding.store-settings";
import OnboardingPaymentSetupPage from "./pages/onboarding.payment-setup";
import OnboardingDeliverySetupPage from "./pages/onboarding.delivery-setup";
import OnboardingAddProductPage from "./pages/onboarding.add-product";
import OnboardingPreviewPage from "./pages/onboarding.preview";
import DashboardHomePage from "./pages/dashboard.home";
import DashboardOrdersPage from "./pages/dashboard.orders";
import DashboardOrderDetailPage from "./pages/dashboard.orders.[orderId]";
import DashboardCustomersPage from "./pages/dashboard.customers";
import DashboardCustomerDetailPage from "./pages/dashboard.customers.[customerId]";
import DashboardStaffPage from "./pages/dashboard.staff";
import DashboardProductsPage from "./pages/dashboard.products";
import DashboardProductsNewPage from "./pages/dashboard.products.new";
import DashboardSettingsPaymentsPage from "./pages/dashboard.settings.payments";
import DashboardSettingsStorePage from "./pages/dashboard.settings.store";
import DashboardAnalyticsPage from "./pages/dashboard.analytics";
import ShopPage from "./pages/shop";
import CategoriesPage from "./pages/categories";
import AboutPage from "./pages/about";
import CartPage from "./pages/cart";
import CheckoutPage from "./pages/checkout";
import OrderConfirmationPage from "./pages/order-confirmation";
import CustomerHomePage from "./pages/customer.home";

// Layout imports
import { StorefrontLayout } from "./components/StorefrontLayout";
import { AuthLayout } from "./components/AuthLayout";
import { DashboardLayout } from "./components/DashboardLayout";
import { AuthenticatedRoute, SuperAdminRoute } from "./components/ProtectedRoute";
import AdminDashboardPage from "./pages/admin.dashboard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalContextProviders>
      <BrowserRouter>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<IndexPage />} />

          {/* Storefront routes */}
          <Route path="/shop" element={<StorefrontLayout><ShopPage /></StorefrontLayout>} />
          <Route path="/categories" element={<StorefrontLayout><CategoriesPage /></StorefrontLayout>} />
          <Route path="/about" element={<StorefrontLayout><AboutPage /></StorefrontLayout>} />
          <Route path="/cart" element={<StorefrontLayout><CartPage /></StorefrontLayout>} />
          <Route path="/checkout" element={<StorefrontLayout><CheckoutPage /></StorefrontLayout>} />
          <Route path="/order-confirmation" element={<StorefrontLayout><OrderConfirmationPage /></StorefrontLayout>} />
          <Route path="/wishlist" element={<StorefrontLayout><WishlistPage /></StorefrontLayout>} />
          <Route path="/customer-home" element={<StorefrontLayout><CustomerHomePage /></StorefrontLayout>} />

          {/* Auth routes */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />

          {/* Onboarding wizard routes */}
          <Route path="/onboarding/business-info" element={<AuthenticatedRoute><OnboardingBusinessInfoPage /></AuthenticatedRoute>} />
          <Route path="/onboarding/branding" element={<AuthenticatedRoute><OnboardingBrandingPage /></AuthenticatedRoute>} />
          <Route path="/onboarding/store-settings" element={<AuthenticatedRoute><OnboardingStoreSettingsPage /></AuthenticatedRoute>} />
          <Route path="/onboarding/payment-setup" element={<AuthenticatedRoute><OnboardingPaymentSetupPage /></AuthenticatedRoute>} />
          <Route path="/onboarding/delivery-setup" element={<AuthenticatedRoute><OnboardingDeliverySetupPage /></AuthenticatedRoute>} />
          <Route path="/onboarding/add-product" element={<AuthenticatedRoute><OnboardingAddProductPage /></AuthenticatedRoute>} />
          <Route path="/onboarding/preview" element={<AuthenticatedRoute><OnboardingPreviewPage /></AuthenticatedRoute>} />

          {/* Dashboard routes */}
          <Route path="/dashboard" element={<AuthenticatedRoute><DashboardLayout><DashboardHomePage /></DashboardLayout></AuthenticatedRoute>} />
          <Route path="/dashboard/orders" element={<AuthenticatedRoute><DashboardLayout><DashboardOrdersPage /></DashboardLayout></AuthenticatedRoute>} />
          <Route path="/dashboard/orders/:orderId" element={<AuthenticatedRoute><DashboardLayout><DashboardOrderDetailPage /></DashboardLayout></AuthenticatedRoute>} />
          <Route path="/dashboard/customers" element={<AuthenticatedRoute><DashboardLayout><DashboardCustomersPage /></DashboardLayout></AuthenticatedRoute>} />
          <Route path="/dashboard/customers/:customerId" element={<AuthenticatedRoute><DashboardLayout><DashboardCustomerDetailPage /></DashboardLayout></AuthenticatedRoute>} />
          <Route path="/dashboard/staff" element={<AuthenticatedRoute><DashboardLayout><DashboardStaffPage /></DashboardLayout></AuthenticatedRoute>} />
          <Route path="/dashboard/products" element={<AuthenticatedRoute><DashboardLayout><DashboardProductsPage /></DashboardLayout></AuthenticatedRoute>} />
          <Route path="/dashboard/products/new" element={<AuthenticatedRoute><DashboardLayout><DashboardProductsNewPage /></DashboardLayout></AuthenticatedRoute>} />
          <Route path="/dashboard/settings/payments" element={<AuthenticatedRoute><DashboardLayout><DashboardSettingsPaymentsPage /></DashboardLayout></AuthenticatedRoute>} />
          <Route path="/dashboard/settings/store" element={<AuthenticatedRoute><DashboardLayout><DashboardSettingsStorePage /></DashboardLayout></AuthenticatedRoute>} />
          <Route path="/dashboard/analytics" element={<AuthenticatedRoute><DashboardLayout><DashboardAnalyticsPage /></DashboardLayout></AuthenticatedRoute>} />

          {/* Super admin routes */}
          <Route path="/admin" element={<SuperAdminRoute><AdminDashboardPage /></SuperAdminRoute>} />
        </Routes>
      </BrowserRouter>
    </GlobalContextProviders>
  </React.StrictMode>
);
