import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./components/common/AppLayout";
import PermissionRoute from "./components/common/PermissionRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import PublicAnniversaryPage from "./pages/anniversary/PublicAnniversaryPage";
import { normalizeTenantSlug } from "./utils/tenantSlug";

const PublicAnniversaryGamePage = lazy(() => import("./pages/anniversary/PublicAnniversaryGamePage"));
const PublicAnniversaryShowcasePage = lazy(() => import("./pages/anniversary/PublicAnniversaryShowcasePage"));
const SetupAnniversaryPage = lazy(() => import("./pages/anniversary/SetupAnniversaryPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const MenuFormPage = lazy(() => import("./pages/menus/MenuFormPage"));
const MenuListPage = lazy(() => import("./pages/menus/MenuListPage"));
const RoleFormPage = lazy(() => import("./pages/roles/RoleFormPage"));
const RoleListPage = lazy(() => import("./pages/roles/RoleListPage"));
const NotFoundPage = lazy(() => import("./pages/system/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("./pages/system/UnauthorizedPage"));
const ProfilePage = lazy(() => import("./pages/users/ProfilePage"));
const UserFormPage = lazy(() => import("./pages/users/UserFormPage"));
const UserListPage = lazy(() => import("./pages/users/UserListPage"));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff9f3] px-4 text-center">
      <p className="text-sm font-semibold text-[#6f332f]">Loading...</p>
    </div>
  );
}

function LegacyPathRedirect({ from, to }: { from: string; to: string }) {
  const location = useLocation();
  const suffix = location.pathname.startsWith(from) ? location.pathname.slice(from.length) : "";
  const nextPath = `${to}${suffix}` || "/";
  return <Navigate to={`${nextPath}${location.search}`} replace />;
}

export default function App() {
  const defaultTenantSlug = normalizeTenantSlug(import.meta.env.VITE_DEFAULT_PUBLIC_TENANT || "default") || "default";
  const defaultPublicPath = `/${defaultTenantSlug}`;

  return (
    <BrowserRouter>
      <LocaleProvider>
        <NotificationProvider>
          <AuthProvider>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to={defaultPublicPath} replace />} />

                <Route path="/app/login" element={<LoginPage />} />
                <Route path="/app/register" element={<RegisterPage />} />
                <Route path="/app/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/app/reset-password" element={<ResetPasswordPage />} />
                <Route path="/app/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/app" element={<Navigate to="/app/login" replace />} />

                <Route path="/login" element={<Navigate to="/app/login" replace />} />
                <Route path="/register" element={<Navigate to="/app/register" replace />} />
                <Route path="/forgot-password" element={<Navigate to="/app/forgot-password" replace />} />
                <Route path="/reset-password" element={<Navigate to="/app/reset-password" replace />} />
                <Route path="/unauthorized" element={<Navigate to="/app/unauthorized" replace />} />

                <Route path="/anniversary" element={<Navigate to={defaultPublicPath} replace />} />
                <Route path="/anniversary/game" element={<Navigate to={`${defaultPublicPath}/game`} replace />} />
                <Route path="/anniversary/showcase" element={<Navigate to={`${defaultPublicPath}/showcase`} replace />} />

                <Route path="/:slug/game" element={<PublicAnniversaryGamePage />} />
                <Route path="/:slug/showcase" element={<PublicAnniversaryShowcasePage />} />
                <Route path="/:slug" element={<PublicAnniversaryPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route
                      path="/app/dashboard"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "dashboard", action: "view" }}>
                          <DashboardPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/setup/anniversary"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "dashboard", action: "view" }}>
                          <SetupAnniversaryPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/roles"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "roles", action: "list" }}>
                          <RoleListPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/roles/new"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "roles", action: "create" }}>
                          <RoleFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/roles/:id/edit"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "roles", action: "update" }}>
                          <RoleFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/menus"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "menus", action: "list" }}>
                          <MenuListPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/menus/new"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "menus", action: "create" }}>
                          <MenuFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/menus/:id/edit"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "menus", action: "update" }}>
                          <MenuFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/users"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "users", action: "list" }}>
                          <UserListPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/users/new"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "users", action: "create" }}>
                          <UserFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/users/:id/edit"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "users", action: "update" }}>
                          <UserFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/users/profile"
                      element={
                        <PermissionRoute anyOfAccesses={[{ resource: "profile", action: "view" }, { resource: "profile", action: "update_password" }]}>
                          <ProfilePage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/profile"
                      element={
                        <PermissionRoute anyOfAccesses={[{ resource: "profile", action: "view" }, { resource: "profile", action: "update_password" }]}>
                          <ProfilePage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/app/change-password"
                      element={
                        <PermissionRoute anyOfAccesses={[{ resource: "profile", action: "view" }, { resource: "profile", action: "update_password" }]}>
                          <Navigate to="/app/profile" replace />
                        </PermissionRoute>
                      }
                    />
                  </Route>
                </Route>

                <Route path="/dashboard/*" element={<LegacyPathRedirect from="/dashboard" to="/app/dashboard" />} />
                <Route path="/setup/*" element={<LegacyPathRedirect from="/setup" to="/app/setup" />} />
                <Route path="/roles/*" element={<LegacyPathRedirect from="/roles" to="/app/roles" />} />
                <Route path="/menus/*" element={<LegacyPathRedirect from="/menus" to="/app/menus" />} />
                <Route path="/users/*" element={<LegacyPathRedirect from="/users" to="/app/users" />} />
                <Route path="/profile/*" element={<LegacyPathRedirect from="/profile" to="/app/profile" />} />
                <Route path="/change-password/*" element={<LegacyPathRedirect from="/change-password" to="/app/change-password" />} />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </NotificationProvider>
      </LocaleProvider>
    </BrowserRouter>
  );
}
