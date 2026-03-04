package domainanniversary

import (
	"encoding/json"
	"time"
)

func (AnniversarySiteConfig) TableName() string {
	return "anniversary_site_configs"
}

type AnniversarySiteConfig struct {
	ID          string          `gorm:"column:id;type:uuid;default:gen_random_uuid();primaryKey"`
	TenantID    string          `gorm:"column:tenant_id;type:uuid"`
	EditionYear int             `gorm:"column:edition_year"`
	ConfigKey   string          `gorm:"column:config_key"`
	Payload     json.RawMessage `gorm:"column:payload;type:jsonb"`
	CreatedAt   time.Time       `gorm:"column:created_at"`
	UpdatedAt   *time.Time      `gorm:"column:updated_at"`
}

type Tenant struct {
	ID string `gorm:"column:id;type:uuid;primaryKey"`
}

func (Tenant) TableName() string {
	return "tenants"
}
