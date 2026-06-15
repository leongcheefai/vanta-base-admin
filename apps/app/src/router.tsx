import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { AdminRoute } from "./components/admin-route";
import { AdminReleasesPage } from "./routes/dashboard/admin/releases";
import { AdminRolesPage } from "./routes/dashboard/admin/roles";
import { AdminUserDetailPage } from "./routes/dashboard/admin/user-detail";
import { AdminUsersPage } from "./routes/dashboard/admin/users";
import { DashboardHome } from "./routes/dashboard/index";
import { CustomersPage } from "./routes/dashboard/customers/customers";
import { InventoryCategoriesPage } from "./routes/dashboard/inventory/categories";
import { InventoryProductDetailPage } from "./routes/dashboard/inventory/product-detail";
import { InventoryProductsPage } from "./routes/dashboard/inventory/products";
import { DashboardLayout } from "./routes/dashboard/layout";
import { SettingsPage } from "./routes/dashboard/settings";
import { ForgotPasswordPage } from "./routes/forgot-password";
import { LoginPage } from "./routes/login";

const DevComponentsPage = import.meta.env.DEV
  ? lazy(() => import("./routes/_dev/components"))
  : null;

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="inventory/products" element={<InventoryProductsPage />} />
          <Route path="inventory/products/:id" element={<InventoryProductDetailPage />} />
          <Route path="inventory/categories" element={<InventoryCategoriesPage />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <Outlet />
              </AdminRoute>
            }
          >
            <Route path="releases" element={<AdminReleasesPage />} />
            <Route path="roles" element={<AdminRolesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:id" element={<AdminUserDetailPage />} />
          </Route>
        </Route>
        {import.meta.env.DEV && DevComponentsPage && (
          <Route
            path="/_dev/components"
            element={
              <Suspense fallback={null}>
                <DevComponentsPage />
              </Suspense>
            }
          />
        )}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
