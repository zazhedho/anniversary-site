package router

import (
	"anniversary-site/infrastructure/media"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"anniversary-site/infrastructure/database"
	anniversaryHandler "anniversary-site/internal/handlers/http/anniversary"
	locationHandler "anniversary-site/internal/handlers/http/location"
	menuHandler "anniversary-site/internal/handlers/http/menu"
	permissionHandler "anniversary-site/internal/handlers/http/permission"
	roleHandler "anniversary-site/internal/handlers/http/role"
	sessionHandler "anniversary-site/internal/handlers/http/session"
	tenantHandler "anniversary-site/internal/handlers/http/tenant"
	userHandler "anniversary-site/internal/handlers/http/user"
	interfaceanniversary "anniversary-site/internal/interfaces/anniversary"
	anniversaryRepo "anniversary-site/internal/repositories/anniversary"
	auditRepo "anniversary-site/internal/repositories/audit"
	authRepo "anniversary-site/internal/repositories/auth"
	menuRepo "anniversary-site/internal/repositories/menu"
	permissionRepo "anniversary-site/internal/repositories/permission"
	roleRepo "anniversary-site/internal/repositories/role"
	sessionRepo "anniversary-site/internal/repositories/session"
	tenantRepo "anniversary-site/internal/repositories/tenant"
	userRepo "anniversary-site/internal/repositories/user"
	anniversarySvc "anniversary-site/internal/services/anniversary"
	auditSvc "anniversary-site/internal/services/audit"
	locationSvc "anniversary-site/internal/services/location"
	menuSvc "anniversary-site/internal/services/menu"
	permissionSvc "anniversary-site/internal/services/permission"
	roleSvc "anniversary-site/internal/services/role"
	sessionSvc "anniversary-site/internal/services/session"
	tenantSvc "anniversary-site/internal/services/tenant"
	userSvc "anniversary-site/internal/services/user"
	"anniversary-site/middlewares"
	"anniversary-site/pkg/logger"
	"anniversary-site/pkg/security"
	"anniversary-site/utils"
)

type Routes struct {
	App *gin.Engine
	DB  *gorm.DB
}

func NewRoutes() *Routes {
	app := gin.Default()

	app.Use(middlewares.CORS())
	app.Use(gin.CustomRecovery(middlewares.ErrorHandler))
	app.Use(middlewares.SetContextId())
	app.Use(middlewares.RequestLogger())

	app.GET("/healthcheck", func(ctx *gin.Context) {
		logger.WriteLogWithContext(ctx, logger.LogLevelDebug, "ClientIP: "+ctx.ClientIP())
		ctx.JSON(http.StatusOK, gin.H{
			"message": "OK!!",
		})
	})

	return &Routes{
		App: app,
	}
}

