import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/common/AppLayout";
import PermissionRoute from "./components/common/PermissionRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import PublicAnniversaryPage from "./pages/anniversary/PublicAnniversaryPage";
import SetupAnniversaryPage from "./pages/anniversary/SetupAnniversaryPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import NotFoundPage from "./pages/system/NotFoundPage";
import UnauthorizedPage from "./pages/system/UnauthorizedPage";
import ProfilePage from "./pages/users/ProfilePage";
import UserFormPage from "./pages/users/UserFormPage";
import UserListPage from "./pages/users/UserListPage";

export default function App() {
  return (
    <BrowserRouter>
      <LocaleProvider>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<Navigate to="/anniversary" replace />} />
          <Route path="/anniversary" element={<PublicAnniversaryPage />} />
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
                  <PermissionRoute requiredAccess={{ resource: "profile", action: "view" }}>
                    <ProfilePage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PermissionRoute requiredAccess={{ resource: "profile", action: "view" }}>
                    <ProfilePage />
                  </PermissionRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <PermissionRoute requiredAccess={{ resource: "profile", action: "update_password" }}>
                    <ChangePasswordPage />
                  </PermissionRoute>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </LocaleProvider>
    </BrowserRouter>
  );
}
