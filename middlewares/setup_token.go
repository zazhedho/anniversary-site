package middlewares

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func SetupTokenMiddleware(setupEnable bool, setupToken string) gin.HandlerFunc {
	normalizedToken := strings.TrimSpace(setupToken)

	return func(ctx *gin.Context) {
		if !setupEnable {
			ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"status": false, "message": "setup API disabled"})
			return
		}

		if normalizedToken == "" {
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

		if subtle.ConstantTimeCompare([]byte(provided), []byte(normalizedToken)) != 1 {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"status": false, "message": "invalid setup token"})
			return
		}

		ctx.Next()
	}
}
