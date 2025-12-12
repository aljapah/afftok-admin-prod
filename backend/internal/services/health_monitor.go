package services

import (
	"context"
	"log"
	"runtime"
	"sync"
	"time"

	"github.com/aljapah/afftok-backend-prod/internal/alerting"
	"github.com/aljapah/afftok-backend-prod/internal/cache"
	"github.com/aljapah/afftok-backend-prod/internal/database"
)

// HealthMonitor monitors system health and sends alerts
type HealthMonitor struct {
	interval     time.Duration
	enabled      bool
	stopChan     chan struct{}
	wg           sync.WaitGroup
	alertManager *alerting.AlertManager
}

var (
	healthMonitorInstance *HealthMonitor
	healthMonitorOnce     sync.Once
)

// GetHealthMonitor returns the singleton health monitor
func GetHealthMonitor() *HealthMonitor {
	healthMonitorOnce.Do(func() {
		healthMonitorInstance = &HealthMonitor{
			interval:     30 * time.Second, // Check every 30 seconds
			enabled:      true,
			stopChan:     make(chan struct{}),
			alertManager: alerting.GetAlertManager(),
		}
	})
	return healthMonitorInstance
}

// Start starts the health monitor
func (h *HealthMonitor) Start() {
	if !h.enabled {
		log.Println("⚠️ Health Monitor disabled")
		return
	}

	h.wg.Add(1)
	go h.run()
	log.Println("✅ Health Monitor started (interval: 30s)")
}

// Stop stops the health monitor
func (h *HealthMonitor) Stop() {
	close(h.stopChan)
	h.wg.Wait()
	log.Println("🛑 Health Monitor stopped")
}

// run is the main monitoring loop
func (h *HealthMonitor) run() {
	defer h.wg.Done()

	ticker := time.NewTicker(h.interval)
	defer ticker.Stop()

	// Run immediately on start
	h.checkAll()

	for {
		select {
		case <-ticker.C:
			h.checkAll()
		case <-h.stopChan:
			return
		}
	}
}

// checkAll runs all health checks
func (h *HealthMonitor) checkAll() {
	h.checkDatabase()
	h.checkRedis()
	h.checkMemory()
	h.checkGoroutines()
}

// checkDatabase checks database health
func (h *HealthMonitor) checkDatabase() {
	if database.DB == nil {
		h.alertManager.CreateAlert(
			alerting.AlertDBLatency,
			alerting.AlertSeverityCritical,
			"🔴 Database Not Connected",
			"PostgreSQL database is not initialized",
			nil, nil, nil,
		)
		return
	}

	sqlDB, err := database.DB.DB()
	if err != nil {
		h.alertManager.CreateAlert(
			alerting.AlertDBLatency,
			alerting.AlertSeverityCritical,
			"🔴 Database Connection Error",
			err.Error(),
			nil, nil, nil,
		)
		return
	}

	// Measure latency
	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		h.alertManager.CreateAlert(
			alerting.AlertDBLatency,
			alerting.AlertSeverityCritical,
			"🔴 Database Ping Failed",
			err.Error(),
			nil, nil, nil,
		)
		return
	}

	latencyMs := int(time.Since(start).Milliseconds())
	h.alertManager.CheckDBLatency(latencyMs)
}

// checkRedis checks Redis health
func (h *HealthMonitor) checkRedis() {
	if cache.RedisClient == nil {
		h.alertManager.CreateAlert(
			alerting.AlertRedisLatency,
			alerting.AlertSeverityWarning,
			"⚠️ Redis Not Connected",
			"Redis cache is not initialized",
			nil, nil, nil,
		)
		return
	}

	// Measure latency
	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := cache.RedisClient.Ping(ctx).Err(); err != nil {
		h.alertManager.CreateAlert(
			alerting.AlertRedisLatency,
			alerting.AlertSeverityError,
			"🔴 Redis Ping Failed",
			err.Error(),
			nil, nil, nil,
		)
		return
	}

	latencyMs := int(time.Since(start).Milliseconds())
	h.alertManager.CheckRedisLatency(latencyMs)
}

// checkMemory checks memory usage
func (h *HealthMonitor) checkMemory() {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	// Convert to MB
	allocMB := float64(memStats.Alloc) / 1024 / 1024
	
	// Alert if memory > 512MB (adjust as needed)
	if allocMB > 512 {
		h.alertManager.CheckMemory(allocMB / 1024 * 100) // Convert to percentage of 1GB
	}
}

// checkGoroutines checks goroutine count
func (h *HealthMonitor) checkGoroutines() {
	count := runtime.NumGoroutine()
	
	// Alert if goroutines > 5000
	if count > 5000 {
		h.alertManager.CreateAlert(
			alerting.AlertCPUHigh,
			alerting.AlertSeverityWarning,
			"⚠️ High Goroutine Count",
			"Too many goroutines running",
			count, 5000,
			map[string]interface{}{"goroutines": count},
		)
	}
}