func (r *Routes) AnniversaryRoutes() {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		loc = time.FixedZone("WIB", 7*60*60)
	}

	store := strings.ToLower(strings.TrimSpace(utils.GetEnv("ANNIVERSARY_STORE", "json")))

	var repo interfaceanniversary.RepoAnniversaryInterface
	if store == "db" {
		if r.DB == nil {
			logger.WriteLog(logger.LogLevelError, "ANNIVERSARY_STORE=db but DB connection is not initialized; falling back to JSON file store")
			repo = anniversaryRepo.NewAnniversaryRepo(
				utils.GetEnv("ANNIVERSARY_DATA_FILE", "./data/anniversary.json"),
				loc,
			)
		} else {
			repo = anniversaryRepo.NewAnniversaryDBRepo(r.DB, loc)
		}
	} else {
		repo = anniversaryRepo.NewAnniversaryRepo(
			utils.GetEnv("ANNIVERSARY_DATA_FILE", "./data/anniversary.json"),
			loc,
		)
	}

	svc := anniversarySvc.NewAnniversaryService(repo, loc)
	storageProvider, storageErr := media.InitStorage()
	if storageErr != nil {
		logger.WriteLog(logger.LogLevelError, "Failed to initialize storage provider for anniversary upload: "+storageErr.Error())
	}

	h := anniversaryHandler.NewHandler(
		svc,
		storageProvider,
		int64(utils.GetEnv("ANNIVERSARY_UPLOAD_MAX_MB", 50)),
	)
	defaultTenantSlug := utils.GetEnv("TENANT_DEFAULT_SLUG", "default")

	public := r.App.Group("/api/public")
	public.Use(middlewares.TenantScopeMiddleware(defaultTenantSlug))
	{
		public.GET("/anniversary", h.GetPublic)
		public.GET("/anniversary/moments", h.GetMoments)
		public.GET("/tenants/:slug/anniversary", h.GetPublic)
		public.GET("/tenants/:slug/anniversary/moments", h.GetMoments)
		public.GET("/tenants/:slug/moments", h.GetMoments)
	}

	setup := r.App.Group("/api/setup")
	setup.Use(middlewares.SetupTokenMiddleware(
		utils.GetEnv("SETUP_API_ENABLED", true),
		utils.GetEnv("SETUP_TOKEN", ""),
	))
	setup.Use(middlewares.TenantScopeMiddleware(defaultTenantSlug))
	{
		setup.GET("/anniversary", h.GetSetup)
		setup.PUT("/anniversary", h.UpdateConfig)
		setup.PUT("/anniversary/moments", h.ReplaceMoments)
		setup.POST("/anniversary/moments", h.AddMoment)
		setup.DELETE("/anniversary/moments/:year", h.DeleteMoment)
		setup.POST("/anniversary/media/upload", h.UploadMedia)
		setup.GET("/tenants/:slug/anniversary", h.GetSetup)
		setup.PUT("/tenants/:slug/anniversary", h.UpdateConfig)
		setup.PUT("/tenants/:slug/anniversary/moments", h.ReplaceMoments)
		setup.POST("/tenants/:slug/anniversary/moments", h.AddMoment)
		setup.DELETE("/tenants/:slug/anniversary/moments/:year", h.DeleteMoment)
		setup.POST("/tenants/:slug/anniversary/media/upload", h.UploadMedia)
	}
}

func (r *Routes) UserRoutes() {
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	repo := userRepo.NewUserRepo(r.DB)
	rRepo := roleRepo.NewRoleRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	tRepo := tenantRepo.NewTenantRepo(r.DB)
	uc := userSvc.NewUserService(repo, blacklistRepo, rRepo, pRepo, tRepo)
	repoAudit := auditRepo.NewAuditRepo(r.DB)
	svcAudit := auditSvc.NewAuditService(repoAudit)

	// Setup login limiter if Redis is available
	redisClient := database.GetRedisClient()
	var loginLimiter security.LoginLimiter
	if redisClient != nil {
		loginLimiter = security.NewRedisLoginLimiter(
			redisClient,
			utils.GetEnv("LOGIN_ATTEMPT_LIMIT", 5),
			time.Duration(utils.GetEnv("LOGIN_ATTEMPT_WINDOW_SECONDS", 60))*time.Second,
			time.Duration(utils.GetEnv("LOGIN_BLOCK_DURATION_SECONDS", 300))*time.Second,
		)
	}

	h := userHandler.NewUserHandler(uc, loginLimiter, svcAudit)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	// Setup register rate limiter
	registerLimit := utils.GetEnv("REGISTER_RATE_LIMIT", 5)
	registerWindowSeconds := utils.GetEnv("REGISTER_RATE_WINDOW_SECONDS", 60)
	if registerWindowSeconds <= 0 {
		registerWindowSeconds = 60
	}
	registerLimiter := middlewares.IPRateLimitMiddleware(
		redisClient,
		"user_register",
		registerLimit,
		time.Duration(registerWindowSeconds)*time.Second,
	)

	user := r.App.Group("/api/user")
	{
		user.POST("/register", registerLimiter, h.Register)
		user.POST("/login", h.Login)
		user.POST("/forgot-password", h.ForgotPassword)
		user.POST("/reset-password", h.ResetPassword)

		userPriv := user.Group("").Use(mdw.AuthMiddleware())
		{
			userPriv.POST("/logout", h.Logout)
			userPriv.GET("", h.GetUserByAuth)
			userPriv.GET("/:id", mdw.PermissionMiddleware("users", "view"), h.GetUserById)
			userPriv.PUT("", h.Update)
			userPriv.PUT("/:id", mdw.PermissionMiddleware("users", "update"), h.UpdateUserById)
			userPriv.PUT("/change/password", h.ChangePassword)
			userPriv.DELETE("", h.Delete)
			userPriv.DELETE("/:id", mdw.PermissionMiddleware("users", "delete"), h.DeleteUserById)

			// Admin create user endpoint (with role selection)
			userPriv.POST("", mdw.PermissionMiddleware("users", "create"), h.AdminCreateUser)
		}
	}

	r.App.GET("/api/users", mdw.AuthMiddleware(), mdw.PermissionMiddleware("users", "list"), h.GetAllUsers)
}

