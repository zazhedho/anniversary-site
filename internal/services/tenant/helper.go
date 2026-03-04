package servicetenant

import (
	domaintenant "anniversary-site/internal/domain/tenant"
	"anniversary-site/internal/dto"
	"errors"
	"strings"
)

var (
	ErrTenantForbidden  = errors.New("access denied to tenant")
	ErrTenantSlugTaken  = errors.New("tenant slug already exists")
	ErrTenantSlugLocked = errors.New("tenant slug can only be set once")
)

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
