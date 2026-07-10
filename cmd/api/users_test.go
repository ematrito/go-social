package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"
)

func TestGetUser(t *testing.T) {

	app := NewTestApplication(t)
	mux := app.mount()

	token, err := app.authenticator.GenerateToken(nil)
	if err != nil {
		t.Fatal(err)
	}

	t.Run("should not allow unauthenticated requests", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodGet, "/v1/users/1", nil)
		if err != nil {
			t.Fatal(err)
		}

		rr := executeRequest(req, mux)

		checkResponseCode(t, http.StatusUnauthorized, rr.Code)
	})

	t.Run("should allow authenticated requests", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodGet, "/v1/users/1", nil)
		if err != nil {
			t.Fatal(err)
		}

		req.Header.Set("Authorization", "Bearer "+token)
		rr := executeRequest(req, mux)

		checkResponseCode(t, http.StatusOK, rr.Code)
	})
}
func TestRegisterUser(t *testing.T) {
	app := NewTestApplication(t)
	mux := app.mount()

	payload := RegisterUserPayload{
		Username: "mimmo",
		Email:    "mimmo@modem.com",
		Password: "password",
	}

	body, _ := json.Marshal(payload)

	t.Run("should register a user", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodPost, "/v1/authentication/user", bytes.NewBuffer(body))
		if err != nil {
			t.Fatal(err)
		}
		req.Header.Set("Content-Type", "application/json")

		rr := executeRequest(req, mux)

		t.Logf("response body: %s", rr.Body.String())
		checkResponseCode(t, http.StatusCreated, rr.Code)
	})
}
