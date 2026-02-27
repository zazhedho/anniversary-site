package repositoryanniversary

import (
	domainanniversary "anniversary-site/internal/domain/anniversary"
	"anniversary-site/internal/dto"
	interfaceanniversary "anniversary-site/internal/interfaces/anniversary"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const defaultConfigKey = "default"

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

func (r *dbRepo) Load() (dto.AnniversarySiteConfig, error) {
	if r.db == nil {
		return dto.AnniversarySiteConfig{}, errors.New("anniversary db repository is not initialized")
	}

	cfgModel := domainanniversary.AnniversarySiteConfig{}
	err := r.db.Where("config_key = ?", defaultConfigKey).First(&cfgModel).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		defaultCfg := defaultConfig()
		normalized, sanitizeErr := sanitizeConfig(defaultCfg, r.loc)
		if sanitizeErr != nil {
			return dto.AnniversarySiteConfig{}, sanitizeErr
		}

		saved, saveErr := r.saveByKey(defaultConfigKey, normalized)
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
	if _, err := r.saveByKey(defaultConfigKey, normalized); err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	return normalized, nil
}

func (r *dbRepo) Save(cfg dto.AnniversarySiteConfig) (dto.AnniversarySiteConfig, error) {
	if r.db == nil {
		return dto.AnniversarySiteConfig{}, errors.New("anniversary db repository is not initialized")
	}

	normalized, err := sanitizeConfig(cfg, r.loc)
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	return r.saveByKey(defaultConfigKey, normalized)
}

func (r *dbRepo) saveByKey(configKey string, cfg dto.AnniversarySiteConfig) (dto.AnniversarySiteConfig, error) {
	payload, err := json.Marshal(cfg)
	if err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	now := time.Now()
	payloadJSON := string(payload)

	if err := r.db.Model(&domainanniversary.AnniversarySiteConfig{}).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "config_key"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"payload":    gorm.Expr("?::jsonb", payloadJSON),
			"updated_at": now,
		}),
	}).Create(map[string]interface{}{
		"config_key": configKey,
		"payload":    gorm.Expr("?::jsonb", payloadJSON),
		"updated_at": now,
	}).Error; err != nil {
		return dto.AnniversarySiteConfig{}, err
	}

	return cfg, nil
}

var _ interfaceanniversary.RepoAnniversaryInterface = (*dbRepo)(nil)
