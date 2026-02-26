package interfaceaudit

import domainaudit "anniversary-site/internal/domain/audit"

type ServiceAuditInterface interface {
	Store(req domainaudit.AuditEvent) error
}
