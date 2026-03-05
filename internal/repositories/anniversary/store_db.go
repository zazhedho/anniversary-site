package repositoryanniversary

import (
	domainanniversary "anniversary-site/internal/domain/anniversary"
	"anniversary-site/internal/dto"
	interfaceanniversary "anniversary-site/internal/interfaces/anniversary"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	defaultConfigKey   = "default"
	defaultTenantSlug  = "default"
	defaultTenantID    = "00000000-0000-0000-0000-000000000001"
	defaultEditionYear = 1
)

type dbRepo struct {
	db  *gorm.DB
	loc *time.Location
}

func NewAnniversaryDBRepo(db *gorm.DB, loc *time.Location) interfaceanniversary.RepoAnniversaryInterface {
	if loc == nil {
		loc = time.FixedZone("WIB", 7*60*60)
	}

	return &dbRepo{
		db:  db,
		loc: loc,
	}
}

func (r *dbRepo) LoadByTenantSlug(tenantSlug string) (dto.AnniversarySiteConfig, error) {
	if r.db == nil {
		return dto.AnniversarySiteConfig{}, errors.New("anniversary db repository is not initialized")
	}

	tenantID, _, err := r.resolveTenantIDBySlug(tenantSlug)
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	cfgModel := domainanniversary.AnniversarySiteConfig{}
	err = r.db.Where("tenant_id = ? AND edition_year = ?", tenantID, defaultEditionYear).First(&cfgModel).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		baseCfg := defaultConfig()
		templateCfg, templateErr := r.loadDefaultTemplateConfig()
		if templateErr == nil {
			baseCfg = templateCfg
		} else if !errors.Is(templateErr, gorm.ErrRecordNotFound) {
			return dto.AnniversarySiteConfig{}, templateErr
		}

		normalized, sanitizeErr := sanitizeConfig(baseCfg, r.loc)
		if sanitizeErr != nil {
			return dto.AnniversarySiteConfig{}, sanitizeErr
		}

		saved, saveErr := r.saveByTenantID(tenantID, normalized)
		if saveErr != nil {
			return dto.AnniversarySiteConfig{}, saveErr
		}

		return saved, nil
	}
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	cfg := dto.AnniversarySiteConfig{}
	if err := json.Unmarshal(cfgModel.Payload, &cfg); err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	normalized, err := sanitizeConfig(cfg, r.loc)
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	// Keep DB payload normalized without requiring explicit setup update call.
	if _, err := r.saveByTenantID(tenantID, normalized); err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	return normalized, nil
}

func (r *dbRepo) loadDefaultTemplateConfig() (dto.AnniversarySiteConfig, error) {
	cfgModel := domainanniversary.AnniversarySiteConfig{}
	if err := r.db.Where("tenant_id = ? AND edition_year = ?", defaultTenantID, defaultEditionYear).First(&cfgModel).Error; err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	cfg := dto.AnniversarySiteConfig{}
	if err := json.Unmarshal(cfgModel.Payload, &cfg); err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	return cfg, nil
}

func (r *dbRepo) SaveByTenantSlug(tenantSlug string, cfg dto.AnniversarySiteConfig) (dto.AnniversarySiteConfig, error) {
	if r.db == nil {
		return dto.AnniversarySiteConfig{}, errors.New("anniversary db repository is not initialized")
	}

	tenantID, _, err := r.resolveTenantIDBySlug(tenantSlug)
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	normalized, err := sanitizeConfig(cfg, r.loc)
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	return r.saveByTenantID(tenantID, normalized)
}

func (r *dbRepo) saveByTenantID(tenantID string, cfg dto.AnniversarySiteConfig) (dto.AnniversarySiteConfig, error) {
	payload, err := json.Marshal(cfg)
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	now := time.Now()
	payloadJSON := string(payload)
	entity := domainanniversary.AnniversarySiteConfig{
		TenantID:    tenantID,
		EditionYear: defaultEditionYear,
		ConfigKey:   defaultConfigKey,
		Payload:     json.RawMessage(payload),
		UpdatedAt:   &now,
	}

	if err := r.db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "tenant_id"}, {Name: "edition_year"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"config_key": defaultConfigKey,
			"payload":    gorm.Expr("?::jsonb", payloadJSON),
			"updated_at": now,
		}),
	}).Create(&entity).Error; err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	return cfg, nil
}

func (r *dbRepo) resolveTenantIDBySlug(tenantSlug string) (string, string, error) {
	normalizedSlug := normalizeTenantSlug(tenantSlug)
	if normalizedSlug == "" {
		normalizedSlug = defaultTenantSlug
	}

	if normalizedSlug == defaultTenantSlug {
		_ = r.ensureDefaultTenant()
	}

	tenant := domainanniversary.Tenant{}
	err := r.db.Where("slug = ?", normalizedSlug).First(&tenant).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return "", "", fmt.Errorf("%w: tenant slug %s", gorm.ErrRecordNotFound, normalizedSlug)
	}
	if err != nil {
		return "", "", err
	}

	return tenant.ID, normalizedSlug, nil
}

func (r *dbRepo) ensureDefaultTenant() error {
	now := time.Now()
	return r.db.Table("tenants").Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"slug":       defaultTenantSlug,
			"name":       "Default Tenant",
			"status":     "active",
			"updated_at": now,
		}),
	}).Create(map[string]interface{}{
		"id":         defaultTenantID,
		"slug":       defaultTenantSlug,
		"name":       "Default Tenant",
		"status":     "active",
		"created_at": now,
		"updated_at": now,
	}).Error
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

var _ interfaceanniversary.RepoAnniversaryInterface = (*dbRepo)(nil)
