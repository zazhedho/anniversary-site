package handlertenant

import (
	domainaudit "anniversary-site/internal/domain/audit"
	"anniversary-site/internal/dto"
	handlercommon "anniversary-site/internal/handlers/http/common"
	interfaceaudit "anniversary-site/internal/interfaces/audit"
	interfacetenant "anniversary-site/internal/interfaces/tenant"
	servicetenant "anniversary-site/internal/services/tenant"
	"anniversary-site/middlewares"
	"anniversary-site/pkg/filter"
	"anniversary-site/pkg/logger"
	"anniversary-site/pkg/messages"
	"anniversary-site/pkg/response"
	"anniversary-site/utils"
	"errors"
	"fmt"
	"net/http"
	"reflect"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TenantHandler struct {
	Service      interfacetenant.ServiceTenantInterface
	AuditService interfaceaudit.ServiceAuditInterface
}

func NewTenantHandler(s interfacetenant.ServiceTenantInterface, auditService interfaceaudit.ServiceAuditInterface) *TenantHandler {
	return &TenantHandler{
		Service:      s,
		AuditService: auditService,
	}
}

func (h *TenantHandler) GetAll(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	logPrefix := "[TenantHandler][GetAll]"

	params, err := filter.GetBaseParams(ctx, "created_at", "desc", 10)
	if err != nil {
		logger.WriteLogWithContext(ctx, logger.LogLevelError, fmt.Sprintf("%s; GetBaseParams ERROR: %s", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logID, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	userID := utils.InterfaceString(ctx.GetString("userId"))
	hasAccessAll := middlewares.HasAccess(ctx, "tenants", "access_all")

	data, total, err := h.Service.GetAll(params, userID, hasAccessAll)
	if err != nil {
		logger.WriteLogWithContext(ctx, logger.LogLevelError, fmt.Sprintf("%s; Service.GetAll ERROR: %s", logPrefix, err.Error()))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logID, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(total), params.Page, params.Limit, logID, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *TenantHandler) Create(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	logPrefix := "[TenantHandler][Create]"
	var req dto.TenantCreate

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLogWithContext(ctx, logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logID, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	userID := utils.InterfaceString(ctx.GetString("userId"))
	hasAccessAll := middlewares.HasAccess(ctx, "tenants", "access_all")
	data, err := h.Service.Create(req, userID, hasAccessAll)
	if err != nil {
		h.writeAudit(ctx, domainaudit.AuditEvent{
			Action:       domainaudit.ActionCreate,
			Resource:     "tenant",
			Status:       domainaudit.StatusFailed,
			Message:      "Failed to create tenant",
			ErrorMessage: err.Error(),
			AfterData:    req,
		})

		if errors.Is(err, gorm.ErrDuplicatedKey) ||
			errors.Is(err, gorm.ErrForeignKeyViolated) ||
			errors.Is(err, servicetenant.ErrTenantSlugTaken) ||
			errors.Is(err, servicetenant.ErrTenantLimitReached) {
			res := response.Response(http.StatusBadRequest, err.Error(), logID, nil)
			res.Error = err.Error()
			ctx.JSON(http.StatusBadRequest, res)
			return
		}

		logger.WriteLogWithContext(ctx, logger.LogLevelError, fmt.Sprintf("%s; Service.Create ERROR: %s", logPrefix, err.Error()))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logID, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	h.writeAudit(ctx, domainaudit.AuditEvent{
		Action:     domainaudit.ActionCreate,
		Resource:   "tenant",
		ResourceID: data.Tenant.ID,
		Status:     domainaudit.StatusSuccess,
		Message:    "Created tenant",
		AfterData:  data,
	})

	res := response.Response(http.StatusCreated, "Tenant created successfully", logID, data)
	ctx.JSON(http.StatusCreated, res)
}

func (h *TenantHandler) GetByID(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	logPrefix := "[TenantHandler][GetByID]"
	id := ctx.Param("id")
	userID := utils.InterfaceString(ctx.GetString("userId"))
	hasAccessAll := middlewares.HasAccess(ctx, "tenants", "access_all")

	data, err := h.Service.GetByID(id, userID, hasAccessAll)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, "Tenant not found", logID, nil)
			res.Error = err.Error()
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		if err.Error() == "access denied to tenant" {
			res := response.Response(http.StatusForbidden, messages.MsgDenied, logID, nil)
			res.Error = response.Errors{Code: http.StatusForbidden, Message: messages.AccessDenied}
			ctx.JSON(http.StatusForbidden, res)
			return
		}
		logger.WriteLogWithContext(ctx, logger.LogLevelError, fmt.Sprintf("%s; Service.GetByID ERROR: %s", logPrefix, err.Error()))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logID, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get tenant successfully", logID, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *TenantHandler) Update(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	logPrefix := "[TenantHandler][Update]"
	id := ctx.Param("id")
	var req dto.TenantUpdate

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLogWithContext(ctx, logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logID, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	userID := utils.InterfaceString(ctx.GetString("userId"))
	hasAccessAll := middlewares.HasAccess(ctx, "tenants", "access_all")
	before, _ := h.Service.GetByID(id, userID, hasAccessAll)

	data, err := h.Service.Update(id, req, userID, hasAccessAll)
	if err != nil {
		h.writeAudit(ctx, domainaudit.AuditEvent{
			Action:       domainaudit.ActionUpdate,
			Resource:     "tenant",
			ResourceID:   id,
			Status:       domainaudit.StatusFailed,
			Message:      "Failed to update tenant",
			ErrorMessage: err.Error(),
			BeforeData:   before,
			AfterData:    req,
		})

		statusCode := http.StatusInternalServerError
		if errors.Is(err, gorm.ErrRecordNotFound) {
			statusCode = http.StatusNotFound
		} else if err.Error() == "access denied to tenant" {
			statusCode = http.StatusForbidden
		} else if errors.Is(err, gorm.ErrDuplicatedKey) || err.Error() == "tenant slug already exists" || err.Error() == "invalid tenant slug" || err.Error() == "tenant slug can only be set once" {
			statusCode = http.StatusBadRequest
		}
		res := response.Response(statusCode, err.Error(), logID, nil)
		res.Error = err.Error()
		ctx.JSON(statusCode, res)
		return
	}

	h.writeAudit(ctx, domainaudit.AuditEvent{
		Action:     domainaudit.ActionUpdate,
		Resource:   "tenant",
		ResourceID: data.Tenant.ID,
		Status:     domainaudit.StatusSuccess,
		Message:    "Updated tenant",
		BeforeData: before,
		AfterData:  data,
	})

	res := response.Response(http.StatusOK, "Tenant updated successfully", logID, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *TenantHandler) Delete(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	id := ctx.Param("id")
	userID := utils.InterfaceString(ctx.GetString("userId"))
	hasAccessAll := middlewares.HasAccess(ctx, "tenants", "access_all")

	before, _ := h.Service.GetByID(id, userID, hasAccessAll)
	err := h.Service.Delete(id, userID, hasAccessAll)
	if err != nil {
		h.writeAudit(ctx, domainaudit.AuditEvent{
			Action:       domainaudit.ActionDelete,
			Resource:     "tenant",
			ResourceID:   id,
			Status:       domainaudit.StatusFailed,
			Message:      "Failed to delete tenant",
			ErrorMessage: err.Error(),
			BeforeData:   before,
		})

		statusCode := http.StatusInternalServerError
		if errors.Is(err, gorm.ErrRecordNotFound) {
			statusCode = http.StatusNotFound
		} else if err.Error() == "access denied to tenant" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "default tenant cannot be deleted" {
			statusCode = http.StatusBadRequest
		}
		res := response.Response(statusCode, err.Error(), logID, nil)
		res.Error = err.Error()
		ctx.JSON(statusCode, res)
		return
	}

	h.writeAudit(ctx, domainaudit.AuditEvent{
		Action:     domainaudit.ActionDelete,
		Resource:   "tenant",
		ResourceID: id,
		Status:     domainaudit.StatusSuccess,
		Message:    "Deleted tenant",
		BeforeData: before,
	})

	res := response.Response(http.StatusOK, "Tenant deleted successfully", logID, nil)
	ctx.JSON(http.StatusOK, res)
}

func (h *TenantHandler) AddMember(ctx *gin.Context) {
	logID := utils.GenerateLogId(ctx)
	logPrefix := "[TenantHandler][AddMember]"
	id := ctx.Param("id")
	var req dto.TenantAssignMember

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLogWithContext(ctx, logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logID, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	userID := utils.InterfaceString(ctx.GetString("userId"))
	hasAccessAll := middlewares.HasAccess(ctx, "tenants", "access_all")

	before, _ := h.Service.GetByID(id, userID, hasAccessAll)
	members, err := h.Service.AddMember(id, req, userID, hasAccessAll)
	if err != nil {
		h.writeAudit(ctx, domainaudit.AuditEvent{
			Action:       domainaudit.ActionAssign,
			Resource:     "tenant_members",
			ResourceID:   id,
			Status:       domainaudit.StatusFailed,
			Message:      "Failed to assign tenant member",
			ErrorMessage: err.Error(),
			BeforeData:   before,
			AfterData:    req,
		})

		statusCode := http.StatusInternalServerError
		if errors.Is(err, gorm.ErrRecordNotFound) {
			statusCode = http.StatusNotFound
		} else if err.Error() == "access denied to tenant" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "user not found" || err.Error() == "user_id is required" {
			statusCode = http.StatusBadRequest
		}
		res := response.Response(statusCode, err.Error(), logID, nil)
		res.Error = err.Error()
		ctx.JSON(statusCode, res)
		return
	}

	h.writeAudit(ctx, domainaudit.AuditEvent{
		Action:     domainaudit.ActionAssign,
		Resource:   "tenant_members",
		ResourceID: id,
		Status:     domainaudit.StatusSuccess,
		Message:    "Assigned member to tenant",
		BeforeData: before,
		AfterData:  members,
	})

	res := response.Response(http.StatusOK, "Tenant members updated successfully", logID, members)
	ctx.JSON(http.StatusOK, res)
}

func (h *TenantHandler) writeAudit(ctx *gin.Context, event domainaudit.AuditEvent) {
	handlercommon.WriteAudit(ctx, h.AuditService, event, "TenantHandler")
}
