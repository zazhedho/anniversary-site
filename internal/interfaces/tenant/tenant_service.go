package interfacetenant

import (
	"anniversary-site/internal/dto"
	"anniversary-site/pkg/filter"
)

type ServiceTenantInterface interface {
	Create(req dto.TenantCreate, actorUserID string, hasAccessAll bool) (dto.TenantDetail, error)
	GetByID(id, actorUserID string, hasAccessAll bool) (dto.TenantDetail, error)
	GetAll(params filter.BaseParams, actorUserID string, hasAccessAll bool) ([]dto.TenantListItem, int64, error)
	Update(id string, req dto.TenantUpdate, actorUserID string, hasAccessAll bool) (dto.TenantDetail, error)
	Delete(id, actorUserID string, hasAccessAll bool) error
	AddMember(id string, req dto.TenantAssignMember, actorUserID string, hasAccessAll bool) ([]dto.TenantMemberView, error)
}
