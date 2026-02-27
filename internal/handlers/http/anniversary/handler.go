package anniversary

import (
	"anniversary-site/internal/dto"
	interfaceanniversary "anniversary-site/internal/interfaces/anniversary"
	serviceanniversary "anniversary-site/internal/services/anniversary"
	"crypto/subtle"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service     interfaceanniversary.ServiceAnniversaryInterface
	setupToken  string
	setupEnable bool
}

func NewHandler(service interfaceanniversary.ServiceAnniversaryInterface, setupToken string, setupEnable bool) *Handler {
	return &Handler{
		service:     service,
		setupToken:  strings.TrimSpace(setupToken),
		setupEnable: setupEnable,
	}
}

func (h *Handler) GetPublic(ctx *gin.Context) {
	payload, err := h.service.GetPublicPayload(languageFromQuery(ctx.Query("lang")))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "data": payload})
}

func (h *Handler) GetMoments(ctx *gin.Context) {
	moments, err := h.service.GetPublicMoments(languageFromQuery(ctx.Query("lang")))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "data": moments})
}

func languageFromQuery(value string) string {
	if strings.EqualFold(strings.TrimSpace(value), "en") {
		return "en"
	}
	return "id"
}

func (h *Handler) GetSetup(ctx *gin.Context) {
	cfg, err := h.service.GetSetupConfig()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"status": true, "data": cfg})
}

func (h *Handler) UpdateConfig(ctx *gin.Context) {
	var req dto.AnniversarySiteConfig
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid JSON body"})
		return
	}

	payload, err := h.service.UpdateConfig(req)
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrSaveConfig) {
			ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "message": "config updated", "data": payload})
}

func (h *Handler) ReplaceMoments(ctx *gin.Context) {
	var req []dto.AnniversaryMoment
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid JSON body"})
		return
	}

	moments, err := h.service.ReplaceMoments(req)
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrLoadConfig) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
			return
		}
		if errors.Is(err, serviceanniversary.ErrSaveConfig) {
			ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "message": "moments replaced", "data": moments})
}

func (h *Handler) AddMoment(ctx *gin.Context) {
	var req dto.AnniversaryMoment
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid JSON body"})
		return
	}

	moments, err := h.service.AddMoment(req)
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrLoadConfig) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
			return
		}
		if errors.Is(err, serviceanniversary.ErrSaveConfig) {
			ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"status": true, "message": "moment added", "data": moments})
}

func (h *Handler) DeleteMoment(ctx *gin.Context) {
	year, err := strconv.Atoi(ctx.Param("year"))
	if err != nil || year < 1 {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid year"})
		return
	}

	moments, err := h.service.DeleteMoment(year)
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrMomentNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"status": false, "message": "moment not found"})
			return
		}
		if errors.Is(err, serviceanniversary.ErrLoadConfig) {
			ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
			return
		}
		if errors.Is(err, serviceanniversary.ErrSaveConfig) {
			ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "message": "moment deleted", "data": moments})
}

func (h *Handler) SetupAuthMiddleware() gin.HandlerFunc {
	return h.setupAuthMiddleware()
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
