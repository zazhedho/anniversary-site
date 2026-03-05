package anniversary

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	domaintenant "anniversary-site/internal/domain/tenant"
	"anniversary-site/internal/dto"
	"anniversary-site/middlewares"
	"anniversary-site/pkg/filter"
	"anniversary-site/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type stubAnniversaryService struct {
	publicByTenant map[string]dto.AnniversaryPublicPayload
	setupByTenant  map[string]dto.AnniversarySiteConfig
}

func (s *stubAnniversaryService) GetPublicPayload(tenantSlug, _ string) (dto.AnniversaryPublicPayload, error) {
	if payload, ok := s.publicByTenant[tenantSlug]; ok {
		return payload, nil
	}
	return dto.AnniversaryPublicPayload{
		Config: dto.AnniversaryPublicSiteConfig{
			HeroTitle: "fallback-" + tenantSlug,
		},
	}, nil
}

func (s *stubAnniversaryService) GetPublicMoments(tenantSlug, _ string) ([]dto.AnniversaryMomentView, error) {
	payload, _ := s.GetPublicPayload(tenantSlug, "en")
	return payload.Moments, nil
}

func (s *stubAnniversaryService) GetSetupConfig(tenantSlug string) (dto.AnniversarySiteConfig, error) {
	if cfg, ok := s.setupByTenant[tenantSlug]; ok {
		return cfg, nil
	}
	return dto.AnniversarySiteConfig{}, nil
}

func (s *stubAnniversaryService) UpdateConfig(tenantSlug string, _ dto.AnniversarySiteConfig) (dto.AnniversaryPublicPayload, error) {
	return s.GetPublicPayload(tenantSlug, "id")
}

func (s *stubAnniversaryService) ReplaceMoments(_ string, req []dto.AnniversaryMoment) ([]dto.AnniversaryMoment, error) {
	return req, nil
}

func (s *stubAnniversaryService) AddMoment(_ string, req dto.AnniversaryMoment) ([]dto.AnniversaryMoment, error) {
	return []dto.AnniversaryMoment{req}, nil
}

func (s *stubAnniversaryService) DeleteMoment(_ string, _ int) ([]dto.AnniversaryMoment, error) {
	return []dto.AnniversaryMoment{}, nil
}

type stubTenantRepo struct {
	tenantsBySlug map[string]domaintenant.Tenant
	memberByKey   map[string]bool
	ownerByKey    map[string]bool
}

func newStubTenantRepo() *stubTenantRepo {
	return &stubTenantRepo{
		tenantsBySlug: make(map[string]domaintenant.Tenant),
		memberByKey:   make(map[string]bool),
		ownerByKey:    make(map[string]bool),
	}
}

func (r *stubTenantRepo) addTenant(slug, id string) {
	r.tenantsBySlug[slug] = domaintenant.Tenant{ID: id, Slug: slug, Name: slug, Status: "active"}
}

func (r *stubTenantRepo) markOwner(tenantID, userID string) {
	r.ownerByKey[tenantID+"|"+userID] = true
	r.memberByKey[tenantID+"|"+userID] = true
}

func (r *stubTenantRepo) markMember(tenantID, userID string) {
	r.memberByKey[tenantID+"|"+userID] = true
}

func (r *stubTenantRepo) Store(_ domaintenant.Tenant) error { return nil }

func (r *stubTenantRepo) GetByID(id string) (domaintenant.Tenant, error) {
	for _, tenant := range r.tenantsBySlug {
		if tenant.ID == id {
			return tenant, nil
		}
	}
	return domaintenant.Tenant{}, gorm.ErrRecordNotFound
}

func (r *stubTenantRepo) GetBySlug(slug string) (domaintenant.Tenant, error) {
	if tenant, ok := r.tenantsBySlug[slug]; ok {
		return tenant, nil
	}
	return domaintenant.Tenant{}, gorm.ErrRecordNotFound
}

func (r *stubTenantRepo) GetAll(_ filter.BaseParams) ([]dto.TenantListItem, int64, error) {
	return []dto.TenantListItem{}, 0, nil
}

func (r *stubTenantRepo) GetAllByUser(_ string, _ filter.BaseParams) ([]dto.TenantListItem, int64, error) {
	return []dto.TenantListItem{}, 0, nil
}

func (r *stubTenantRepo) Update(_ domaintenant.Tenant) error { return nil }

func (r *stubTenantRepo) Delete(_ string) error { return nil }

func (r *stubTenantRepo) AddOrUpdateMember(_ domaintenant.TenantMember) error { return nil }

func (r *stubTenantRepo) GetMembers(_ string) ([]dto.TenantMemberView, error) {
	return []dto.TenantMemberView{}, nil
}

func (r *stubTenantRepo) IsTenantMember(tenantID, userID string) (bool, error) {
	return r.memberByKey[tenantID+"|"+userID], nil
}

func (r *stubTenantRepo) IsTenantOwner(tenantID, userID string) (bool, error) {
	return r.ownerByKey[tenantID+"|"+userID], nil
}

func (r *stubTenantRepo) CountOwnedByUser(_ string) (int64, error) {
	return 0, nil
}

