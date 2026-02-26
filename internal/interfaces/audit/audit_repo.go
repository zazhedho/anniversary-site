package interfaceaudit

import domainaudit "anniversary-site/internal/domain/audit"

type RepoAuditInterface interface {
	Store(m domainaudit.AuditTrail) error
}
