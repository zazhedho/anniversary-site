package serviceanniversary

import (
	"anniversary-site/internal/dto"
	interfaceanniversary "anniversary-site/internal/interfaces/anniversary"
	"time"
)

type Service struct {
	Repo interfaceanniversary.RepoAnniversaryInterface
	Loc  *time.Location
}

func NewAnniversaryService(repo interfaceanniversary.RepoAnniversaryInterface, loc *time.Location) *Service {
	if loc == nil {
		loc = time.FixedZone("WIB", 7*60*60)
	}

	return &Service{
		Repo: repo,
		Loc:  loc,
	}
}

func (s *Service) GetPublicPayload(language string) (dto.AnniversaryPublicPayload, error) {
	cfg, err := s.Repo.Load()
	if err != nil {
		return dto.AnniversaryPublicPayload{}, newServiceError(ErrLoadConfig, err)
	}

	payload, err := BuildPublicPayload(cfg, time.Now(), s.Loc, language)
	if err != nil {
		return dto.AnniversaryPublicPayload{}, err
	}

	return payload, nil
}

func (s *Service) GetPublicMoments(language string) ([]dto.AnniversaryMomentView, error) {
	payload, err := s.GetPublicPayload(language)
	if err != nil {
		return nil, err
	}

	return payload.Moments, nil
}

func (s *Service) GetSetupConfig() (dto.AnniversarySiteConfig, error) {
	cfg, err := s.Repo.Load()
	if err != nil {
		return dto.AnniversarySiteConfig{}, newServiceError(ErrLoadConfig, err)
	}

	return cfg, nil
}

func (s *Service) UpdateConfig(req dto.AnniversarySiteConfig) (dto.AnniversaryPublicPayload, error) {
	saved, err := s.Repo.Save(req)
	if err != nil {
		return dto.AnniversaryPublicPayload{}, newServiceError(ErrSaveConfig, err)
	}

	payload, err := BuildPublicPayload(saved, time.Now(), s.Loc, "id")
	if err != nil {
		return dto.AnniversaryPublicPayload{}, err
	}

	return payload, nil
}

func (s *Service) ReplaceMoments(req []dto.AnniversaryMoment) ([]dto.AnniversaryMoment, error) {
	cfg, err := s.Repo.Load()
	if err != nil {
		return nil, newServiceError(ErrLoadConfig, err)
	}

	cfg.Moments = req
	saved, err := s.Repo.Save(cfg)
	if err != nil {
		return nil, newServiceError(ErrSaveConfig, err)
	}

	return saved.Moments, nil
}

func (s *Service) AddMoment(req dto.AnniversaryMoment) ([]dto.AnniversaryMoment, error) {
	cfg, err := s.Repo.Load()
	if err != nil {
		return nil, newServiceError(ErrLoadConfig, err)
	}

	cfg.Moments = append(cfg.Moments, req)
	saved, err := s.Repo.Save(cfg)
	if err != nil {
		return nil, newServiceError(ErrSaveConfig, err)
	}

	return saved.Moments, nil
}

func (s *Service) DeleteMoment(year int) ([]dto.AnniversaryMoment, error) {
	cfg, err := s.Repo.Load()
	if err != nil {
		return nil, newServiceError(ErrLoadConfig, err)
	}

	nextMoments := make([]dto.AnniversaryMoment, 0, len(cfg.Moments))
	removed := false
	for _, item := range cfg.Moments {
		if item.Year == year {
			removed = true
			continue
		}

		nextMoments = append(nextMoments, item)
	}

	if !removed {
		return nil, ErrMomentNotFound
	}

	cfg.Moments = nextMoments
	saved, err := s.Repo.Save(cfg)
	if err != nil {
		return nil, newServiceError(ErrSaveConfig, err)
	}

	return saved.Moments, nil
}

type serviceError struct {
	kind error
	err  error
}

func newServiceError(kind, err error) *serviceError {
	return &serviceError{
		kind: kind,
		err:  err,
	}
}

func (e *serviceError) Error() string {
	if e == nil || e.err == nil {
		return ""
	}

	return e.err.Error()
}

func (e *serviceError) Unwrap() error {
	if e == nil {
		return nil
	}

	return e.kind
}

var _ interfaceanniversary.ServiceAnniversaryInterface = (*Service)(nil)
