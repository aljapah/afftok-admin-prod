package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

// GeoIPService provides IP to country lookup
type GeoIPService struct {
	cache    map[string]*geoIPCacheEntry
	cacheMux sync.RWMutex
	client   *http.Client
}

type geoIPCacheEntry struct {
	Country   string
	ExpiresAt time.Time
}

type ipAPIResponse struct {
	Status      string `json:"status"`
	Country     string `json:"country"`
	CountryCode string `json:"countryCode"`
	City        string `json:"city"`
	ISP         string `json:"isp"`
}

// NewGeoIPService creates a new GeoIP service
func NewGeoIPService() *GeoIPService {
	return &GeoIPService{
		cache: make(map[string]*geoIPCacheEntry),
		client: &http.Client{
			Timeout: 2 * time.Second, // Fast timeout to not slow down clicks
		},
	}
}

// GetCountry returns the country code for an IP address
func (s *GeoIPService) GetCountry(ip string) string {
	// Check cache first
	s.cacheMux.RLock()
	if entry, ok := s.cache[ip]; ok && time.Now().Before(entry.ExpiresAt) {
		s.cacheMux.RUnlock()
		return entry.Country
	}
	s.cacheMux.RUnlock()

	// Skip private/local IPs
	if isPrivateIP(ip) {
		return ""
	}

	// Call ip-api.com (free, no API key needed)
	// Rate limit: 45 requests/minute from an IP
	country := s.lookupIPAPI(ip)

	// Cache the result (even if empty, to avoid repeated lookups)
	s.cacheMux.Lock()
	s.cache[ip] = &geoIPCacheEntry{
		Country:   country,
		ExpiresAt: time.Now().Add(24 * time.Hour), // Cache for 24 hours
	}
	s.cacheMux.Unlock()

	return country
}

// lookupIPAPI calls ip-api.com for country lookup
func (s *GeoIPService) lookupIPAPI(ip string) string {
	url := fmt.Sprintf("http://ip-api.com/json/%s?fields=status,countryCode", ip)

	resp, err := s.client.Get(url)
	if err != nil {
		fmt.Printf("[GeoIP] API error for %s: %v\n", ip, err)
		return ""
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return ""
	}

	var result ipAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return ""
	}

	if result.Status == "success" {
		return result.CountryCode
	}

	return ""
}

// isPrivateIP checks if IP is private/local
func isPrivateIP(ip string) bool {
	// Simple check for common private ranges
	if len(ip) == 0 {
		return true
	}
	if ip == "127.0.0.1" || ip == "::1" || ip == "localhost" {
		return true
	}
	// 10.x.x.x
	if len(ip) >= 3 && ip[:3] == "10." {
		return true
	}
	// 192.168.x.x
	if len(ip) >= 8 && ip[:8] == "192.168." {
		return true
	}
	// 172.16.x.x - 172.31.x.x
	if len(ip) >= 4 && ip[:4] == "172." {
		return true
	}
	return false
}

// CleanupCache removes expired entries
func (s *GeoIPService) CleanupCache() {
	s.cacheMux.Lock()
	defer s.cacheMux.Unlock()

	now := time.Now()
	for ip, entry := range s.cache {
		if now.After(entry.ExpiresAt) {
			delete(s.cache, ip)
		}
	}
}

// GetCacheSize returns the current cache size
func (s *GeoIPService) GetCacheSize() int {
	s.cacheMux.RLock()
	defer s.cacheMux.RUnlock()
	return len(s.cache)
}

