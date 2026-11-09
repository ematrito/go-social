package main

import (
	"log"

	"github.com/ematrito/go-social/internal/db"
	"github.com/ematrito/go-social/internal/env"
	"github.com/ematrito/go-social/internal/store"
)

func main() {
	addr := env.GetString("DB_ADDR", "postgres://postgres:postgres@localhost/social?sslmode=disable")
	conn, err := db.New(addr, 3, 3, "15m")
	if err != nil {
		log.Fatal(err)
	}

	defer conn.Close()

	store := store.NewStorage(conn)
	db.Seed(store, conn)
}