func (r *Routes) RoleRoutes() {
	repoRole := roleRepo.NewRoleRepo(r.DB)
	repoPermission := permissionRepo.NewPermissionRepo(r.DB)
	repoMenu := menuRepo.NewMenuRepo(r.DB)
	svc := roleSvc.NewRoleService(repoRole, repoPermission, repoMenu)
	repoAudit := auditRepo.NewAuditRepo(r.DB)
	svcAudit := auditSvc.NewAuditService(repoAudit)
	h := roleHandler.NewRoleHandler(svc, svcAudit)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, repoPermission)

	// List endpoints
	r.App.GET("/api/roles", mdw.AuthMiddleware(), mdw.PermissionMiddleware("roles", "list"), h.GetAll)

	// CRUD endpoints
	role := r.App.Group("/api/role").Use(mdw.AuthMiddleware())
	{
		role.POST("", mdw.PermissionMiddleware("roles", "create"), h.Create)
		role.GET("/:id", mdw.PermissionMiddleware("roles", "view"), h.GetByID)
		role.PUT("/:id", mdw.PermissionMiddleware("roles", "update"), h.Update)
		role.DELETE("/:id", mdw.PermissionMiddleware("roles", "delete"), h.Delete)

		// Permission and menu assignment
		role.POST("/:id/permissions", mdw.PermissionMiddleware("roles", "assign_permissions"), h.AssignPermissions)
		role.POST("/:id/menus", mdw.PermissionMiddleware("roles", "assign_menus"), h.AssignMenus)
	}
}

func (r *Routes) PermissionRoutes() {
	repo := permissionRepo.NewPermissionRepo(r.DB)
	svc := permissionSvc.NewPermissionService(repo)
	repoAudit := auditRepo.NewAuditRepo(r.DB)
	svcAudit := auditSvc.NewAuditService(repoAudit)
	h := permissionHandler.NewPermissionHandler(svc, svcAudit)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, repo)

	// List endpoints
	r.App.GET("/api/permissions", mdw.AuthMiddleware(), mdw.PermissionMiddleware("permissions", "list"), h.GetAll)

	// Get current user's permissions
	r.App.GET("/api/permissions/me", mdw.AuthMiddleware(), h.GetUserPermissions)

	// CRUD endpoints
	permission := r.App.Group("/api/permission").Use(mdw.AuthMiddleware())
	{
		permission.POST("", mdw.PermissionMiddleware("permissions", "create"), h.Create)
		permission.GET("/:id", mdw.PermissionMiddleware("permissions", "view"), h.GetByID)
		permission.PUT("/:id", mdw.PermissionMiddleware("permissions", "update"), h.Update)
		permission.DELETE("/:id", mdw.PermissionMiddleware("permissions", "delete"), h.Delete)
	}
}

