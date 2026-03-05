package interfacetenant

import (
	domaintenant "anniversary-site/internal/domain/tenant"
	"anniversary-site/internal/dto"
	"anniversary-site/pkg/filter"
)

type RepoTenantInterface interface {
	Store(m domaintenant.Tenant) error
	GetByID(id string) (domaintenant.Tenant, error)
	GetBySlug(slug string) (domaintenant.Tenant, error)
	GetAll(params filter.BaseParams) ([]dto.TenantListItem, int64, error)
	GetAllByUser(userID string, params filter.BaseParams) ([]dto.TenantListItem, int64, error)
	Update(m domaintenant.Tenant) error
	Delete(id string) error

	AddOrUpdateMember(m domaintenant.TenantMember) error
	GetMembers(tenantID string) ([]dto.TenantMemberView, error)
	IsTenantMember(tenantID, userID string) (bool, error)
	IsTenantOwner(tenantID, userID string) (bool, error)
	CountOwnedByUser(userID string) (int64, error)
}
