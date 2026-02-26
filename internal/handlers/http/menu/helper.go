package handlermenu

import (
	domainaudit "anniversary-site/internal/domain/audit"
	handlercommon "anniversary-site/internal/handlers/http/common"

	"github.com/gin-gonic/gin"
)

func (h *MenuHandler) writeAudit(ctx *gin.Context, event domainaudit.AuditEvent) {
	handlercommon.WriteAudit(ctx, h.AuditService, event, "MenuHandler")
}
