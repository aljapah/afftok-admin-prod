package services

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/getsentry/sentry-go"
)

// SentryService manages Sentry error tracking
type SentryService struct {
	enabled bool
	dsn     string
}

// NewSentryService creates a new Sentry service
func NewSentryService() *SentryService {
	dsn := os.Getenv("SENTRY_DSN")
	enabled := dsn != ""
	
	if enabled {
		err := sentry.Init(sentry.ClientOptions{
			Dsn:              dsn,
			Environment:      getEnvironment(),
			Release:          os.Getenv("APP_VERSION"),
			TracesSampleRate: 0.2, // 20% of transactions for performance monitoring
			Debug:            os.Getenv("SENTRY_DEBUG") == "true",
			BeforeSend: func(event *sentry.Event, hint *sentry.EventHint) *sentry.Event {
				// Filter out specific errors if needed
				return event
			},
		})
		if err != nil {
			log.Printf("Sentry initialization failed: %v", err)
		} else {
			log.Println("✅ Sentry initialized successfully")
		}
	}
	
	return &SentryService{
		enabled: enabled,
		dsn:     dsn,
	}
}

// getEnvironment returns the current environment
func getEnvironment() string {
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "production"
	}
	return env
}

// CaptureError captures an error to Sentry
func (s *SentryService) CaptureError(err error, context map[string]interface{}) {
	if !s.enabled || err == nil {
		return
	}
	
	sentry.WithScope(func(scope *sentry.Scope) {
		for key, value := range context {
			scope.SetExtra(key, value)
		}
		sentry.CaptureException(err)
	})
}

// CaptureMessage captures a message to Sentry
func (s *SentryService) CaptureMessage(message string, level sentry.Level, context map[string]interface{}) {
	if !s.enabled {
		return
	}
	
	sentry.WithScope(func(scope *sentry.Scope) {
		scope.SetLevel(level)
		for key, value := range context {
			scope.SetExtra(key, value)
		}
		sentry.CaptureMessage(message)
	})
}

// CaptureAPIError captures API-related errors
func (s *SentryService) CaptureAPIError(endpoint string, method string, statusCode int, err error, userID string) {
	if !s.enabled || err == nil {
		return
	}
	
	sentry.WithScope(func(scope *sentry.Scope) {
		scope.SetTag("endpoint", endpoint)
		scope.SetTag("method", method)
		scope.SetTag("status_code", fmt.Sprintf("%d", statusCode))
		if userID != "" {
			scope.SetUser(sentry.User{ID: userID})
		}
		sentry.CaptureException(err)
	})
}

// CaptureFraudAlert captures fraud detection alerts
func (s *SentryService) CaptureFraudAlert(fraudType string, details map[string]interface{}) {
	if !s.enabled {
		return
	}
	
	sentry.WithScope(func(scope *sentry.Scope) {
		scope.SetLevel(sentry.LevelWarning)
		scope.SetTag("type", "fraud_alert")
		scope.SetTag("fraud_type", fraudType)
		for key, value := range details {
			scope.SetExtra(key, value)
		}
		sentry.CaptureMessage(fmt.Sprintf("Fraud Alert: %s", fraudType))
	})
}

// CapturePerformanceIssue captures performance-related issues
func (s *SentryService) CapturePerformanceIssue(operation string, duration time.Duration, threshold time.Duration) {
	if !s.enabled {
		return
	}
	
	if duration > threshold {
		sentry.WithScope(func(scope *sentry.Scope) {
			scope.SetLevel(sentry.LevelWarning)
			scope.SetTag("type", "performance")
			scope.SetTag("operation", operation)
			scope.SetExtra("duration_ms", duration.Milliseconds())
			scope.SetExtra("threshold_ms", threshold.Milliseconds())
			sentry.CaptureMessage(fmt.Sprintf("Slow operation: %s took %v", operation, duration))
		})
	}
}

// Flush flushes buffered events (call before app shutdown)
func (s *SentryService) Flush() {
	if s.enabled {
		sentry.Flush(2 * time.Second)
	}
}

// IsEnabled returns whether Sentry is enabled
func (s *SentryService) IsEnabled() bool {
	return s.enabled
}

// Global instance
var sentryServiceInstance *SentryService

// GetSentryService returns the global Sentry service
func GetSentryService() *SentryService {
	if sentryServiceInstance == nil {
		sentryServiceInstance = NewSentryService()
	}
	return sentryServiceInstance
}

