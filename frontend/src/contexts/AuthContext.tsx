import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { changePassword, getMe, getMyPermissions, login, logout, updateProfile } from "../services/authService";
import { hasToken } from "../services/api";
import type { AuthUser, ChangePasswordPayload, LoginPayload, UpdateProfilePayload } from "../types/auth";
import type { PermissionAccess, PermissionGrant } from "../types/permission";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAccess: (access: PermissionAccess) => boolean;
  hasAnyAccess: (accesses: PermissionAccess[]) => boolean;
  loginUser: (payload: LoginPayload) => Promise<void>;
  logoutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCurrentUser: (payload: UpdateProfilePayload) => Promise<void>;
  changeCurrentPassword: (payload: ChangePasswordPayload) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissionGrants, setPermissionGrants] = useState<PermissionGrant[]>([]);
  const [loading, setLoading] = useState(true);

  const normalize = (value: string) => value.trim().toLowerCase();
  const accessKey = (resource: string, action: string) => `${normalize(resource)}:${normalize(action)}`;

  const loadCurrentUser = async () => {
    const [profile, grants] = await Promise.all([getMe(), getMyPermissions()]);
    setUser(profile);
    setPermissionGrants(grants);
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
        }
      } catch {
        if (mounted) {
          setUser(null);
          setPermissionGrants([]);
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
        loginUser: async (payload: LoginPayload) => {
          await login(payload);
          await loadCurrentUser();
        },
        logoutUser: async () => {
          await logout();
          setUser(null);
          setPermissionGrants([]);
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
    [user, permissionGrants, loading]
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
