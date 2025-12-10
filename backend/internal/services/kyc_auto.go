package services

import (
	"log"
	"time"

	"github.com/aljapah/afftok-backend-prod/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// KYCAutoService handles automatic KYC triggering based on fraud detection
type KYCAutoService struct {
	db *gorm.DB
}

// NewKYCAutoService creates a new KYC auto service
func NewKYCAutoService(db *gorm.DB) *KYCAutoService {
	return &KYCAutoService{db: db}
}

// FraudIndicators represents suspicious behavior metrics
type FraudIndicators struct {
	UserID               uuid.UUID
	VPNUsageCount        int     // عدد مرات استخدام VPN
	MultiAccountIPs      int     // عدد الحسابات على نفس IP
	ConversionRate       float64 // نسبة التحويل (مرتفعة جداً = مشبوه)
	ClickVelocity        int     // عدد النقرات في الدقيقة
	SuspiciousPatterns   int     // أنماط مشبوهة أخرى
	FraudScoreTotal      float64 // النتيجة الإجمالية
}

// KYC Thresholds - حدود تفعيل طلب التحقق
const (
	ThresholdVPNUsage       = 10   // أكثر من 10 مرات VPN
	ThresholdMultiAccountIP = 3    // أكثر من 3 حسابات على نفس IP
	ThresholdConversionRate = 0.5  // نسبة تحويل أعلى من 50%
	ThresholdClickVelocity  = 100  // أكثر من 100 نقرة في الدقيقة
	ThresholdFraudScore     = 70.0 // إجمالي نقاط الاحتيال
)

// CheckAndTriggerKYC evaluates fraud indicators and triggers KYC if needed
func (s *KYCAutoService) CheckAndTriggerKYC(userID uuid.UUID) (bool, string, error) {
	// Get fraud indicators from threat detector
	indicators, err := s.collectFraudIndicators(userID)
	if err != nil {
		return false, "", err
	}

	// Calculate if KYC is needed
	triggered, reason := s.shouldTriggerKYC(indicators)
	
	if triggered {
		err := s.triggerKYCRequired(userID, reason)
		if err != nil {
			return false, "", err
		}
		log.Printf("[KYC-AUTO] 🚨 KYC triggered for user %s: %s", userID, reason)
		return true, reason, nil
	}

	return false, "", nil
}

// collectFraudIndicators gathers fraud metrics for a user
func (s *KYCAutoService) collectFraudIndicators(userID uuid.UUID) (*FraudIndicators, error) {
	indicators := &FraudIndicators{UserID: userID}

	// Get VPN usage count
	var vpnCount int64
	s.db.Model(&models.Click{}).
		Where("user_id = ? AND is_vpn = true", userID).
		Count(&vpnCount)
	indicators.VPNUsageCount = int(vpnCount)

	// Get user's primary IP and count accounts on same IP
	var userIPs []string
	s.db.Model(&models.Click{}).
		Where("user_id = ?", userID).
		Distinct("ip_address").
		Limit(5).
		Pluck("ip_address", &userIPs)

	if len(userIPs) > 0 {
		var multiAccountCount int64
		s.db.Model(&models.Click{}).
			Where("ip_address IN ? AND user_id != ?", userIPs, userID).
			Distinct("user_id").
			Count(&multiAccountCount)
		indicators.MultiAccountIPs = int(multiAccountCount)
	}

	// Get conversion rate
	var totalClicks, totalConversions int64
	s.db.Model(&models.Click{}).Where("user_id = ?", userID).Count(&totalClicks)
	s.db.Model(&models.Conversion{}).Where("user_id = ?", userID).Count(&totalConversions)
	
	if totalClicks > 0 {
		indicators.ConversionRate = float64(totalConversions) / float64(totalClicks)
	}

	// Get click velocity (clicks in last minute)
	oneMinuteAgo := time.Now().Add(-1 * time.Minute)
	var recentClicks int64
	s.db.Model(&models.Click{}).
		Where("user_id = ? AND created_at > ?", userID, oneMinuteAgo).
		Count(&recentClicks)
	indicators.ClickVelocity = int(recentClicks)

	// Calculate total fraud score
	indicators.FraudScoreTotal = s.calculateFraudScore(indicators)

	return indicators, nil
}

// calculateFraudScore computes overall fraud score
func (s *KYCAutoService) calculateFraudScore(ind *FraudIndicators) float64 {
	score := 0.0

	// VPN usage contributes to score
	if ind.VPNUsageCount > 0 {
		score += float64(ind.VPNUsageCount) * 2
	}

	// Multi-account IP is very suspicious
	if ind.MultiAccountIPs > 0 {
		score += float64(ind.MultiAccountIPs) * 15
	}

	// Abnormally high conversion rate
	if ind.ConversionRate > 0.3 {
		score += ind.ConversionRate * 50
	}

	// High click velocity
	if ind.ClickVelocity > 50 {
		score += float64(ind.ClickVelocity-50) * 0.5
	}

	return score
}

// shouldTriggerKYC determines if KYC verification should be required
func (s *KYCAutoService) shouldTriggerKYC(ind *FraudIndicators) (bool, string) {
	reasons := []string{}

	if ind.VPNUsageCount > ThresholdVPNUsage {
		reasons = append(reasons, "high_vpn_usage")
	}

	if ind.MultiAccountIPs >= ThresholdMultiAccountIP {
		reasons = append(reasons, "multi_account_ip")
	}

	if ind.ConversionRate > ThresholdConversionRate {
		reasons = append(reasons, "abnormal_conversion_rate")
	}

	if ind.ClickVelocity > ThresholdClickVelocity {
		reasons = append(reasons, "click_spam")
	}

	if ind.FraudScoreTotal > ThresholdFraudScore {
		reasons = append(reasons, "high_fraud_score")
	}

	if len(reasons) > 0 {
		return true, reasons[0] // Return first reason
	}

	return false, ""
}

// triggerKYCRequired marks user as requiring KYC verification
func (s *KYCAutoService) triggerKYCRequired(userID uuid.UUID, reason string) error {
	now := time.Now()
	return s.db.Model(&models.AfftokUser{}).
		Where("id = ? AND kyc_status = ?", userID, models.KYCStatusNone).
		Updates(map[string]interface{}{
			"kyc_status":      models.KYCStatusRequired,
			"kyc_required_at": now,
		}).Error
}

// UpdateKYCFromProvider updates KYC status from external provider webhook
// Called when SumSub/Veriff/Persona sends verification result
func (s *KYCAutoService) UpdateKYCFromProvider(userID uuid.UUID, verified bool, providerRef string) error {
	now := time.Now()
	updates := map[string]interface{}{
		"kyc_provider_ref": providerRef,
	}

	if verified {
		updates["kyc_status"] = models.KYCStatusVerified
		updates["kyc_verified_at"] = now
		log.Printf("[KYC-AUTO] ✅ User %s verified by provider %s", userID, providerRef)
	} else {
		updates["kyc_status"] = models.KYCStatusRejected
		log.Printf("[KYC-AUTO] ❌ User %s rejected by provider %s", userID, providerRef)
	}

	return s.db.Model(&models.AfftokUser{}).
		Where("id = ?", userID).
		Updates(updates).Error
}

// GetKYCStatus returns current KYC status for a user
func (s *KYCAutoService) GetKYCStatus(userID uuid.UUID) (string, error) {
	var user models.AfftokUser
	if err := s.db.Select("kyc_status").First(&user, "id = ?", userID).Error; err != nil {
		return "", err
	}
	return user.KYCStatus, nil
}

// ResetKYCStatus resets KYC to none (admin only)
func (s *KYCAutoService) ResetKYCStatus(userID uuid.UUID) error {
	return s.db.Model(&models.AfftokUser{}).
		Where("id = ?", userID).
		Updates(map[string]interface{}{
			"kyc_status":       models.KYCStatusNone,
			"kyc_required_at":  nil,
			"kyc_verified_at":  nil,
			"kyc_provider_ref": "",
		}).Error
}

