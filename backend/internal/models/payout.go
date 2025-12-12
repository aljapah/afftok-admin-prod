package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Payout Status Constants
const (
	PayoutStatusPending   = "pending"   // في انتظار الموافقة
	PayoutStatusApproved  = "approved"  // تمت الموافقة
	PayoutStatusPaid      = "paid"      // تم الدفع
	PayoutStatusFailed    = "failed"    // فشل الدفع
	PayoutStatusCancelled = "cancelled" // ملغي
)

// PayoutBatch Status Constants
const (
	BatchStatusDraft     = "draft"     // مسودة - لم ترسل بعد
	BatchStatusSubmitted = "submitted" // تم الإرسال لـ Payoneer
	BatchStatusProcessing = "processing" // قيد المعالجة
	BatchStatusCompleted = "completed" // مكتمل
	BatchStatusFailed    = "failed"    // فشل
)

// Payout represents a single payout from advertiser to promoter
// المستحقات - كل سجل يمثل مبلغ من معلن لمروج لفترة معينة
type Payout struct {
	ID               uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	BatchID          *uuid.UUID `gorm:"type:uuid;index" json:"batch_id,omitempty"` // رقم الدفعة الشهرية
	
	// الأطراف
	AdvertiserID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"advertiser_id"` // المعلن (الدافع)
	PublisherID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"publisher_id"`  // المروج (المستلم)
	
	// تفاصيل المبلغ
	Amount           float64    `gorm:"type:decimal(12,2);not null" json:"amount"`     // المبلغ الإجمالي
	PlatformFee      float64    `gorm:"type:decimal(12,2);default:0" json:"platform_fee"` // عمولة المنصة (10%)
	NetAmount        float64    `gorm:"type:decimal(12,2);default:0" json:"net_amount"`   // صافي المبلغ للمروج
	Currency         string     `gorm:"type:varchar(3);default:'USD'" json:"currency"`
	
	// الفترة
	Period           string     `gorm:"type:varchar(7);not null;index" json:"period"` // "2025-01"
	PeriodStart      time.Time  `json:"period_start"`
	PeriodEnd        time.Time  `json:"period_end"`
	
	// الإحصائيات
	ConversionsCount int        `gorm:"default:0" json:"conversions_count"`
	ClicksCount      int        `gorm:"default:0" json:"clicks_count"`
	
	// الحالة
	Status           string     `gorm:"type:varchar(20);default:'pending';index" json:"status"`
	
	// Payoneer Integration
	PayoneerPaymentID string    `gorm:"type:varchar(100)" json:"payoneer_payment_id,omitempty"`
	PayoneerStatus    string    `gorm:"type:varchar(50)" json:"payoneer_status,omitempty"`
	PayoneerError     string    `gorm:"type:text" json:"payoneer_error,omitempty"`
	
	// التواريخ
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	ApprovedAt       *time.Time `json:"approved_at,omitempty"`
	PaidAt           *time.Time `json:"paid_at,omitempty"`
	
	// العلاقات
	Advertiser       *AfftokUser `gorm:"foreignKey:AdvertiserID" json:"advertiser,omitempty"`
	Publisher        *AfftokUser `gorm:"foreignKey:PublisherID" json:"publisher,omitempty"`
	Batch            *PayoutBatch `gorm:"foreignKey:BatchID" json:"batch,omitempty"`
}

// TableName specifies the table name
func (Payout) TableName() string {
	return "payouts"
}

// BeforeCreate generates UUID before creating
func (p *Payout) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	// حساب عمولة المنصة 10%
	if p.PlatformFee == 0 && p.Amount > 0 {
		p.PlatformFee = p.Amount * 0.10
		p.NetAmount = p.Amount - p.PlatformFee
	}
	return nil
}

