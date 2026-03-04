const DEFAULT_PUBLIC_TENANT = normalizeTenantSlug(import.meta.env.VITE_DEFAULT_PUBLIC_TENANT || "default") || "default";
const RESERVED_ROOT_SEGMENTS = new Set([
  "app",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "unauthorized",
  "anniversary",
]);

export function normalizeTenantSlug(value?: string | null): string {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) return "";

  const cleaned = normalized
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned;
}

export function resolveTenantSlug(preferred?: string | null): string {
  const fromPreferred = normalizeTenantSlug(preferred);
  if (fromPreferred) return fromPreferred;

  const fromPath = getTenantSlugFromPath();
  if (fromPath) return fromPath;

  return DEFAULT_PUBLIC_TENANT;
}

export function getTenantSlugFromPath(pathname?: string): string {
  const sourcePath = pathname || (typeof window !== "undefined" ? window.location.pathname : "");
  const normalizedPath = sourcePath.trim();

  const parts = normalizedPath.split("/").filter(Boolean);
  if (parts.length === 0) return "";

  if (RESERVED_ROOT_SEGMENTS.has(parts[0])) return "";

  return normalizeTenantSlug(parts[0]);
}

type PublicSection = "home" | "game" | "showcase";

export function buildPublicTenantPath(tenantSlug: string | undefined, section: PublicSection = "home"): string {
  const slug = resolveTenantSlug(tenantSlug);
  const base = `/${slug}`;
  if (section === "game") return `${base}/game`;
  if (section === "showcase") return `${base}/showcase`;
  return base;
}
