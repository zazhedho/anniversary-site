package middlewares

import (
	"anniversary-site/pkg/logger"
	"anniversary-site/pkg/messages"
	"anniversary-site/pkg/response"
	"anniversary-site/utils"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ErrorHandler(c *gin.Context, err any) {
	logId := utils.GenerateLogId(c)
	logger.WriteLogWithContext(c, logger.LogLevelPanic, fmt.Sprintf("RECOVERY; Error: %+v;", err))

	res := response.Response(http.StatusInternalServerError, fmt.Sprintf("%s (%s)", messages.MsgFail, logId.String()), logId, nil)
	c.AbortWithStatusJSON(http.StatusInternalServerError, res)
}
