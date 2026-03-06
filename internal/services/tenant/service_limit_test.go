package servicetenant

import (
	domaintenant "anniversary-site/internal/domain/tenant"
	domainuser "anniversary-site/internal/domain/user"
	"anniversary-site/internal/dto"
	"anniversary-site/pkg/filter"
	"errors"
	"testing"

	"gorm.io/gorm"
)

type tenantRepoQuotaStub struct {
	bySlug      map[string]domaintenant.Tenant
	ownedByUser int64
	stored      []domaintenant.Tenant
	members     []domaintenant.TenantMember
}

func newTenantRepoQuotaStub() *tenantRepoQuotaStub {
	return &tenantRepoQuotaStub{
		bySlug: make(map[string]domaintenant.Tenant),
	}
}

func (r *tenantRepoQuotaStub) Store(m domaintenant.Tenant) error {
	r.bySlug[m.Slug] = m
	r.stored = append(r.stored, m)
	return nil
}

func (r *tenantRepoQuotaStub) GetByID(id string) (domaintenant.Tenant, error) {
	for _, tenant := range r.bySlug {
		if tenant.ID == id {
			return tenant, nil
		}
	}
	return domaintenant.Tenant{}, gorm.ErrRecordNotFound
}

func (r *tenantRepoQuotaStub) GetBySlug(slug string) (domaintenant.Tenant, error) {
	if tenant, ok := r.bySlug[slug]; ok {
		return tenant, nil
	}
	return domaintenant.Tenant{}, gorm.ErrRecordNotFound
}

func (r *tenantRepoQuotaStub) GetAll(_ filter.BaseParams) ([]dto.TenantListItem, int64, error) {
	return nil, 0, nil
}

func (r *tenantRepoQuotaStub) GetAllByUser(_ string, _ filter.BaseParams) ([]dto.TenantListItem, int64, error) {
	return nil, 0, nil
}

func (r *tenantRepoQuotaStub) Update(_ domaintenant.Tenant) error { return nil }

func (r *tenantRepoQuotaStub) Delete(_ string) error { return nil }

func (r *tenantRepoQuotaStub) AddOrUpdateMember(m domaintenant.TenantMember) error {
	r.members = append(r.members, m)
	return nil
}

func (r *tenantRepoQuotaStub) GetMembers(_ string) ([]dto.TenantMemberView, error) {
	return nil, nil
}

func (r *tenantRepoQuotaStub) IsTenantMember(_, _ string) (bool, error) { return false, nil }

func (r *tenantRepoQuotaStub) IsTenantOwner(_, _ string) (bool, error) { return false, nil }

func (r *tenantRepoQuotaStub) CountOwnedByUser(_ string) (int64, error) { return r.ownedByUser, nil }

type userRepoQuotaStub struct {
	byID map[string]domainuser.Users
}

func newUserRepoQuotaStub() *userRepoQuotaStub {
	return &userRepoQuotaStub{
		byID: make(map[string]domainuser.Users),
	}
}

func (r *userRepoQuotaStub) Store(_ domainuser.Users) error { return nil }

func (r *userRepoQuotaStub) StoreWithPhone(_ domainuser.Users, _ *string) error { return nil }

func (r *userRepoQuotaStub) GetByEmail(email string) (domainuser.Users, error) {
	for _, user := range r.byID {
		if user.Email == email {
			return user, nil
		}
	}
	return domainuser.Users{}, gorm.ErrRecordNotFound
}

func (r *userRepoQuotaStub) GetByPhone(_ string) (domainuser.Users, error) {
	return domainuser.Users{}, gorm.ErrRecordNotFound
}

func (r *userRepoQuotaStub) GetByID(id string) (domainuser.Users, error) {
	user, ok := r.byID[id]
	if !ok {
		return domainuser.Users{}, gorm.ErrRecordNotFound
	}
	return user, nil
}

func (r *userRepoQuotaStub) GetAll(_ filter.BaseParams) ([]domainuser.Users, int64, error) {
	return nil, 0, nil
}

func (r *userRepoQuotaStub) Update(_ domainuser.Users) error { return nil }

func (r *userRepoQuotaStub) Delete(_ string) error { return nil }

func TestCreateTenant_FreePlanLimitReached(t *testing.T) {
	t.Setenv("SAAS_TENANT_PLAN_LIMITS", "free:1,starter:2,pro:5")
	t.Setenv("SAAS_TENANT_DEFAULT_PLAN", "free")
	t.Setenv("SAAS_TENANT_PLAN_OVERRIDES", "")

	tenantRepo := newTenantRepoQuotaStub()
	tenantRepo.ownedByUser = 1

	userRepo := newUserRepoQuotaStub()
	userRepo.byID["user-free"] = domainuser.Users{
		Id:    "user-free",
		Email: "free@example.com",
	}

	service := NewTenantService(tenantRepo, userRepo)
	_, err := service.Create(dto.TenantCreate{
		Slug: "new-slug",
		Name: "New Slug",
	}, "user-free", false)
	if !errors.Is(err, ErrTenantLimitReached) {
		t.Fatalf("expected ErrTenantLimitReached, got %v", err)
	}
}

func TestCreateTenant_StarterPlanOverrideAllowsSecondTenant(t *testing.T) {
	t.Setenv("SAAS_TENANT_PLAN_LIMITS", "free:1,starter:2,pro:5")
	t.Setenv("SAAS_TENANT_DEFAULT_PLAN", "free")
	t.Setenv("SAAS_TENANT_PLAN_OVERRIDES", "starter@example.com:starter")

	tenantRepo := newTenantRepoQuotaStub()
	tenantRepo.ownedByUser = 1

	userRepo := newUserRepoQuotaStub()
	userRepo.byID["user-starter"] = domainuser.Users{
		Id:    "user-starter",
		Email: "starter@example.com",
	}

	service := NewTenantService(tenantRepo, userRepo)
	_, err := service.Create(dto.TenantCreate{
		Slug: "second-slug",
		Name: "Second Slug",
	}, "user-starter", false)
	if err != nil {
		t.Fatalf("expected create success for starter plan, got %v", err)
	}
	if len(tenantRepo.stored) != 1 {
		t.Fatalf("expected tenant stored once, got %d", len(tenantRepo.stored))
	}
}

func TestCreateTenant_AccessAllBypassesQuota(t *testing.T) {
	t.Setenv("SAAS_TENANT_PLAN_LIMITS", "free:1,starter:2,pro:5")
	t.Setenv("SAAS_TENANT_DEFAULT_PLAN", "free")
	t.Setenv("SAAS_TENANT_PLAN_OVERRIDES", "")

	tenantRepo := newTenantRepoQuotaStub()
	tenantRepo.ownedByUser = 100

	userRepo := newUserRepoQuotaStub()
	userRepo.byID["platform-admin"] = domainuser.Users{
		Id:    "platform-admin",
		Email: "admin@example.com",
	}

	service := NewTenantService(tenantRepo, userRepo)
	_, err := service.Create(dto.TenantCreate{
		Slug: "admin-created",
		Name: "Admin Created",
	}, "platform-admin", true)
	if err != nil {
		t.Fatalf("expected create success for access_all user, got %v", err)
	}
}
