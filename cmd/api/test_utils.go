package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ematrito/go-social/internal/auth"
	"github.com/ematrito/go-social/internal/mailer"
	"github.com/ematrito/go-social/internal/ratelimiter"
	"github.com/ematrito/go-social/internal/store"
	"github.com/ematrito/go-social/internal/store/cache"

	"go.uber.org/zap"
)

func NewTestApplication(t *testing.T, cfg config) *application {
	t.Helper()

	logger := zap.NewNop().Sugar()
	mockStore := store.NewMockStore()
	mockCacheStore := cache.NewMockCacheStore()
	testAuth := &auth.TestAuthenticator{}
	rateLimiter := ratelimiter.NewFixedWindowRateLimiter(20, time.Second*5)

	return &application{
		logger:        logger,
		store:         mockStore,
		cacheStorage:  mockCacheStore,
		authenticator: testAuth,
		mailer:        &mailer.MockMailer{},
		rateLimiter:   rateLimiter,
		config:        cfg,
	}
}

func executeRequest(req *http.Request, mux http.Handler) *httptest.ResponseRecorder {

	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	return rr
}

func checkResponseCode(t *testing.T, expected, actual int) {
	if expected != actual {
		t.Errorf("expected the response code to be %d and we got %d", expected, actual)
	}
}
