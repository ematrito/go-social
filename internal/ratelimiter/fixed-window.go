package ratelimiter

import (
	"sync"
	"time"
)

// TODO: implement rate limiter with redis for faster lookup
type FixedWindowRateLimiter struct {
	sync.RWMutex // struct embedding, every struct istance can call sync.Mutex method directly
	clients      map[string]int
	limit        int
	window       time.Duration
}

func NewFixedWindowRateLimiter(limit int, window time.Duration) *FixedWindowRateLimiter {
	return &FixedWindowRateLimiter{
		clients: make(map[string]int),
		limit:   limit,
		window:  window,
	}
}

func (fwrl *FixedWindowRateLimiter) Allow(ip string) (bool, time.Duration) {
	fwrl.RLock()
	count, exists := fwrl.clients[ip]
	fwrl.RUnlock()

	if !exists || count < fwrl.limit {
		fwrl.Lock()
		if !exists {
			go fwrl.resetCount(ip)
		}

		fwrl.clients[ip]++
		fwrl.Unlock()
		return true, 0
	}

	return false, fwrl.window
}

func (fwrl *FixedWindowRateLimiter) resetCount(ip string) {
	time.Sleep(fwrl.window)
	fwrl.Lock()
	delete(fwrl.clients, ip)
	fwrl.Unlock()
}
