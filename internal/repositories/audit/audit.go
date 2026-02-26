package repositoryaudit

import (
	domainaudit "anniversary-site/internal/domain/audit"
	interfaceaudit "anniversary-site/internal/interfaces/audit"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewAuditRepo(db *gorm.DB) interfaceaudit.RepoAuditInterface {
	return &repo{DB: db}
}

func (r *repo) Store(m domainaudit.AuditTrail) error {
	return r.DB.Create(&m).Error
}
