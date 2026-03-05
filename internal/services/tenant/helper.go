package servicetenant

import (
	domaintenant "anniversary-site/internal/domain/tenant"
	"anniversary-site/internal/dto"
	"anniversary-site/utils"
	"errors"
	"strconv"
	"strings"
)

var (
	ErrTenantForbidden    = errors.New("access denied to tenant")
	ErrTenantSlugTaken    = errors.New("tenant slug already exists")
	ErrTenantSlugLocked   = errors.New("tenant slug can only be set once")
	ErrTenantLimitReached = errors.New("tenant quota exceeded for current plan")
)

const (
	defaultTenantPlan       = "free"
	defaultTenantPlanLimits = "free:1,starter:2,pro:5"
)

type tenantPlanConfig struct {
	defaultPlan string
	limits      map[string]int
	overrides   map[string]string
}

func loadTenantPlanConfig() tenantPlanConfig {
	limits := parsePlanLimits(utils.GetEnv("SAAS_TENANT_PLAN_LIMITS", defaultTenantPlanLimits))
	defaultPlan := strings.TrimSpace(strings.ToLower(utils.GetEnv("SAAS_TENANT_DEFAULT_PLAN", defaultTenantPlan)))
	if _, ok := limits[defaultPlan]; !ok {
		defaultPlan = defaultTenantPlan
	}
	if _, ok := limits[defaultPlan]; !ok {
		limits[defaultPlan] = 1
	}

	return tenantPlanConfig{
		defaultPlan: defaultPlan,
		limits:      limits,
		overrides:   parsePlanOverrides(utils.GetEnv("SAAS_TENANT_PLAN_OVERRIDES", ""), limits),
	}
}

func parsePlanLimits(raw string) map[string]int {
	limits := map[string]int{
		"free":    1,
		"starter": 2,
		"pro":     5,
	}

	for _, item := range strings.Split(raw, ",") {
		parts := strings.Split(strings.TrimSpace(item), ":")
		if len(parts) != 2 {
			continue
		}

		plan := strings.ToLower(strings.TrimSpace(parts[0]))
		if plan == "" {
			continue
		}

		limit, err := strconv.Atoi(strings.TrimSpace(parts[1]))
		if err != nil {
			continue
		}
		limits[plan] = limit
	}

	return limits
}

func parsePlanOverrides(raw string, allowedPlans map[string]int) map[string]string {
	overrides := make(map[string]string)

	for _, item := range strings.Split(raw, ",") {
		parts := strings.Split(strings.TrimSpace(item), ":")
		if len(parts) != 2 {
			continue
		}

		identity := strings.ToLower(strings.TrimSpace(parts[0]))
		plan := strings.ToLower(strings.TrimSpace(parts[1]))
		if identity == "" || plan == "" {
			continue
		}
		if _, ok := allowedPlans[plan]; !ok {
			continue
		}
		overrides[identity] = plan
	}

	return overrides
}

func resolvePlanForUser(cfg tenantPlanConfig, userID, email string) string {
	normalizedUserID := strings.ToLower(strings.TrimSpace(userID))
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))

	if plan, ok := cfg.overrides[normalizedUserID]; ok {
		return plan
	}
	if plan, ok := cfg.overrides[normalizedEmail]; ok {
		return plan
	}
	return cfg.defaultPlan
}

func (s *TenantService) ensureTenantReadable(tenantID, actorUserID string, hasAccessAll bool) error {
	if hasAccessAll {
		return nil
	}
	isMember, err := s.TenantRepo.IsTenantMember(tenantID, actorUserID)
	if err != nil {
		return err
	}
	if !isMember {
		return ErrTenantForbidden
	}
	return nil
}

func (s *TenantService) ensureTenantManageable(tenantID, actorUserID string, hasAccessAll bool) error {
	if hasAccessAll {
		return nil
	}
	isOwner, err := s.TenantRepo.IsTenantOwner(tenantID, actorUserID)
	if err != nil {
		return err
	}
	if !isOwner {
		return ErrTenantForbidden
	}
	return nil
}

func toTenantListItem(tenant domaintenant.Tenant, memberCount int64) dto.TenantListItem {
	return dto.TenantListItem{
		ID:          tenant.ID,
		Slug:        tenant.Slug,
		Name:        tenant.Name,
		Status:      tenant.Status,
		MemberCount: memberCount,
		CreatedAt:   tenant.CreatedAt,
		UpdatedAt:   tenant.UpdatedAt,
	}
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
	for strings.Contains(cleaned, "--") {
		cleaned = strings.ReplaceAll(cleaned, "--", "-")
	}
	if len(cleaned) < 3 || len(cleaned) > 100 {
		return ""
	}
	return cleaned
}

func normalizeTenantStatus(status string) string {
	value := strings.TrimSpace(strings.ToLower(status))
	if value == "suspended" {
		return "suspended"
	}
	return "active"
}

func normalizeMemberType(memberType string) string {
	value := strings.TrimSpace(strings.ToLower(memberType))
	if value == "owner" {
		return "owner"
	}
	return "member"
}
