package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/aljapah/afftok-backend-prod/internal/models"
)

// PayoutService handles payout business logic
// خدمة الدفعات - نظام Payoneer (معطل حالياً)
type PayoutService struct {
	db *gorm.DB
}

// NewPayoutService creates a new payout service
func NewPayoutService(db *gorm.DB) *PayoutService {
	return &PayoutService{db: db}
}

// PayoneerConfig holds Payoneer API configuration (للمستقبل)
type PayoneerConfig struct {
	PartnerID   string
	APIKey      string
	APISecret   string
	Environment string // "sandbox" or "production"
	BaseURL     string
	Enabled     bool // false حالياً
}

// DefaultPayoneerConfig returns disabled config
func DefaultPayoneerConfig() *PayoneerConfig {
	return &PayoneerConfig{
		PartnerID:   "",
		APIKey:      "",
		APISecret:   "",
		Environment: "sandbox",
		BaseURL:     "https://api.sandbox.payoneer.com",
		Enabled:     false, // معطل حالياً
	}
}

// CalculateMonthlyPayouts calculates payouts for a specific month
func (s *PayoutService) CalculateMonthlyPayouts(year, month int) ([]models.Payout, error) {
	periodStart := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	periodEnd := periodStart.AddDate(0, 1, 0).Add(-time.Second)
	period := fmt.Sprintf("%d-%02d", year, month)
	
	// جلب التحويلات المؤكدة مجمعة حسب المعلن والمروج
	type ConversionAgg struct {
		AdvertiserID uuid.UUID
		PublisherID  uuid.UUID
		TotalAmount  float64
		TotalCount   int
	}
	
	var aggregations []ConversionAgg
	
	err := s.db.Table("conversions c").
		Select(`
			o.advertiser_id,
			uo.user_id as publisher_id,
			COALESCE(SUM(c.amount), 0) as total_amount,
			COUNT(*) as total_count
		`).
		Joins("JOIN user_offers uo ON c.user_offer_id = uo.id").
		Joins("JOIN offers o ON uo.offer_id = o.id").
		Where("c.status = ?", "approved").
		Where("c.converted_at >= ? AND c.converted_at <= ?", periodStart, periodEnd).
		Where("o.advertiser_id IS NOT NULL").
		Group("o.advertiser_id, uo.user_id").
		Scan(&aggregations).Error
	
	if err != nil {
		return nil, fmt.Errorf("failed to aggregate conversions: %w", err)
	}
	
	// إنشاء كائنات Payout
	var payouts []models.Payout
	for _, agg := range aggregations {
		payout := models.Payout{
			ID:               uuid.New(),
			AdvertiserID:     agg.AdvertiserID,
			PublisherID:      agg.PublisherID,
			Amount:           agg.TotalAmount,
			PlatformFee:      agg.TotalAmount * 0.10,
			NetAmount:        agg.TotalAmount * 0.90,
			Currency:         "USD",
			Period:           period,
			PeriodStart:      periodStart,
			PeriodEnd:        periodEnd,
			ConversionsCount: agg.TotalCount,
			Status:           models.PayoutStatusPending,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}
		payouts = append(payouts, payout)
	}
	
	return payouts, nil
}

// CreateBatch creates a new payout batch
func (s *PayoutService) CreateBatch(year, month int, payouts []models.Payout) (*models.PayoutBatch, error) {
	period := fmt.Sprintf("%d-%02d", year, month)
	periodStart := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	periodEnd := periodStart.AddDate(0, 1, 0).Add(-time.Second)
	
	batch := &models.PayoutBatch{
		ID:          uuid.New(),
		Period:      period,
		PeriodStart: periodStart,
		PeriodEnd:   periodEnd,
		Status:      models.BatchStatusDraft,
		Currency:    "USD",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	// حساب الإحصائيات
	advertisers := make(map[uuid.UUID]bool)
	publishers := make(map[uuid.UUID]bool)
	
	for i := range payouts {
		payouts[i].BatchID = &batch.ID
		batch.TotalAmount += payouts[i].Amount
		batch.TotalPlatformFee += payouts[i].PlatformFee
		batch.TotalNetAmount += payouts[i].NetAmount
		batch.TotalConversions += payouts[i].ConversionsCount
		
		advertisers[payouts[i].AdvertiserID] = true
		publishers[payouts[i].PublisherID] = true
	}
	
	batch.TotalPayouts = len(payouts)
	batch.TotalAdvertisers = len(advertisers)
	batch.TotalPublishers = len(publishers)
	
	return batch, nil
}

// SaveBatch saves a batch and its payouts to database
func (s *PayoutService) SaveBatch(batch *models.PayoutBatch, payouts []models.Payout) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(batch).Error; err != nil {
			return fmt.Errorf("failed to create batch: %w", err)
		}
		
		if len(payouts) > 0 {
			if err := tx.Create(&payouts).Error; err != nil {
				return fmt.Errorf("failed to create payouts: %w", err)
			}
		}
		
		return nil
	})
}

