package dto

import "time"

type TenantCreate struct {
	Slug   string `json:"slug" binding:"required,min=3,max=100"`
	Name   string `json:"name" binding:"required,min=3,max=150"`
	Status string `json:"status" binding:"omitempty,oneof=active suspended"`
}

type TenantUpdate struct {
	Slug   string `json:"slug" binding:"omitempty,min=3,max=100"`
	Name   string `json:"name" binding:"omitempty,min=3,max=150"`
	Status string `json:"status" binding:"omitempty,oneof=active suspended"`
}

type TenantAssignMember struct {
	UserID     string `json:"user_id" binding:"required,uuid"`
	MemberType string `json:"member_type" binding:"omitempty,oneof=owner member"`
}

type TenantListItem struct {
	ID          string     `json:"id"`
	Slug        string     `json:"slug"`
	Name        string     `json:"name"`
	Status      string     `json:"status"`
	MemberCount int64      `json:"member_count"`
	CreatedAt   time.Time  `json:"created_at,omitempty"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty"`
}

type TenantMemberView struct {
	ID         string     `json:"id"`
	TenantID   string     `json:"tenant_id"`
	UserID     string     `json:"user_id"`
	MemberType string     `json:"member_type"`
	UserName   string     `json:"user_name"`
	UserEmail  string     `json:"user_email"`
	CreatedAt  time.Time  `json:"created_at,omitempty"`
	UpdatedAt  *time.Time `json:"updated_at,omitempty"`
}

type TenantDetail struct {
	Tenant  TenantListItem     `json:"tenant"`
	Members []TenantMemberView `json:"members"`
}
