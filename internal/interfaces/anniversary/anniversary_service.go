package interfaceanniversary

import "anniversary-site/internal/dto"

type ServiceAnniversaryInterface interface {
	GetPublicPayload() (dto.AnniversaryPublicPayload, error)
	GetPublicMoments() ([]dto.AnniversaryMomentView, error)
	GetSetupConfig() (dto.AnniversarySiteConfig, error)
	UpdateConfig(req dto.AnniversarySiteConfig) (dto.AnniversaryPublicPayload, error)
	ReplaceMoments(req []dto.AnniversaryMoment) ([]dto.AnniversaryMoment, error)
	AddMoment(req dto.AnniversaryMoment) ([]dto.AnniversaryMoment, error)
	DeleteMoment(year int) ([]dto.AnniversaryMoment, error)
}
