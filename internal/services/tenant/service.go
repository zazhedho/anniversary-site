package servicetenant

import (
	domaintenant "anniversary-site/internal/domain/tenant"
	"anniversary-site/internal/dto"
	interfacetenant "anniversary-site/internal/interfaces/tenant"
	interfaceuser "anniversary-site/internal/interfaces/user"
	"anniversary-site/pkg/filter"
	"anniversary-site/utils"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

type TenantService struct {
	TenantRepo interfacetenant.RepoTenantInterface
	UserRepo   interfaceuser.RepoUserInterface
}

func NewTenantService(tenantRepo interfacetenant.RepoTenantInterface, userRepo interfaceuser.RepoUserInterface) *TenantService {
	return &TenantService{
		TenantRepo: tenantRepo,
		UserRepo:   userRepo,
	}
}

func (s *TenantService) Create(req dto.TenantCreate, actorUserID string) (dto.TenantDetail, error) {
	now := time.Now()
	slug := normalizeTenantSlug(req.Slug)
	if slug == "" {
		return dto.TenantDetail{}, errors.New("invalid tenant slug")
	}

	if _, err := s.TenantRepo.GetBySlug(slug); err == nil {
		return dto.TenantDetail{}, ErrTenantSlugTaken
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return dto.TenantDetail{}, err
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return dto.TenantDetail{}, errors.New("tenant name is required")
	}

	status := normalizeTenantStatus(req.Status)
	tenant := domaintenant.Tenant{
		ID:        utils.CreateUUID(),
		Slug:      slug,
		Name:      name,
		Status:    status,
		CreatedAt: now,
		UpdatedAt: &now,
	}
	if err := s.TenantRepo.Store(tenant); err != nil {
		return dto.TenantDetail{}, err
	}

	if strings.TrimSpace(actorUserID) != "" {
		member := domaintenant.TenantMember{
			ID:         utils.CreateUUID(),
			TenantID:   tenant.ID,
			UserID:     actorUserID,
			MemberType: "owner",
			CreatedAt:  now,
			UpdatedAt:  &now,
		}
		if err := s.TenantRepo.AddOrUpdateMember(member); err != nil {
			return dto.TenantDetail{}, err
		}
	}

	return s.GetByID(tenant.ID, actorUserID, true)
}

func (s *TenantService) GetByID(id, actorUserID string, hasAccessAll bool) (dto.TenantDetail, error) {
	tenant, err := s.TenantRepo.GetByID(id)
	if err != nil {
		return dto.TenantDetail{}, err
	}

	if err := s.ensureTenantReadable(tenant.ID, actorUserID, hasAccessAll); err != nil {
		return dto.TenantDetail{}, err
	}

	members, err := s.TenantRepo.GetMembers(tenant.ID)
	if err != nil {
		return dto.TenantDetail{}, err
	}

	return dto.TenantDetail{
		Tenant:  toTenantListItem(tenant, int64(len(members))),
		Members: members,
	}, nil
}

func (s *TenantService) GetAll(params filter.BaseParams, actorUserID string, hasAccessAll bool) ([]dto.TenantListItem, int64, error) {
	if hasAccessAll {
		return s.TenantRepo.GetAll(params)
	}
	return s.TenantRepo.GetAllByUser(actorUserID, params)
}

func (s *TenantService) Update(id string, req dto.TenantUpdate, actorUserID string, hasAccessAll bool) (dto.TenantDetail, error) {
	tenant, err := s.TenantRepo.GetByID(id)
	if err != nil {
		return dto.TenantDetail{}, err
	}

	if err := s.ensureTenantManageable(tenant.ID, actorUserID, hasAccessAll); err != nil {
		return dto.TenantDetail{}, err
	}

	if strings.TrimSpace(req.Slug) != "" {
		slug := normalizeTenantSlug(req.Slug)
		if slug == "" {
			return dto.TenantDetail{}, errors.New("invalid tenant slug")
		}
		if slug != tenant.Slug && !hasAccessAll {
			return dto.TenantDetail{}, ErrTenantSlugLocked
		}
		existing, err := s.TenantRepo.GetBySlug(slug)
		if err == nil && existing.ID != tenant.ID {
			return dto.TenantDetail{}, ErrTenantSlugTaken
		}
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return dto.TenantDetail{}, err
		}
		tenant.Slug = slug
	}

	if name := strings.TrimSpace(req.Name); name != "" {
		tenant.Name = name
	}

	if strings.TrimSpace(req.Status) != "" {
		tenant.Status = normalizeTenantStatus(req.Status)
	}

	now := time.Now()
	tenant.UpdatedAt = &now
	if err := s.TenantRepo.Update(tenant); err != nil {
		return dto.TenantDetail{}, err
	}

	return s.GetByID(tenant.ID, actorUserID, true)
}

func (s *TenantService) Delete(id, actorUserID string, hasAccessAll bool) error {
	tenant, err := s.TenantRepo.GetByID(id)
	if err != nil {
		return err
	}

	if err := s.ensureTenantManageable(tenant.ID, actorUserID, hasAccessAll); err != nil {
		return err
	}

	if tenant.Slug == "default" {
		return errors.New("default tenant cannot be deleted")
	}

	return s.TenantRepo.Delete(id)
}

func (s *TenantService) AddMember(id string, req dto.TenantAssignMember, actorUserID string, hasAccessAll bool) ([]dto.TenantMemberView, error) {
	tenant, err := s.TenantRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if err := s.ensureTenantManageable(tenant.ID, actorUserID, hasAccessAll); err != nil {
		return nil, err
	}

	userID := strings.TrimSpace(req.UserID)
	if userID == "" {
		return nil, errors.New("user_id is required")
	}

	if _, err := s.UserRepo.GetByID(userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	now := time.Now()
	member := domaintenant.TenantMember{
		ID:         utils.CreateUUID(),
		TenantID:   tenant.ID,
		UserID:     userID,
		MemberType: normalizeMemberType(req.MemberType),
		CreatedAt:  now,
		UpdatedAt:  &now,
	}

	if err := s.TenantRepo.AddOrUpdateMember(member); err != nil {
		return nil, err
	}

	return s.TenantRepo.GetMembers(tenant.ID)
}

var _ interfacetenant.ServiceTenantInterface = (*TenantService)(nil)