// PayoutBatch represents a monthly batch of payouts
// دفعة الشهر - تجمع كل المستحقات لفترة معينة
type PayoutBatch struct {
	ID                uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	
	// معلومات الدفعة
	Period            string     `gorm:"type:varchar(7);not null;uniqueIndex" json:"period"` // "2025-01"
	PeriodStart       time.Time  `json:"period_start"`
	PeriodEnd         time.Time  `json:"period_end"`
	
	// الإحصائيات
	TotalAmount       float64    `gorm:"type:decimal(14,2);default:0" json:"total_amount"`
	TotalPlatformFee  float64    `gorm:"type:decimal(14,2);default:0" json:"total_platform_fee"`
	TotalNetAmount    float64    `gorm:"type:decimal(14,2);default:0" json:"total_net_amount"`
	TotalPayouts      int        `gorm:"default:0" json:"total_payouts"`
	TotalPublishers   int        `gorm:"default:0" json:"total_publishers"`
	TotalAdvertisers  int        `gorm:"default:0" json:"total_advertisers"`
	TotalConversions  int        `gorm:"default:0" json:"total_conversions"`
	Currency          string     `gorm:"type:varchar(3);default:'USD'" json:"currency"`
	
	// الحالة
	Status            string     `gorm:"type:varchar(20);default:'draft'" json:"status"`
	
	// Payoneer Integration
	PayoneerBatchID   string     `gorm:"type:varchar(100)" json:"payoneer_batch_id,omitempty"`
	PayoneerStatus    string     `gorm:"type:varchar(50)" json:"payoneer_status,omitempty"`
	PayoneerError     string     `gorm:"type:text" json:"payoneer_error,omitempty"`
	PayoneerResponse  string     `gorm:"type:jsonb" json:"payoneer_response,omitempty"`
	
	// التواريخ
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	SubmittedAt       *time.Time `json:"submitted_at,omitempty"`
	CompletedAt       *time.Time `json:"completed_at,omitempty"`
	
	// من أنشأ الدفعة
	CreatedByID       *uuid.UUID `gorm:"type:uuid" json:"created_by_id,omitempty"`
	
	// ملاحظات
	Notes             string     `gorm:"type:text" json:"notes,omitempty"`
	
	// العلاقات
	Payouts           []Payout   `gorm:"foreignKey:BatchID" json:"payouts,omitempty"`
}

// TableName specifies the table name
func (PayoutBatch) TableName() string {
	return "payout_batches"
}

// BeforeCreate generates UUID before creating
func (pb *PayoutBatch) BeforeCreate(tx *gorm.DB) error {
	if pb.ID == uuid.Nil {
		pb.ID = uuid.New()
	}
	return nil
}

// PayoutSummary for dashboard display
type PayoutSummary struct {
	TotalPayouts      int     `json:"total_payouts"`
	TotalAmount       float64 `json:"total_amount"`
	TotalPlatformFee  float64 `json:"total_platform_fee"`
	PendingAmount     float64 `json:"pending_amount"`
	PaidAmount        float64 `json:"paid_amount"`
	PendingCount      int     `json:"pending_count"`
	PaidCount         int     `json:"paid_count"`
	TotalPublishers   int     `json:"total_publishers"`
	TotalAdvertisers  int     `json:"total_advertisers"`
}

// PayoutRequest for generating payouts
type GeneratePayoutRequest struct {
	Period string `json:"period"` // "2025-01"
	Month  int    `json:"month"`  // 1-12
	Year   int    `json:"year"`   // 2025
}

// ExportPayoutCSV represents a row in the CSV export
type ExportPayoutCSV struct {
	AdvertiserID       string  `json:"advertiser_id"`
	AdvertiserEmail    string  `json:"advertiser_email"`
	AdvertiserPayoneer string  `json:"advertiser_payoneer"`
	PublisherID        string  `json:"publisher_id"`
	PublisherEmail     string  `json:"publisher_email"`
	PublisherPayoneer  string  `json:"publisher_payoneer"`
	Amount             float64 `json:"amount"`
	PlatformFee        float64 `json:"platform_fee"`
	NetAmount          float64 `json:"net_amount"`
	Currency           string  `json:"currency"`
	Period             string  `json:"period"`
	ConversionsCount   int     `json:"conversions_count"`
}

