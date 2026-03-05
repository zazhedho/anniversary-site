package utils

const (
	CtxKeyId       = "CTX_ID"
	CtxKeyAuthData = "auth_data"
	CtxKeyTenant   = "tenant_slug"
)

const (
	RedisAppConf = "cache:config:app"
	RedisDbConf  = "cache:config:db"
)

const (
	RoleSuperAdmin  = "superadmin"
	RoleAdmin       = "admin"
	RoleTenantOwner = "tenant_owner"
	RoleMember      = "member"
)
