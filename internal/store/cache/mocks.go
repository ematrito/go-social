package cache

import (
	"context"

	"github.com/ematrito/go-social/internal/store"
)

func NewMockCacheStore() Storage {
	return Storage{
		Users: &MockCacheUserStore{},
	}
}

type MockCacheUserStore struct{}

func (m *MockCacheUserStore) Get(ctx context.Context, id int64) (*store.User, error) {
	return nil, nil
}

func (m *MockCacheUserStore) Set(ctx context.Context, user *store.User) error {
	return nil
}