// GetBatchByPeriod gets a batch by period
func (s *PayoutService) GetBatchByPeriod(period string) (*models.PayoutBatch, error) {
	var batch models.PayoutBatch
	err := s.db.Where("period = ?", period).First(&batch).Error
	if err != nil {
		return nil, err
	}
	return &batch, nil
}

// GetPromoterPendingAmount gets total pending amount for a promoter
func (s *PayoutService) GetPromoterPendingAmount(promoterID uuid.UUID) (float64, error) {
	var total float64
	err := s.db.Model(&models.Payout{}).
		Where("publisher_id = ? AND status = ?", promoterID, models.PayoutStatusPending).
		Select("COALESCE(SUM(net_amount), 0)").
		Scan(&total).Error
	return total, err
}

// GetAdvertiserPendingAmount gets total pending amount for an advertiser
func (s *PayoutService) GetAdvertiserPendingAmount(advertiserID uuid.UUID) (float64, error) {
	var total float64
	err := s.db.Model(&models.Payout{}).
		Where("advertiser_id = ? AND status = ?", advertiserID, models.PayoutStatusPending).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	return total, err
}

// ============================================================
// Payoneer API Integration (معطل حالياً - للمستقبل)
// ============================================================

// SubmitBatchToPayoneer submits a batch to Payoneer API
// هذه الدالة معطلة حالياً - ستُفعّل بعد التعاقد مع Payoneer
func (s *PayoutService) SubmitBatchToPayoneer(batchID uuid.UUID, config *PayoneerConfig) error {
	if !config.Enabled {
		return fmt.Errorf("payoneer integration is not enabled - waiting for partnership")
	}
	
	// TODO: Implement Payoneer API integration
	// 1. Get batch with payouts
	// 2. Validate all users have Payoneer emails
	// 3. Create Payoneer batch request
	// 4. Submit to Payoneer API
	// 5. Update batch status
	// 6. Handle response
	
	return fmt.Errorf("payoneer integration not implemented yet")
}

// ValidatePayoutsForPayoneer validates that all parties have Payoneer accounts
func (s *PayoutService) ValidatePayoutsForPayoneer(payouts []models.Payout) ([]string, error) {
	var errors []string
	
	for _, p := range payouts {
		// تحقق من المعلن
		var advertiser models.AfftokUser
		if err := s.db.Select("id, email, payoneer_email, payoneer_status").
			Where("id = ?", p.AdvertiserID).First(&advertiser).Error; err == nil {
			if advertiser.PayoneerEmail == "" {
				errors = append(errors, fmt.Sprintf("Advertiser %s has no Payoneer email", advertiser.Email))
			}
		}
		
		// تحقق من المروج
		var publisher models.AfftokUser
		if err := s.db.Select("id, email, payoneer_email, payoneer_status").
			Where("id = ?", p.PublisherID).First(&publisher).Error; err == nil {
			if publisher.PayoneerEmail == "" {
				errors = append(errors, fmt.Sprintf("Publisher %s has no Payoneer email", publisher.Email))
			}
		}
	}
	
	return errors, nil
}

// GetSystemStatus returns the current status of Payoneer integration
func (s *PayoutService) GetSystemStatus() map[string]interface{} {
	return map[string]interface{}{
		"payoneer_enabled":     false,
		"status":               "coming_soon",
		"message_ar":           "نظام الدفعات التلقائية عبر Payoneer قادم قريباً",
		"message_en":           "Automatic Payoneer payout system coming soon",
		"current_system":       "direct_payment",
		"current_system_desc":  "Promoters set their payment method, advertisers pay directly",
	}
}