func setupTestRouter(userID string, permissionMap map[string]bool, handler *Handler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	setAuthContext := func(ctx *gin.Context) {
		ctx.Set("userId", userID)
		ctx.Set("permission_access_map", permissionMap)
		ctx.Set(utils.CtxKeyAuthData, map[string]interface{}{
			"user_id": userID,
			"role":    utils.RoleTenantOwner,
		})
		ctx.Next()
	}

	public := router.Group("/api/public")
	public.Use(middlewares.TenantScopeMiddleware("default"))
	{
		public.GET("/tenants/:slug/anniversary", handler.GetPublic)
	}

	setup := router.Group("/api/setup")
	setup.Use(setAuthContext, middlewares.TenantScopeMiddleware("default"))
	{
		setup.GET("/tenants/:slug/anniversary", handler.GetSetup)
		setup.PUT("/tenants/:slug/anniversary", handler.UpdateConfig)
	}

	return router
}

func mustDecode[T any](t *testing.T, recorder *httptest.ResponseRecorder) T {
	t.Helper()

	var result T
	if err := json.Unmarshal(recorder.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to decode json response: %v", err)
	}
	return result
}

func TestPublicAnniversary_IsolatedByTenantSlug(t *testing.T) {
	tenantRepo := newStubTenantRepo()
	service := &stubAnniversaryService{
		publicByTenant: map[string]dto.AnniversaryPublicPayload{
			"tenant-a": {Config: dto.AnniversaryPublicSiteConfig{HeroTitle: "Title A"}},
			"tenant-b": {Config: dto.AnniversaryPublicSiteConfig{HeroTitle: "Title B"}},
		},
		setupByTenant: map[string]dto.AnniversarySiteConfig{},
	}
	handler := NewHandler(service, tenantRepo, nil, 50)
	router := setupTestRouter("user-a", map[string]bool{}, handler)

	reqA := httptest.NewRequest(http.MethodGet, "/api/public/tenants/tenant-a/anniversary", nil)
	recA := httptest.NewRecorder()
	router.ServeHTTP(recA, reqA)

	reqB := httptest.NewRequest(http.MethodGet, "/api/public/tenants/tenant-b/anniversary", nil)
	recB := httptest.NewRecorder()
	router.ServeHTTP(recB, reqB)

	if recA.Code != http.StatusOK || recB.Code != http.StatusOK {
		t.Fatalf("expected 200 for both tenants, got %d and %d", recA.Code, recB.Code)
	}

	type publicResp struct {
		Status bool                         `json:"status"`
		Data   dto.AnniversaryPublicPayload `json:"data"`
	}

	payloadA := mustDecode[publicResp](t, recA)
	payloadB := mustDecode[publicResp](t, recB)

	if payloadA.Data.Config.HeroTitle == payloadB.Data.Config.HeroTitle {
		t.Fatalf("expected different public payload per tenant, got same hero title %q", payloadA.Data.Config.HeroTitle)
	}
}

func TestSetupAnniversary_DeniesCrossTenantReadWithoutMembership(t *testing.T) {
	tenantRepo := newStubTenantRepo()
	tenantRepo.addTenant("tenant-a", "tenant-a-id")
	tenantRepo.addTenant("tenant-b", "tenant-b-id")
	tenantRepo.markOwner("tenant-a-id", "user-a")

	service := &stubAnniversaryService{
		publicByTenant: map[string]dto.AnniversaryPublicPayload{},
		setupByTenant: map[string]dto.AnniversarySiteConfig{
			"tenant-a": {Brand: dto.NewLocalizedText("Tenant A")},
			"tenant-b": {Brand: dto.NewLocalizedText("Tenant B")},
		},
	}
	handler := NewHandler(service, tenantRepo, nil, 50)
	router := setupTestRouter("user-a", map[string]bool{}, handler)

	req := httptest.NewRequest(http.MethodGet, "/api/setup/tenants/tenant-b/anniversary", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for cross-tenant read, got %d", rec.Code)
	}
}

func TestSetupAnniversary_AllowsCrossTenantReadWithAccessAllPermission(t *testing.T) {
	tenantRepo := newStubTenantRepo()
	tenantRepo.addTenant("tenant-a", "tenant-a-id")
	tenantRepo.addTenant("tenant-b", "tenant-b-id")
	tenantRepo.markOwner("tenant-a-id", "user-a")

	service := &stubAnniversaryService{
		publicByTenant: map[string]dto.AnniversaryPublicPayload{},
		setupByTenant: map[string]dto.AnniversarySiteConfig{
			"tenant-b": {Brand: dto.NewLocalizedText("Tenant B")},
		},
	}
	handler := NewHandler(service, tenantRepo, nil, 50)
	router := setupTestRouter("user-a", map[string]bool{"tenants:access_all": true}, handler)

	req := httptest.NewRequest(http.MethodGet, "/api/setup/tenants/tenant-b/anniversary", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for cross-tenant read with access_all, got %d", rec.Code)
	}
}

func TestSetupAnniversary_OnlyOwnerCanUpdateTenantConfig(t *testing.T) {
	tenantRepo := newStubTenantRepo()
	tenantRepo.addTenant("tenant-a", "tenant-a-id")
	tenantRepo.markMember("tenant-a-id", "user-member")

	service := &stubAnniversaryService{
		publicByTenant: map[string]dto.AnniversaryPublicPayload{
			"tenant-a": {Config: dto.AnniversaryPublicSiteConfig{HeroTitle: "Tenant A"}},
		},
		setupByTenant: map[string]dto.AnniversarySiteConfig{},
	}
	handler := NewHandler(service, tenantRepo, nil, 50)
	router := setupTestRouter("user-member", map[string]bool{}, handler)

	req := httptest.NewRequest(http.MethodPut, "/api/setup/tenants/tenant-a/anniversary", bytes.NewBufferString(`{}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for non-owner update, got %d", rec.Code)
	}
}
