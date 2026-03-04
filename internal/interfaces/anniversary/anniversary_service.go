package interfaceanniversary

import "anniversary-site/internal/dto"

type ServiceAnniversaryInterface interface {
	GetPublicPayload(tenantSlug, language string) (dto.AnniversaryPublicPayload, error)
	GetPublicMoments(tenantSlug, language string) ([]dto.AnniversaryMomentView, error)
	GetSetupConfig(tenantSlug string) (dto.AnniversarySiteConfig, error)
	UpdateConfig(tenantSlug string, req dto.AnniversarySiteConfig) (dto.AnniversaryPublicPayload, error)
	ReplaceMoments(tenantSlug string, req []dto.AnniversaryMoment) ([]dto.AnniversaryMoment, error)
	AddMoment(tenantSlug string, req dto.AnniversaryMoment) ([]dto.AnniversaryMoment, error)
	DeleteMoment(tenantSlug string, year int) ([]dto.AnniversaryMoment, error)
}
