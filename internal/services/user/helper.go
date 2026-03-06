package serviceuser

import (
	domaintenant "anniversary-site/internal/domain/tenant"
	domainuser "anniversary-site/internal/domain/user"
	interfacerole "anniversary-site/internal/interfaces/role"
	"anniversary-site/utils"
	"errors"
	"regexp"
	"strings"
	"time"
)

var (
	ErrGoogleNotConfigured = errors.New("google login is not configured")
	ErrGoogleTokenInvalid  = errors.New("invalid google token")
	ErrGoogleEmailMissing  = errors.New("google account email is not available")
	ErrTenantSlugRequired  = errors.New("tenant slug is required for first-time google login")
)

func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	if !hasLower {
		return errors.New("password must contain at least 1 lowercase letter (a-z)")
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	if !hasUpper {
		return errors.New("password must contain at least 1 uppercase letter (A-Z)")
	}

	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	if !hasNumber {
		return errors.New("password must contain at least 1 number (0-9)")
	}

	hasSymbol := regexp.MustCompile(`[^a-zA-Z0-9]`).MatchString(password)
	if !hasSymbol {
		return errors.New("password must contain at least 1 symbol (!@#$%^&*...)")
	}

	return nil
}

func buildUserAuthResponse(user domainuser.Users, permissions []string) map[string]interface{} {
	if permissions == nil {
		permissions = []string{}
	}

	return map[string]interface{}{
		"id":          user.Id,
		"name":        user.Name,
		"email":       user.Email,
		"phone":       user.Phone,
		"role":        user.Role,
		"permissions": permissions,
		"created_at":  user.CreatedAt,
		"updated_at":  user.UpdatedAt,
	}
}

func findRoleIDByName(roleRepo interfacerole.RepoRoleInterface, roleName string) (*string, bool) {
	roleEntity, err := roleRepo.GetByName(roleName)
	if err != nil || roleEntity.Id == "" {
		return nil, false
	}

	return &roleEntity.Id, true
}

func sanitizeTenantSlug(value string) string {
	normalized := strings.TrimSpace(strings.ToLower(value))
	if normalized == "" {
		return ""
	}

	cleaned := regexp.MustCompile(`[^a-z0-9-]+`).ReplaceAllString(normalized, "-")
	cleaned = regexp.MustCompile(`-{2,}`).ReplaceAllString(cleaned, "-")
	cleaned = strings.Trim(cleaned, "-")
	if cleaned == "" {
		return ""
	}
	if len(cleaned) > 100 {
		cleaned = strings.Trim(cleaned[:100], "-")
	}
	if len(cleaned) < 3 {
		return ""
	}
	return cleaned
}

func defaultTenantFromUser(user domainuser.Users, slug string, now time.Time) domaintenant.Tenant {
	return domaintenant.Tenant{
		ID:        utils.CreateUUID(),
		Slug:      slug,
		Name:      user.Name,
		Status:    "active",
		CreatedAt: now,
		UpdatedAt: &now,
	}
}

func defaultTenantOwnerMember(tenantID, userID string, now time.Time) domaintenant.TenantMember {
	return domaintenant.TenantMember{
		ID:         utils.CreateUUID(),
		TenantID:   tenantID,
		UserID:     userID,
		MemberType: "owner",
		CreatedAt:  now,
		UpdatedAt:  &now,
	}
}
