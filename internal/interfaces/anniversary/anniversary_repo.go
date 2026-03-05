package interfaceanniversary

import "anniversary-site/internal/dto"

type RepoAnniversaryInterface interface {
	LoadByTenantSlug(tenantSlug string) (dto.AnniversarySiteConfig, error)
	SaveByTenantSlug(tenantSlug string, cfg dto.AnniversarySiteConfig) (dto.AnniversarySiteConfig, error)
}
