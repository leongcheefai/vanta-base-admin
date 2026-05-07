import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { BillingPage } from "./routes/dashboard/billing";
import { DashboardHome } from "./routes/dashboard/index";
import { DashboardLayout } from "./routes/dashboard/layout";
import { SettingsPage } from "./routes/dashboard/settings";
import { ForgotPasswordPage } from "./routes/forgot-password";
import { LoginPage } from "./routes/login";
import { SignupPage } from "./routes/signup";

const DevComponentsPage = import.meta.env.DEV
  ? lazy(() => import("./routes/_dev/components"))
  : null;

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="settings" element={<SettingsPage />} />
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
