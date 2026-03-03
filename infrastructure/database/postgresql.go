package database

import (
	"anniversary-site/pkg/logger"
	"anniversary-site/utils"
	"database/sql"
	"fmt"
	"net/url"
	"strings"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnDb() (db *gorm.DB, sqlDB *sql.DB, err error) {
	dsn := utils.GetEnv("DATABASE_URL", "")

	if dsn == "" {
		dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Jakarta",
			utils.GetEnv("DB_HOST", ""),
			utils.GetEnv("DB_PORT", ""),
			utils.GetEnv("DB_USERNAME", ""),
			utils.GetEnv("DB_PASS", ""),
			utils.GetEnv("DB_NAME", ""),
			utils.GetEnv("DB_SSLMODE", "disable"))
	}
	logger.WriteLog(logger.LogLevelDebug, "ConnDb; Initialize db connection...")

	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{TranslateError: true})
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("ConnDb; %s Error: %s", redactDSN(dsn), err.Error()))
		return
	}

	maxIdle := 10
	maxIdleTime := 5 * time.Minute
	maxConn := 100
	maxLifeTime := time.Hour

	sqlDB, err = db.DB()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("ConnDb.sqlDB; %s Error: %s", redactDSN(dsn), err.Error()))
		return
	}

	sqlDB.SetMaxIdleConns(maxIdle)
	sqlDB.SetConnMaxIdleTime(maxIdleTime)
	sqlDB.SetMaxOpenConns(maxConn)
	sqlDB.SetConnMaxLifetime(maxLifeTime)

	db.Debug()

	return
}

func redactDSN(dsn string) string {
	parsed, err := url.Parse(dsn)
	if err == nil && parsed != nil {
		if parsed.User != nil {
			username := parsed.User.Username()
			parsed.User = url.UserPassword(username, "******")
		}
		return parsed.String()
	}

	// Best effort masking for key-value DSN format.
	replacer := strings.NewReplacer(
		"password=", "password=******",
		"Password=", "Password=******",
	)
	return replacer.Replace(dsn)
}
