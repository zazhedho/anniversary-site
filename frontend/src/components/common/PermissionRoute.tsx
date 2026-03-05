import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import type { PermissionAccess } from "../../types/permission";

type PermissionRouteProps = {
  requiredPermission?: string;
  anyOfPermissions?: string[];
  requiredAccess?: PermissionAccess;
  anyOfAccesses?: PermissionAccess[];
  children: ReactElement;
};

export default function PermissionRoute({
  requiredPermission,
  anyOfPermissions,
  requiredAccess,
  anyOfAccesses,
  children,
}: PermissionRouteProps) {
  const { loading, hasAccess, hasAnyAccess, hasPermission, hasAnyPermission } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#fff8f1] text-[#2b2220]">
        <p className="rounded-full border border-[#9c4f46]/30 px-5 py-2 text-sm uppercase tracking-[0.12em]">
          {t("guard.checkPermission")}
        </p>
      </main>
    );
  }

  const isAllowed = requiredAccess
    ? hasAccess(requiredAccess)
    : anyOfAccesses
      ? hasAnyAccess(anyOfAccesses)
      : requiredPermission
        ? hasPermission(requiredPermission)
        : anyOfPermissions
          ? hasAnyPermission(anyOfPermissions)
          : true;

  if (!isAllowed) {
    return <Navigate to="/app/unauthorized" replace />;
  }

  return children;
}
