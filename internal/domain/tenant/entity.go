package domaintenant

import (
	"time"
)

func (Tenant) TableName() string {
	return "tenants"
}

type Tenant struct {
	ID        string     `json:"id" gorm:"column:id;primaryKey"`
	Slug      string     `json:"slug" gorm:"column:slug;unique"`
	Name      string     `json:"name" gorm:"column:name"`
	Status    string     `json:"status" gorm:"column:status"`
	CreatedAt time.Time  `json:"created_at,omitempty" gorm:"column:created_at"`
	UpdatedAt *time.Time `json:"updated_at,omitempty" gorm:"column:updated_at"`
}

func (TenantMember) TableName() string {
	return "tenant_members"
}

type TenantMember struct {
	ID         string     `json:"id" gorm:"column:id;primaryKey"`
	TenantID   string     `json:"tenant_id" gorm:"column:tenant_id"`
	UserID     string     `json:"user_id" gorm:"column:user_id"`
	MemberType string     `json:"member_type" gorm:"column:member_type"`
	CreatedAt  time.Time  `json:"created_at,omitempty" gorm:"column:created_at"`
	UpdatedAt  *time.Time `json:"updated_at,omitempty" gorm:"column:updated_at"`
}

type TenantMemberWithUser struct {
	ID         string     `json:"id"`
	TenantID   string     `json:"tenant_id"`
	UserID     string     `json:"user_id"`
	MemberType string     `json:"member_type"`
	UserName   string     `json:"user_name"`
	UserEmail  string     `json:"user_email"`
	CreatedAt  time.Time  `json:"created_at,omitempty"`
	UpdatedAt  *time.Time `json:"updated_at,omitempty"`
}
