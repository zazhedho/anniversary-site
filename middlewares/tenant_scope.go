package middlewares

import (
	"anniversary-site/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

func TenantScopeMiddleware(defaultSlug string) gin.HandlerFunc {
	fallbackSlug := normalizeTenantSlug(defaultSlug)
	if fallbackSlug == "" {
		fallbackSlug = "default"
	}

	return func(ctx *gin.Context) {
		slug := normalizeTenantSlug(ctx.Param("slug"))
		if slug == "" {
			slug = normalizeTenantSlug(ctx.Query("tenant"))
		}
		if slug == "" {
			slug = normalizeTenantSlug(ctx.GetHeader("X-Tenant-Slug"))
		}
		if slug == "" {
			slug = slugFromHost(ctx.Request.Host)
		}
		if slug == "" {
			slug = fallbackSlug
		}

		ctx.Set(utils.CtxKeyTenant, slug)
		ctx.Next()
	}
}

func TenantSlugFromContext(ctx *gin.Context) string {
	if ctx == nil {
		return "default"
	}

	raw, exists := ctx.Get(utils.CtxKeyTenant)
	if !exists {
		return "default"
	}

	if value, ok := raw.(string); ok {
		slug := normalizeTenantSlug(value)
		if slug != "" {
			return slug
		}
	}

	return "default"
}

func normalizeTenantSlug(value string) string {
	normalized := strings.TrimSpace(strings.ToLower(value))
	if normalized == "" {
		return ""
	}

	builder := strings.Builder{}
	builder.Grow(len(normalized))
	for _, char := range normalized {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-' {
			builder.WriteRune(char)
		}
	}

	cleaned := strings.Trim(builder.String(), "-")
	if cleaned == "" {
		return ""
	}

	for strings.Contains(cleaned, "--") {
		cleaned = strings.ReplaceAll(cleaned, "--", "-")
	}

	return cleaned
}

func slugFromHost(host string) string {
	trimmed := strings.TrimSpace(strings.ToLower(host))
	if trimmed == "" {
		return ""
	}

	if idx := strings.Index(trimmed, ":"); idx >= 0 {
		trimmed = trimmed[:idx]
	}

	parts := strings.Split(trimmed, ".")
	if len(parts) < 3 {
		return ""
	}

	return normalizeTenantSlug(parts[0])
}
