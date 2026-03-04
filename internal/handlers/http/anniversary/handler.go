package anniversary

import (
	"anniversary-site/internal/dto"
	interfaceanniversary "anniversary-site/internal/interfaces/anniversary"
	serviceanniversary "anniversary-site/internal/services/anniversary"
	"anniversary-site/middlewares"
	"anniversary-site/pkg/storage"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service         interfaceanniversary.ServiceAnniversaryInterface
	storageProvider storage.StorageProvider
	maxUploadMB     int64
}

func NewHandler(
	service interfaceanniversary.ServiceAnniversaryInterface,
	storageProvider storage.StorageProvider,
	maxUploadMB int64,
) *Handler {
	if maxUploadMB <= 0 {
		maxUploadMB = 50
	}

	return &Handler{
		service:         service,
		storageProvider: storageProvider,
		maxUploadMB:     maxUploadMB,
	}
}

func (h *Handler) GetPublic(ctx *gin.Context) {
	tenantSlug := middlewares.TenantSlugFromContext(ctx)
	payload, err := h.service.GetPublicPayload(tenantSlug, languageFromQuery(ctx.Query("lang")))
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrTenantNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"status": false, "message": "tenant not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "data": payload})
}

func (h *Handler) GetMoments(ctx *gin.Context) {
	tenantSlug := middlewares.TenantSlugFromContext(ctx)
	moments, err := h.service.GetPublicMoments(tenantSlug, languageFromQuery(ctx.Query("lang")))
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrTenantNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"status": false, "message": "tenant not found"})
			return
		}
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
	tenantSlug := middlewares.TenantSlugFromContext(ctx)
	cfg, err := h.service.GetSetupConfig(tenantSlug)
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrTenantNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"status": false, "message": "tenant not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"status": true, "data": cfg})
}

func (h *Handler) UpdateConfig(ctx *gin.Context) {
	tenantSlug := middlewares.TenantSlugFromContext(ctx)
	var req dto.AnniversarySiteConfig
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid JSON body"})
		return
	}

	payload, err := h.service.UpdateConfig(tenantSlug, req)
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrTenantNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"status": false, "message": "tenant not found"})
			return
		}
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
	tenantSlug := middlewares.TenantSlugFromContext(ctx)
	var req []dto.AnniversaryMoment
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid JSON body"})
		return
	}

	moments, err := h.service.ReplaceMoments(tenantSlug, req)
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrTenantNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"status": false, "message": "tenant not found"})
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

	ctx.JSON(http.StatusOK, gin.H{"status": true, "message": "moments replaced", "data": moments})
}

func (h *Handler) AddMoment(ctx *gin.Context) {
	tenantSlug := middlewares.TenantSlugFromContext(ctx)
	var req dto.AnniversaryMoment
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid JSON body"})
		return
	}

	moments, err := h.service.AddMoment(tenantSlug, req)
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrTenantNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"status": false, "message": "tenant not found"})
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

	ctx.JSON(http.StatusCreated, gin.H{"status": true, "message": "moment added", "data": moments})
}

func (h *Handler) DeleteMoment(ctx *gin.Context) {
	tenantSlug := middlewares.TenantSlugFromContext(ctx)
	year, err := strconv.Atoi(ctx.Param("year"))
	if err != nil || year < 1 {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid year"})
		return
	}

	moments, err := h.service.DeleteMoment(tenantSlug, year)
	if err != nil {
		if errors.Is(err, serviceanniversary.ErrTenantNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"status": false, "message": "tenant not found"})
			return
		}
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

func (h *Handler) UploadMedia(ctx *gin.Context) {
	tenantSlug := middlewares.TenantSlugFromContext(ctx)
	if h.storageProvider == nil {
		ctx.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  false,
			"message": "storage provider is not initialized",
		})
		return
	}

	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "file is required"})
		return
	}

	maxBytes := h.maxUploadMB * 1024 * 1024
	if fileHeader.Size > maxBytes {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"status":  false,
			"message": fmt.Sprintf("file is too large (max %dMB)", h.maxUploadMB),
		})
		return
	}

	mediaType := normalizeUploadType(ctx.PostForm("type"))
	detectedType, _, err := validateUploadFile(fileHeader, mediaType)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": err.Error()})
		return
	}

	folder := "anniversary-photos"
	if mediaType == "video" {
		folder = "anniversary-videos"
	} else if mediaType == "audio" {
		folder = "anniversary-audios"
	}
	folder = fmt.Sprintf("tenant-%s/%s", sanitizePathSegment(tenantSlug), folder)

	file, err := fileHeader.Open()
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "failed opening upload file"})
		return
	}
	defer file.Close()

	fileURL, err := h.storageProvider.UploadFile(ctx, file, fileHeader, folder)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": fmt.Sprintf("failed upload media: %v", err)})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"status":  true,
		"message": "media uploaded",
		"data": gin.H{
			"url":       fileURL,
			"type":      mediaType,
			"mime_type": detectedType,
			"size":      fileHeader.Size,
			"filename":  fileHeader.Filename,
		},
	})
}
