package serviceuser

import (
	domainuser "anniversary-site/internal/domain/user"
	interfacerole "anniversary-site/internal/interfaces/role"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"gorm.io/gorm"
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

func slugCandidateFromNameOrEmail(name, email string) string {
	emailLocal := strings.TrimSpace(strings.ToLower(email))
	if at := strings.Index(emailLocal, "@"); at > 0 {
		emailLocal = emailLocal[:at]
	}

	base := sanitizeTenantSlug(name)
	if base == "" {
		base = sanitizeTenantSlug(emailLocal)
	}
	if base == "" {
		base = "tenant"
	}
	return base
}

func (s *ServiceUser) buildUniqueTenantSlug(name, email, userID string) (string, error) {
	if s.TenantRepo == nil {
		return "", errors.New("tenant repository is not initialized")
	}

	base := slugCandidateFromNameOrEmail(name, email)
	idSuffix := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(userID), "-", ""))
	if len(idSuffix) > 8 {
		idSuffix = idSuffix[:8]
	}
	if idSuffix != "" {
		base = sanitizeTenantSlug(base + "-" + idSuffix)
	}
	if base == "" {
		base = "tenant"
	}

	candidate := base
	index := 1
	for {
		_, err := s.TenantRepo.GetBySlug(candidate)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return candidate, nil
		}
		if err != nil {
			return "", err
		}

		index++
		next := fmt.Sprintf("%s-%d", base, index)
		candidate = sanitizeTenantSlug(next)
		if candidate == "" {
			return "", errors.New("failed to generate tenant slug")
		}
	}
}