func (r *Routes) MenuRoutes() {
	repo := menuRepo.NewMenuRepo(r.DB)
	svc := menuSvc.NewMenuService(repo)
	repoAudit := auditRepo.NewAuditRepo(r.DB)
	svcAudit := auditSvc.NewAuditService(repoAudit)
	h := menuHandler.NewMenuHandler(svc, svcAudit)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	// Public endpoints for authenticated users
	r.App.GET("/api/menus/active", mdw.AuthMiddleware(), h.GetActiveMenus)
	r.App.GET("/api/menus/me", mdw.AuthMiddleware(), h.GetUserMenus)

	// List endpoints
	r.App.GET("/api/menus", mdw.AuthMiddleware(), mdw.PermissionMiddleware("menus", "list"), h.GetAll)

	// CRUD endpoints
	menu := r.App.Group("/api/menu").Use(mdw.AuthMiddleware())
	{
		menu.POST("", mdw.PermissionMiddleware("menus", "create"), h.Create)
		menu.GET("/:id", mdw.PermissionMiddleware("menus", "view"), h.GetByID)
		menu.PUT("/:id", mdw.PermissionMiddleware("menus", "update"), h.Update)
		menu.DELETE("/:id", mdw.PermissionMiddleware("menus", "delete"), h.Delete)
	}
}

func (r *Routes) TenantRoutes() {
	repo := tenantRepo.NewTenantRepo(r.DB)
	repoUser := userRepo.NewUserRepo(r.DB)
	svc := tenantSvc.NewTenantService(repo, repoUser)
	repoAudit := auditRepo.NewAuditRepo(r.DB)
	svcAudit := auditSvc.NewAuditService(repoAudit)
	h := tenantHandler.NewTenantHandler(svc, svcAudit)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	r.App.GET("/api/tenants", mdw.AuthMiddleware(), mdw.PermissionMiddleware("tenants", "list"), h.GetAll)

	tenant := r.App.Group("/api/tenants").Use(mdw.AuthMiddleware())
	{
		tenant.POST("", mdw.PermissionMiddleware("tenants", "create"), h.Create)
		tenant.GET("/:id", mdw.PermissionMiddleware("tenants", "view"), h.GetByID)
		tenant.PATCH("/:id", mdw.PermissionMiddleware("tenants", "update"), h.Update)
		tenant.DELETE("/:id", mdw.PermissionMiddleware("tenants", "delete"), h.Delete)
		tenant.POST("/:id/members", mdw.PermissionMiddleware("tenants", "update"), h.AddMember)
	}
}

func (r *Routes) SessionRoutes() {
	redisClient := database.GetRedisClient()
	if redisClient == nil {
		logger.WriteLog(logger.LogLevelDebug, "Redis not available, session routes will not be registered")
		return
	}

	repo := sessionRepo.NewSessionRepository(redisClient)
	svc := sessionSvc.NewSessionService(repo)
	h := sessionHandler.NewSessionHandler(svc)
	blacklistRepo := authRepo.NewBlacklistRepo(r.DB)
	pRepo := permissionRepo.NewPermissionRepo(r.DB)
	mdw := middlewares.NewMiddleware(blacklistRepo, pRepo)

	// Session management endpoints (authenticated users only)
	sessionGroup := r.App.Group("/api/user").Use(mdw.AuthMiddleware())
	{
		sessionGroup.GET("/sessions", h.GetActiveSessions)
		sessionGroup.DELETE("/session/:session_id", h.RevokeSession)
		sessionGroup.POST("/sessions/revoke-others", h.RevokeAllOtherSessions)
	}

	logger.WriteLog(logger.LogLevelInfo, "Session management routes registered")
}

func (r *Routes) LocationRoutes() {
	svc := locationSvc.NewLocationService()
	h := locationHandler.NewLocationHandler(svc)

	location := r.App.Group("/api/location")
	{
		location.GET("/province", h.GetProvince)
		location.GET("/city", h.GetCity)
		location.GET("/district", h.GetDistrict)
		location.GET("/village", h.GetVillage)
	}
}
