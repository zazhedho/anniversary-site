package anniversary

import (
	"crypto/subtle"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	store       *Store
	setupToken  string
	setupEnable bool
	loc         *time.Location
}

func NewHandler(dataFilePath, setupToken string, setupEnable bool) *Handler {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		loc = time.FixedZone("WIB", 7*60*60)
	}

	return &Handler{
		store:       NewStore(dataFilePath, loc),
		setupToken:  strings.TrimSpace(setupToken),
		setupEnable: setupEnable,
		loc:         loc,
	}
}

func (h *Handler) RegisterRoutes(app *gin.Engine) {
	public := app.Group("/api/public")
	{
		public.GET("/anniversary", h.GetPublic)
		public.GET("/anniversary/moments", h.GetMoments)
	}

	setup := app.Group("/api/setup")
	setup.Use(h.setupAuthMiddleware())
	{
		setup.GET("/anniversary", h.GetSetup)
		setup.PUT("/anniversary", h.UpdateConfig)
		setup.PUT("/anniversary/moments", h.ReplaceMoments)
		setup.POST("/anniversary/moments", h.AddMoment)
		setup.DELETE("/anniversary/moments/:year", h.DeleteMoment)
	}
}

func (h *Handler) GetPublic(ctx *gin.Context) {
	cfg, err := h.store.Load()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	payload, err := BuildPublicPayload(cfg, time.Now(), h.loc)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "data": payload})
}

func (h *Handler) GetMoments(ctx *gin.Context) {
	cfg, err := h.store.Load()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	payload, err := BuildPublicPayload(cfg, time.Now(), h.loc)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "data": payload.Moments})
}

func (h *Handler) GetSetup(ctx *gin.Context) {
	cfg, err := h.store.Load()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"status": true, "data": cfg})
}

func (h *Handler) UpdateConfig(ctx *gin.Context) {
	var req SiteConfig
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid JSON body"})
		return
	}

	saved, err := h.store.Save(req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": err.Error()})
		return
	}

	payload, err := BuildPublicPayload(saved, time.Now(), h.loc)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "message": "config updated", "data": payload})
}

func (h *Handler) ReplaceMoments(ctx *gin.Context) {
	var req []AnnualMoment
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid JSON body"})
		return
	}

	cfg, err := h.store.Load()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	cfg.Moments = req
	saved, err := h.store.Save(cfg)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "message": "moments replaced", "data": saved.Moments})
}

func (h *Handler) AddMoment(ctx *gin.Context) {
	var req AnnualMoment
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid JSON body"})
		return
	}

	cfg, err := h.store.Load()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	cfg.Moments = append(cfg.Moments, req)
	saved, err := h.store.Save(cfg)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"status": true, "message": "moment added", "data": saved.Moments})
}

func (h *Handler) DeleteMoment(ctx *gin.Context) {
	year, err := strconv.Atoi(ctx.Param("year"))
	if err != nil || year < 1 {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid year"})
		return
	}

	cfg, err := h.store.Load()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	nextMoments := make([]AnnualMoment, 0, len(cfg.Moments))
	removed := false
	for _, item := range cfg.Moments {
		if item.Year == year {
			removed = true
			continue
		}
		nextMoments = append(nextMoments, item)
	}

	if !removed {
		ctx.JSON(http.StatusNotFound, gin.H{"status": false, "message": "moment not found"})
		return
	}

	cfg.Moments = nextMoments
	saved, err := h.store.Save(cfg)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "message": "moment deleted", "data": saved.Moments})
}

func (h *Handler) setupAuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		if !h.setupEnable {
			ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"status": false, "message": "setup API disabled"})
			return
		}

		if h.setupToken == "" {
			ctx.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"status": false, "message": "SETUP_TOKEN is not configured"})
			return
		}

		provided := strings.TrimSpace(ctx.GetHeader("X-Setup-Token"))
		if provided == "" {
			auth := strings.TrimSpace(ctx.GetHeader("Authorization"))
			if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
				provided = strings.TrimSpace(auth[7:])
			}
		}

		if subtle.ConstantTimeCompare([]byte(provided), []byte(h.setupToken)) != 1 {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"status": false, "message": "invalid setup token"})
			return
		}

		ctx.Next()
	}
}
