package interfacepermission

import (
	domainpermission "anniversary-site/internal/domain/permission"
	"anniversary-site/pkg/filter"
)

type RepoPermissionInterface interface {
	Store(m domainpermission.Permission) error
	GetByID(id string) (domainpermission.Permission, error)
	GetByName(name string) (domainpermission.Permission, error)
	GetAll(params filter.BaseParams) ([]domainpermission.Permission, int64, error)
	Update(m domainpermission.Permission) error
	Delete(id string) error

	GetByResource(resource string) ([]domainpermission.Permission, error)
	GetUserPermissions(userId string) ([]domainpermission.Permission, error)
}
