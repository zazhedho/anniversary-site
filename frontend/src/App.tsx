import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/common/AppLayout";
import PermissionRoute from "./components/common/PermissionRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import PublicAnniversaryPage from "./pages/anniversary/PublicAnniversaryPage";

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

export default function App() {
  return (
    <BrowserRouter>
      <LocaleProvider>
        <NotificationProvider>
          <AuthProvider>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/anniversary" replace />} />
                <Route path="/anniversary" element={<PublicAnniversaryPage />} />
                <Route path="/anniversary/game" element={<PublicAnniversaryGamePage />} />
                <Route path="/anniversary/showcase" element={<PublicAnniversaryShowcasePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route
                      path="/dashboard"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "dashboard", action: "view" }}>
                          <DashboardPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/setup/anniversary"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "dashboard", action: "view" }}>
                          <SetupAnniversaryPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/roles"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "roles", action: "list" }}>
                          <RoleListPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/roles/new"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "roles", action: "create" }}>
                          <RoleFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/roles/:id/edit"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "roles", action: "update" }}>
                          <RoleFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/menus"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "menus", action: "list" }}>
                          <MenuListPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/menus/new"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "menus", action: "create" }}>
                          <MenuFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/menus/:id/edit"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "menus", action: "update" }}>
                          <MenuFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "users", action: "list" }}>
                          <UserListPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/users/new"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "users", action: "create" }}>
                          <UserFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/users/:id/edit"
                      element={
                        <PermissionRoute requiredAccess={{ resource: "users", action: "update" }}>
                          <UserFormPage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/users/profile"
                      element={
                        <PermissionRoute anyOfAccesses={[{ resource: "profile", action: "view" }, { resource: "profile", action: "update_password" }]}>
                          <ProfilePage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <PermissionRoute anyOfAccesses={[{ resource: "profile", action: "view" }, { resource: "profile", action: "update_password" }]}>
                          <ProfilePage />
                        </PermissionRoute>
                      }
                    />
                    <Route
                      path="/change-password"
                      element={
                        <PermissionRoute anyOfAccesses={[{ resource: "profile", action: "view" }, { resource: "profile", action: "update_password" }]}>
                          <Navigate to="/profile" replace />
                        </PermissionRoute>
                      }
                    />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </NotificationProvider>
      </LocaleProvider>
    </BrowserRouter>
  );
}
