package interfaceanniversary

import "anniversary-site/internal/dto"

type RepoAnniversaryInterface interface {
	Load() (dto.AnniversarySiteConfig, error)
	Save(cfg dto.AnniversarySiteConfig) (dto.AnniversarySiteConfig, error)
}
