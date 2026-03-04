package main

import (
	"anniversary-site/infrastructure/database"
	"anniversary-site/internal/router"
	"anniversary-site/pkg/config"
	"anniversary-site/pkg/logger"
	"anniversary-site/utils"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"strings"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
)

func FailOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}

func normalizeAnniversaryStore(raw string) string {
	value := strings.ToLower(strings.TrimSpace(raw))
	if value == "json" || value == "db" {
		return value
	}
	return "json"
}

func resolvePublicEndpoint(port string, serverIP string) string {
	if baseURL := strings.TrimSpace(utils.GetEnv("PUBLIC_BASE_URL", "")); baseURL != "" {
		return strings.TrimRight(baseURL, "/") + "/api/public/anniversary?lang=id"
	}

	host := strings.TrimSpace(serverIP)
	if host == "" || host == "unknown" {
		host = "127.0.0.1"
	}

	return "http://" + net.JoinHostPort(host, port) + "/api/public/anniversary?lang=id"
}

func logStartupMode(port string, runMigrate bool, enableAdminAPI bool, anniversaryStore string, serverIP string) {
	dataFile := utils.GetEnv("ANNIVERSARY_DATA_FILE", "./data/anniversary.json")
	uploadMaxMB := utils.GetEnv("ANNIVERSARY_UPLOAD_MAX_MB", 50)
	storageProvider := strings.ToLower(strings.TrimSpace(utils.GetEnv("STORAGE_PROVIDER", "minio")))
	if storageProvider == "" {
		storageProvider = "minio"
	}

	dbRequired := runMigrate || enableAdminAPI || anniversaryStore == "db"
	modeLabel := "public/setup JSON mode"
	if enableAdminAPI {
		modeLabel = "admin mode (RBAC + anniversary)"
	} else if anniversaryStore == "db" {
		modeLabel = "public/setup with DB-backed anniversary config"
	}

	logger.WriteLog(logger.LogLevelInfo, fmt.Sprintf(
		"Startup mode: %s | port=%s | migrate=%t | admin_api=%t | anniversary_store=%s | db_required=%t",
		modeLabel,
		port,
		runMigrate,
		enableAdminAPI,
		anniversaryStore,
		dbRequired,
	))
	logger.WriteLog(logger.LogLevelInfo, fmt.Sprintf(
		"Setup summary: setup_auth=jwt | data_file=%s | upload_max_mb=%d | storage_provider=%s",
		dataFile,
		uploadMaxMB,
		storageProvider,
	))
	logger.WriteLog(logger.LogLevelInfo, fmt.Sprintf("Public endpoint: %s", resolvePublicEndpoint(port, serverIP)))

	if anniversaryStore == "json" && !enableAdminAPI && !runMigrate {
		logger.WriteLog(logger.LogLevelInfo, "No-DB mode active: backend can run without PostgreSQL/Redis.")
		return
	}

	if anniversaryStore == "json" && !enableAdminAPI && runMigrate {
		logger.WriteLog(logger.LogLevelInfo, "NOTICE: ANNIVERSARY_STORE=json but migration is enabled. DB is still required for startup migration.")
		logger.WriteLog(logger.LogLevelInfo, "Tip: run `go run . -migrate=false` to start pure JSON no-DB mode.")
	}
}

