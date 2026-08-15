import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlobalContextProviders } from "./components/_globalContextProviders";

import HomePage from "./pages/_index";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import OnboardingBusinessInfoPage from "./pages/onboarding.business-info";
import DashboardPage from "./pages/dashboard";
import DashboardOrdersPage from "./pages/dashboard.orders";
import DashboardProductsPage from "./pages/dashboard.products";
import DashboardProductsNewPage from "./pages/dashboard.products.new";
import ShopPage from "./pages/shop";
import CategoriesPage from "./pages/categories";
import AboutPage from "./pages/about";
import CartPage from "./pages/cart";
import CheckoutPage from "./pages/checkout";
import OrderConfirmationPage from "./pages/order-confirmation";

import { StorefrontLayout } from "./components/StorefrontLayout";
import { AuthLayout } from "./components/AuthLayout";
import { DashboardLayout } from "./components/DashboardLayout";
import { AuthenticatedRoute } from "./components/ProtectedRoute";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalContextProviders>
      <BrowserRouter>
        <Routes>
          {/* Storefront routes */}
          <Route path="/" element={<StorefrontLayout><HomePage /></StorefrontLayout>} />
          <Route path="/shop" element={<StorefrontLayout><ShopPage /></StorefrontLayout>} />
          <Route path="/categories" element={<StorefrontLayout><CategoriesPage /></StorefrontLayout>} />
          <Route path="/about" element={<StorefrontLayout><AboutPage /></StorefrontLayout>} />
          <Route path="/cart" element={<StorefrontLayout><CartPage /></StorefrontLayout>} />
          <Route path="/checkout" element={<StorefrontLayout><CheckoutPage /></StorefrontLayout>} />
          <Route path="/order-confirmation" element={<StorefrontLayout><OrderConfirmationPage /></StorefrontLayout>} />

          {/* Auth routes */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />

          {/* Onboarding */}
          <Route
            path="/onboarding/business-info"
            element={
              <AuthenticatedRoute>
                <AuthLayout>
                  <OnboardingBusinessInfoPage />
                </AuthLayout>
              </AuthenticatedRoute>
            }
          />

          {/* Dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <AuthenticatedRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/dashboard/orders"
            element={
              <AuthenticatedRoute>
                <DashboardLayout>
                  <DashboardOrdersPage />
                </DashboardLayout>
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/dashboard/products"
            element={
              <AuthenticatedRoute>
                <DashboardLayout>
                  <DashboardProductsPage />
                </DashboardLayout>
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/dashboard/products/new"
            element={
              <AuthenticatedRoute>
                <DashboardLayout>
                  <DashboardProductsNewPage />
                </DashboardLayout>
              </AuthenticatedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </GlobalContextProviders>
  </React.StrictMode>
);
