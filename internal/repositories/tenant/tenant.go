package repositorytenant

import (
	domaintenant "anniversary-site/internal/domain/tenant"
	"anniversary-site/internal/dto"
	interfacetenant "anniversary-site/internal/interfaces/tenant"
	"anniversary-site/pkg/filter"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type repo struct {
	DB *gorm.DB
}

func NewTenantRepo(db *gorm.DB) interfacetenant.RepoTenantInterface {
	return &repo{DB: db}
}

func (r *repo) Store(m domaintenant.Tenant) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetByID(id string) (ret domaintenant.Tenant, err error) {
	if err = r.DB.Where("id = ?", id).First(&ret).Error; err != nil {
		return domaintenant.Tenant{}, err
	}
	return ret, nil
}

func (r *repo) GetBySlug(slug string) (ret domaintenant.Tenant, err error) {
	if err = r.DB.Where("slug = ?", slug).First(&ret).Error; err != nil {
		return domaintenant.Tenant{}, err
	}
	return ret, nil
}

func (r *repo) GetAll(params filter.BaseParams) (ret []dto.TenantListItem, totalData int64, err error) {
	return r.queryTenantList(r.DB.Table("tenants t"), params)
}

func (r *repo) GetAllByUser(userID string, params filter.BaseParams) (ret []dto.TenantListItem, totalData int64, err error) {
	query := r.DB.Table("tenants t").
		Joins("JOIN tenant_members tm ON tm.tenant_id = t.id").
		Where("tm.user_id = ?", userID)
	return r.queryTenantList(query, params)
}

func (r *repo) queryTenantList(baseQuery *gorm.DB, params filter.BaseParams) ([]dto.TenantListItem, int64, error) {
	query := baseQuery.Select(`
		t.id,
		t.slug,
		t.name,
		t.status,
		t.created_at,
		t.updated_at,
		COUNT(DISTINCT tm_count.id) AS member_count
	`).Joins("LEFT JOIN tenant_members tm_count ON tm_count.tenant_id = t.id")

	allowedFilters := []string{"id", "slug", "name", "status"}
	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where(
			"LOWER(t.slug) LIKE LOWER(?) OR LOWER(t.name) LIKE LOWER(?)",
			searchPattern,
			searchPattern,
		)
	}

	safeFilters := filter.WhitelistFilter(params.Filters, allowedFilters)
	for key, value := range safeFilters {
		if value == nil {
			continue
		}

		column := "t." + key
		switch v := value.(type) {
		case string:
			if strings.TrimSpace(v) == "" {
				continue
			}
			query = query.Where(fmt.Sprintf("%s = ?", column), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("%s IN ?", column), v)
		default:
			query = query.Where(fmt.Sprintf("%s = ?", column), v)
		}
	}

	query = query.Group("t.id")

	var totalData int64
	countQuery := r.DB.Table("(?) AS tenant_rows", query.Session(&gorm.Session{}))
	if err := countQuery.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]string{
			"slug":       "t.slug",
			"name":       "t.name",
			"status":     "t.status",
			"created_at": "t.created_at",
			"updated_at": "t.updated_at",
		}
		column, ok := validColumns[params.OrderBy]
		if !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}
		query = query.Order(fmt.Sprintf("%s %s", column, params.OrderDirection))
	}

	var rows []dto.TenantListItem
	if err := query.Offset(params.Offset).Limit(params.Limit).Scan(&rows).Error; err != nil {
		return nil, 0, err
	}

	return rows, totalData, nil
}

func (r *repo) Update(m domaintenant.Tenant) error {
	return r.DB.Save(&m).Error
}

func (r *repo) Delete(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domaintenant.Tenant{}).Error
}

func (r *repo) AddOrUpdateMember(m domaintenant.TenantMember) error {
	now := time.Now()
	m.UpdatedAt = &now
	return r.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "tenant_id"}, {Name: "user_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"member_type": m.MemberType,
			"updated_at":  now,
		}),
	}).Create(&m).Error
}

func (r *repo) GetMembers(tenantID string) (ret []dto.TenantMemberView, err error) {
	if err = r.DB.Table("tenant_members tm").
		Select(`
			tm.id,
			tm.tenant_id,
			tm.user_id,
			tm.member_type,
			COALESCE(u.name, '') AS user_name,
			COALESCE(u.email, '') AS user_email,
			tm.created_at,
			tm.updated_at
		`).
		Joins("LEFT JOIN users u ON u.id = tm.user_id").
		Where("tm.tenant_id = ?", tenantID).
		Order("tm.created_at ASC").
		Scan(&ret).Error; err != nil {
		return nil, err
	}
	return ret, nil
}

func (r *repo) IsTenantMember(tenantID, userID string) (bool, error) {
	var count int64
	if err := r.DB.Table("tenant_members").
		Where("tenant_id = ? AND user_id = ?", tenantID, userID).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *repo) IsTenantOwner(tenantID, userID string) (bool, error) {
	var count int64
	if err := r.DB.Table("tenant_members").
		Where("tenant_id = ? AND user_id = ? AND member_type = 'owner'", tenantID, userID).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *repo) CountOwnedByUser(userID string) (int64, error) {
	var count int64
	if err := r.DB.Table("tenant_members").
		Where("user_id = ? AND member_type = 'owner'", userID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