func main() {
	var (
		err        error
		sqlDb      *sql.DB
		runMigrate bool
	)
	if timeZone, err := time.LoadLocation("Asia/Jakarta"); err != nil {
		logger.WriteLog(logger.LogLevelError, "time.LoadLocation - Error: "+err.Error())
	} else {
		time.Local = timeZone
	}

	if err = godotenv.Load(".env"); err != nil && os.Getenv("APP_ENV") == "" {
		log.Fatalf("Error app environment")
	}

	myAddr := "unknown"
	addrs, _ := net.InterfaceAddrs()
	for _, address := range addrs {
		if ipNet, ok := address.(*net.IPNet); ok && !ipNet.IP.IsLoopback() {
			if ipNet.IP.To4() != nil {
				myAddr = ipNet.IP.String()
				break
			}
		}
	}

	serverIP := myAddr
	serverIPForLog := myAddr
	if len(serverIPForLog) < 15 {
		serverIPForLog += strings.Repeat(" ", 15-len(serverIPForLog))
	}
	os.Setenv("ServerIP", serverIPForLog)
	logger.WriteLog(logger.LogLevelInfo, "Server IP: "+serverIPForLog)

	var port, appName string
	flag.StringVar(&port, "port", os.Getenv("PORT"), "port of the service")
	flag.StringVar(&appName, "appname", os.Getenv("APP_NAME"), "service name")
	flag.BoolVar(&runMigrate, "migrate", true, "run database migration before starting server")
	flag.Parse()
	if strings.TrimSpace(port) == "" {
		port = "8080"
	}
	logger.WriteLog(logger.LogLevelInfo, "APP: "+appName+"; PORT: "+port)

	enableAdminAPI := utils.GetEnv("ENABLE_ADMIN_API", false)
	storeRaw := utils.GetEnv("ANNIVERSARY_STORE", "json")
	anniversaryStore := normalizeAnniversaryStore(storeRaw)
	if normalized := strings.ToLower(strings.TrimSpace(storeRaw)); normalized != anniversaryStore {
		logger.WriteLog(logger.LogLevelInfo, fmt.Sprintf("ANNIVERSARY_STORE=%q is invalid, defaulting to %q", storeRaw, anniversaryStore))
	}
	logStartupMode(port, runMigrate, enableAdminAPI, anniversaryStore, serverIP)

	if enableAdminAPI {
		confID := config.GetAppConf("CONFIG_ID", "", nil)
		logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("ConfigID: %s", confID))
	}

	if runMigrate {
		runMigration()
	}

	routes := router.NewRoutes()
	connectDB := func() {
		if routes.DB != nil {
			return
		}

		routes.DB, sqlDb, err = database.ConnDb()
		FailOnError(err, "Failed to open db")
	}

	if anniversaryStore == "db" {
		connectDB()
		logger.WriteLog(logger.LogLevelInfo, "ANNIVERSARY_STORE=db: anniversary config will be stored in database")
	}

	routes.AnniversaryRoutes()

	if enableAdminAPI {
		redisClient, redisErr := database.InitRedis()
		if redisErr != nil {
			logger.WriteLog(logger.LogLevelDebug, "Redis not available, session management will be disabled")
		} else {
			defer func() {
				if closeErr := database.CloseRedis(); closeErr != nil {
					logger.WriteLog(logger.LogLevelError, "Failed to close redis connection: "+closeErr.Error())
				}
			}()
			logger.WriteLog(logger.LogLevelInfo, "Redis initialized, session management enabled")
		}

		connectDB()

		routes.UserRoutes()
		routes.RoleRoutes()
		routes.PermissionRoutes()
		routes.MenuRoutes()
		routes.TenantRoutes()
		routes.LocationRoutes()

		// Register session routes if Redis is available
		if redisClient != nil {
			routes.SessionRoutes()
		}

		logger.WriteLog(logger.LogLevelInfo, "All routes registered successfully")
	} else {
		logger.WriteLog(logger.LogLevelInfo, "ENABLE_ADMIN_API=false: running anniversary public/setup API only")
	}

	if sqlDb != nil {
		defer sqlDb.Close()
	}

	err = routes.App.Run(fmt.Sprintf(":%s", port))
	FailOnError(err, "Failed run service")
}

func runMigration() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
			utils.GetEnv("DB_USERNAME", ""),
			utils.GetEnv("DB_PASS", ""),
			utils.GetEnv("DB_HOST", ""),
			utils.GetEnv("DB_PORT", ""),
			utils.GetEnv("DB_NAME", ""),
			utils.GetEnv("DB_SSLMODE", "disable"))
	}

	m, err := migrate.New(utils.GetEnv("PATH_MIGRATE", "file://migrations"), dsn)
	if err != nil {
		log.Fatal(err)
	}

	if err := m.Up(); err != nil && err.Error() != "no change" {
		log.Fatal(err)
	}
	logger.WriteLog(logger.LogLevelInfo, "Migration Success")
}
