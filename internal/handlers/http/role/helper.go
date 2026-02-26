package handlerrole

import (
	domainaudit "anniversary-site/internal/domain/audit"
	handlercommon "anniversary-site/internal/handlers/http/common"

	"github.com/gin-gonic/gin"
)

func (h *RoleHandler) writeAudit(ctx *gin.Context, event domainaudit.AuditEvent) {
	handlercommon.WriteAudit(ctx, h.AuditService, event, "RoleHandler")
}
