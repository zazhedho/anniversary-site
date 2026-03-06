import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { changePassword, getMe, getMyPermissions, login, loginWithGoogle, logout, updateProfile } from "../services/authService";
import { hasToken } from "../services/api";
import { getTenantOptions } from "../services/tenantsService";
import type { AuthUser, ChangePasswordPayload, GoogleLoginPayload, LoginPayload, UpdateProfilePayload } from "../types/auth";
import type { PermissionAccess, PermissionGrant } from "../types/permission";
import type { TenantRecord } from "../types/tenant";
import { normalizeTenantSlug } from "../utils/tenantSlug";

const ACTIVE_TENANT_STORAGE_KEY = "anniv_active_tenant_slug";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAccess: (access: PermissionAccess) => boolean;
  hasAnyAccess: (accesses: PermissionAccess[]) => boolean;
  availableTenants: TenantRecord[];
  activeTenantSlug: string;
  setActiveTenantSlug: (slug: string) => void;
  refreshTenants: () => Promise<void>;
  loginUser: (payload: LoginPayload) => Promise<void>;
  loginWithGoogleUser: (payload: GoogleLoginPayload) => Promise<void>;
  logoutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCurrentUser: (payload: UpdateProfilePayload) => Promise<void>;
  changeCurrentPassword: (payload: ChangePasswordPayload) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissionGrants, setPermissionGrants] = useState<PermissionGrant[]>([]);
  const [availableTenants, setAvailableTenants] = useState<TenantRecord[]>([]);
  const [activeTenantSlug, setActiveTenantSlugState] = useState(() => {
    return normalizeTenantSlug(localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY) || "") || "";
  });
  const [loading, setLoading] = useState(true);

  const normalize = (value: string) => value.trim().toLowerCase();
  const accessKey = (resource: string, action: string) => `${normalize(resource)}:${normalize(action)}`;

  const syncActiveTenant = (tenants: TenantRecord[]) => {
    const normalizedCurrent = normalizeTenantSlug(activeTenantSlug);
    const tenantSlugs = tenants.map((tenant) => normalizeTenantSlug(tenant.slug)).filter(Boolean);
    const fallbackSlug = tenantSlugs[0] || normalizeTenantSlug(import.meta.env.VITE_DEFAULT_PUBLIC_TENANT || "default") || "default";
    const resolvedSlug = normalizedCurrent && tenantSlugs.includes(normalizedCurrent) ? normalizedCurrent : fallbackSlug;
    setActiveTenantSlugState(resolvedSlug);
    localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, resolvedSlug);
  };

  const loadTenants = async () => {
    try {
      const tenants = await getTenantOptions();
      setAvailableTenants(tenants);
      syncActiveTenant(tenants);
    } catch {
      setAvailableTenants([]);
      const fallback = normalizeTenantSlug(import.meta.env.VITE_DEFAULT_PUBLIC_TENANT || "default") || "default";
      setActiveTenantSlugState(fallback);
      localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, fallback);
    }
  };

  const loadCurrentUser = async () => {
    const [profile, grants] = await Promise.all([getMe(), getMyPermissions()]);
    setUser(profile);
    setPermissionGrants(grants);
    await loadTenants();
  };

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!hasToken()) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const [profile, grants] = await Promise.all([getMe(), getMyPermissions()]);
        if (mounted) {
          setUser(profile);
          setPermissionGrants(grants);
          try {
            const tenants = await getTenantOptions();
            if (mounted) {
              setAvailableTenants(tenants);
              const normalizedCurrent = normalizeTenantSlug(localStorage.getItem(ACTIVE_TENANT_STORAGE_KEY) || "") || "";
              const tenantSlugs = tenants.map((tenant) => normalizeTenantSlug(tenant.slug)).filter(Boolean);
              const fallbackSlug = tenantSlugs[0] || normalizeTenantSlug(import.meta.env.VITE_DEFAULT_PUBLIC_TENANT || "default") || "default";
              const resolvedSlug = normalizedCurrent && tenantSlugs.includes(normalizedCurrent) ? normalizedCurrent : fallbackSlug;
              setActiveTenantSlugState(resolvedSlug);
              localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, resolvedSlug);
            }
          } catch {
            if (mounted) {
              setAvailableTenants([]);
            }
          }
        }
      } catch {
        if (mounted) {
          setUser(null);
          setPermissionGrants([]);
          setAvailableTenants([]);
          setActiveTenantSlugState("");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => {
      const permissionNameSet = new Set((user?.permissions || []).map(normalize));
      for (const permission of permissionGrants) {
        permissionNameSet.add(normalize(permission.name));
      }

      const permissionAccessSet = new Set(
        permissionGrants.map((permission) => accessKey(permission.resource, permission.action))
      );

      return {
        user,
        loading,
        isAuthenticated: Boolean(user),
        hasPermission: (permission: string) => permissionNameSet.has(normalize(permission)),
        hasAnyPermission: (permissions: string[]) =>
          permissions.some((permission) => permissionNameSet.has(normalize(permission))),
        hasAccess: ({ resource, action }: PermissionAccess) => permissionAccessSet.has(accessKey(resource, action)),
        hasAnyAccess: (accesses: PermissionAccess[]) =>
          accesses.some((access) => permissionAccessSet.has(accessKey(access.resource, access.action))),
        availableTenants,
        activeTenantSlug,
        setActiveTenantSlug: (slug: string) => {
          const normalized = normalizeTenantSlug(slug);
          if (!normalized) return;
          setActiveTenantSlugState(normalized);
          localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, normalized);
        },
        refreshTenants: async () => {
          await loadTenants();
        },
        loginUser: async (payload: LoginPayload) => {
          await login(payload);
          await loadCurrentUser();
        },
        loginWithGoogleUser: async (payload: GoogleLoginPayload) => {
          await loginWithGoogle(payload);
          await loadCurrentUser();
        },
        logoutUser: async () => {
          await logout();
          setUser(null);
          setPermissionGrants([]);
          setAvailableTenants([]);
          setActiveTenantSlugState("");
          localStorage.removeItem(ACTIVE_TENANT_STORAGE_KEY);
        },
        refreshUser: async () => {
          await loadCurrentUser();
        },
        updateCurrentUser: async (payload: UpdateProfilePayload) => {
          const updated = await updateProfile(payload);
          setUser((prev) => ({ ...(prev || updated), ...updated }));
        },
        changeCurrentPassword: async (payload: ChangePasswordPayload) => {
          await changePassword(payload);
        },
      };
    },
    [user, permissionGrants, loading, availableTenants, activeTenantSlug]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
