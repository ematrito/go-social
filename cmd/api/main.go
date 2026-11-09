package main

import (
	"expvar"
	"runtime"
	"time"

	"github.com/ematrito/go-social/internal/auth"
	"github.com/ematrito/go-social/internal/db"
	"github.com/ematrito/go-social/internal/env"
	"github.com/ematrito/go-social/internal/mailer"
	"github.com/ematrito/go-social/internal/ratelimiter"
	"github.com/ematrito/go-social/internal/store"
	"github.com/ematrito/go-social/internal/store/cache"

	_ "github.com/ematrito/go-social/cmd/api/docs"

	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"
)

const version = "1.1.0"

//	@title			Go-social API
//	@version		1.0
//	@description	Go-social api description. Go Gophers.
//	@termsOfService	http://swagger.io/terms/

//	@contact.name	API Support
//	@contact.url	http://www.swagger.io/support
//	@contact.email	support@swagger.io

//	@license.name	Apache 2.0
//	@license.url	http://www.apache.org/licenses/LICENSE-2.0.html

//	@BasePath	/v1

//	@securityDefinitions.apikey	ApiKeyAuth
//	@in							header
//	@name						Authorization
//	@description

func main() {
	cfg := config{
		addr:   env.GetString("ADDR", ":8080"),
		apiURL: env.GetString("EXTERNAL_URL", "localhost:8080"),
		db: dbConfig{
			addr:         env.GetString("DB_ADDR", "postgres://postgres:postgres@localhost/social?sslmode=disable"),
			maxOpenConns: env.GetInt("DB_MAX_OPEN_CONNS", 30),
			maxIdleConns: env.GetInt("DB_MAX_IDLE_CONNS", 30),
			maxIdleTime:  env.GetString("DB_MAX_IDLE_TIME", "15m"),
		},
		redisCfg: redisConfig{
			addr:    env.GetString("REDIS_ADDR", "localhost:6379"),
			pw:      env.GetString("REDIS_PW", ""),
			db:      env.GetInt("REDIS_DB", 0),
			enabled: env.GetBool("REDIS_ENABLED", false),
		},
		env: env.GetString("ENV", "development"),
		mail: mailConfig{
			exp:       time.Hour * 24 * 3,
			fromEmail: env.GetString("FROM_EMAIL", ""),
			sendGrid: sendGridConfig{
				apiKey: env.GetString("SENDGRID_API_KEY", ""),
			},
		},
		frontendURL: env.GetString("FRONTEND_URL", "http://localhost:5173"),
		auth: authConfig{
			basic: basicConfig{
				user: env.GetString("AUTH_BASIC_USER", "dev"),
				pass: env.GetString("AUTH_BASIC_PASS", "dev"),
			},
			token: tokenConfig{
				secret: env.GetString("AUTH_TOKEN_SECRET", "gophersocial-dev-secret"),
				exp:    time.Hour * 24 * 3, // 3 days
				iss:    "gophersocial",
			},
		},
		rateLimiter: ratelimiter.Config{
			RequestsPerTimeFrame: env.GetInt("RATE_LIMITER_REQUESTS_COUNT", 20),
			TimeFrame:            time.Second * 5,
			Enabled:              env.GetBool("RATE_LIMITER_ENABLED", true),
		},
	}

	// Logger
	logger := zap.Must(zap.NewProduction()).With(zap.String("env", env.GetString("ENV", ""))).Sugar()
	defer logger.Sync()

	db, err := db.New(cfg.db.addr, cfg.db.maxOpenConns, cfg.db.maxIdleConns, cfg.db.maxIdleTime)

	if err != nil {
		logger.Fatal(err)
	}

	defer db.Close()
	logger.Info("Database connection pool established")

	store := store.NewStorage(db)

	// cache
	var redisDB *redis.Client
	if cfg.redisCfg.enabled {
		redisDB = cache.NewRedisClient(cfg.redisCfg.addr, cfg.redisCfg.pw, cfg.redisCfg.db)
		logger.Info("Redis cache connection pool established")
	}
	cacheStorage := cache.NewRedisStorage(redisDB)

	// Rate Limiter
	rateLimiter := ratelimiter.NewFixedWindowRateLimiter(
		cfg.rateLimiter.RequestsPerTimeFrame,
		cfg.rateLimiter.TimeFrame,
	)

	jwtAuthenticator := auth.NewJWTAuthenticator(cfg.auth.token.secret, cfg.auth.token.iss, cfg.auth.token.iss)

	var emailClient mailer.Client

	if cfg.env == "development" {
		smtpAddr := env.GetString("MAILPIT_SMTP_ADDR", "localhost:1025")

		emailClient = mailer.NewSMTPMailer(cfg.mail.fromEmail, smtpAddr)
		logger.Infow("mailer configured", "provider", "mailpit", "addr", smtpAddr)

	} else {
		emailClient = mailer.NewSendGrid(cfg.mail.sendGrid.apiKey, cfg.mail.fromEmail)
		logger.Infow("mailer configured", "provider", "sendgrid")
	}

	app := &application{
		config:        cfg,
		store:         store,
		logger:        logger,
		mailer:        emailClient,
		authenticator: jwtAuthenticator,
		cacheStorage:  cacheStorage,
		rateLimiter:   rateLimiter,
	}

	// Metrics collected
	expvar.NewString("version").Set(version)
	expvar.Publish("database", expvar.Func(func() any {
		return db.Stats()
	}))
	expvar.Publish("goroutines", expvar.Func(func() any {
		return runtime.NumGoroutine()
	}))

	mux := app.mount()

	logger.Fatal(app.run(mux))
}
