package models

import (
	"time"

	"github.com/google/uuid"
)

type Network struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description,omitempty"`
	LogoURL     string    `gorm:"type:text" json:"logo_url,omitempty"`
	APIURL      string    `gorm:"type:text" json:"api_url,omitempty"`
	APIKey      string    `gorm:"type:text" json:"-"`
	PostbackURL string    `gorm:"type:text" json:"postback_url,omitempty"`
	HMACSecret  string    `gorm:"type:text" json:"-"`
	Status      string    `gorm:"type:varchar(20);default:'active'" json:"status"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	Offers      []Offer   `gorm:"foreignKey:NetworkID" json:"offers,omitempty"`
}

func (Network) TableName() string {
	return "networks"
}

type Offer struct {
	ID                 uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	NetworkID          *uuid.UUID `gorm:"type:uuid" json:"network_id,omitempty"`
	AffiliateNetworkID *uuid.UUID `gorm:"type:uuid;index" json:"affiliate_network_id,omitempty"` // الشبكة الخارجية (Noon, Amazon, Payoneer)
	AdvertiserID       *uuid.UUID `gorm:"type:uuid;index" json:"advertiser_id,omitempty"`        // Link to advertiser user
	// Optional: restrict this offer to a single team (exclusive access)
	ExclusiveTeamID    *uuid.UUID `gorm:"type:uuid;index" json:"exclusive_team_id,omitempty"`
	ExternalOfferID    string     `gorm:"type:varchar(100)" json:"external_offer_id,omitempty"`
	
	// Payment Source - مصدر الدفع للمروج
	PaymentSource      string     `gorm:"type:varchar(30);default:'direct'" json:"payment_source"` // noon, amazon, payoneer, direct
	
	// English Fields
	Title            string     `gorm:"type:varchar(255);not null" json:"title"`
	Description      string     `gorm:"type:text" json:"description,omitempty"`
	Terms            string     `gorm:"type:text" json:"terms,omitempty"` // الشروط العامة بالإنجليزية
	
	// Arabic Fields (للمستخدم العربي)
	TitleAr          string     `gorm:"type:varchar(255)" json:"title_ar,omitempty"`
	DescriptionAr    string     `gorm:"type:text" json:"description_ar,omitempty"`
	TermsAr          string     `gorm:"type:text" json:"terms_ar,omitempty"`
	
	// Common Fields
	ImageURL         string     `gorm:"type:text" json:"image_url,omitempty"`
	LogoURL          string     `gorm:"type:text" json:"logo_url,omitempty"`
	DestinationURL   string     `gorm:"type:text;not null" json:"destination_url"`
	Category         string     `gorm:"type:varchar(50)" json:"category,omitempty"`
	Payout           int        `gorm:"default:0" json:"payout"`
	Commission       int        `gorm:"default:0" json:"commission"`
	PayoutType       string     `gorm:"type:varchar(20);default:'cpa'" json:"payout_type"`
	
	// Geo Targeting - استهداف الدول
	TargetCountries  string     `gorm:"type:text" json:"target_countries,omitempty"` // JSON array: ["SA", "AE", "KW"]
	BlockedCountries string     `gorm:"type:text" json:"blocked_countries,omitempty"` // JSON array: ["SY", "YE"]
	
	// Tracking - نوع التتبع
	TrackingType     string     `gorm:"type:varchar(20);default:'cookie'" json:"tracking_type"` // cookie, coupon, link
	
	// Attribution Settings - إعدادات نسب التحويل
	AttributionWindow int       `gorm:"default:30" json:"attribution_window"`                    // أيام: 7, 14, 30, 60, 90
	AttributionModel  string    `gorm:"type:varchar(20);default:'last_click'" json:"attribution_model"` // first_click, last_click
	
	// Fraud Protection - حماية من الاحتيال
	MaxFraudScore     int       `gorm:"default:70" json:"max_fraud_score"`                       // الحد الأقصى لنقاط الاحتيال (0-100)
	AutoRejectFraud   bool      `gorm:"default:true" json:"auto_reject_fraud"`                   // رفض تلقائي للتحويلات المشبوهة
	
	// Additional Notes - ملاحظات إضافية
	AdditionalNotes  string     `gorm:"type:text" json:"additional_notes,omitempty"`

	// Team-exclusive workflow (optional)
	TeamApprovalStatus string     `gorm:"type:varchar(20);default:''" json:"team_approval_status,omitempty"` // pending, approved, rejected
	TeamApprovalBy     *uuid.UUID `gorm:"type:uuid" json:"team_approval_by,omitempty"`
	TeamApprovalAt     *time.Time `json:"team_approval_at,omitempty"`
	TeamRejectionReason string    `gorm:"type:text" json:"team_rejection_reason,omitempty"`
	
	Rating           float64    `gorm:"type:decimal(3,2);default:0.0" json:"rating"`
	UsersCount       int        `gorm:"default:0" json:"users_count"`
	Status           string     `gorm:"type:varchar(20);default:'pending'" json:"status"` // pending, active, rejected, paused
	RejectionReason  string     `gorm:"type:text" json:"rejection_reason,omitempty"`      // NEW: Reason if rejected
	TotalClicks      int        `gorm:"default:0" json:"total_clicks"`
	TotalConversions int        `gorm:"default:0" json:"total_conversions"`
	CreatedAt        time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt        time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	Network          *Network           `gorm:"foreignKey:NetworkID" json:"network,omitempty"`
	AffiliateNetwork *AffiliateNetwork  `gorm:"foreignKey:AffiliateNetworkID" json:"affiliate_network,omitempty"` // الشبكة الخارجية
	Advertiser       *AfftokUser        `gorm:"foreignKey:AdvertiserID" json:"advertiser,omitempty"`
	UserOffers       []UserOffer        `gorm:"foreignKey:OfferID" json:"user_offers,omitempty"`
}

// GetTitle returns title based on language preference
func (o *Offer) GetTitle(lang string) string {
	if lang == "ar" && o.TitleAr != "" {
		return o.TitleAr
	}
	return o.Title
}

// GetDescription returns description based on language preference
func (o *Offer) GetDescription(lang string) string {
	if lang == "ar" && o.DescriptionAr != "" {
		return o.DescriptionAr
	}
	return o.Description
}

func (Offer) TableName() string {
	return "offers"
}

func (o *Offer) ConversionRate() float64 {
	if o.TotalClicks == 0 {
		return 0
	}
	return (float64(o.TotalConversions) / float64(o.TotalClicks)) * 100
}

type UserOffer struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;index:idx_user_offers_user" json:"user_id"`
	OfferID       uuid.UUID `gorm:"type:uuid;not null;index:idx_user_offers_offer" json:"offer_id"`
	AffiliateLink string    `gorm:"type:text;not null" json:"affiliate_link"`
	ShortLink     string    `gorm:"type:text;index:idx_user_offers_short_link" json:"short_link,omitempty"`
	TrackingCode  string    `gorm:"type:varchar(32);index:idx_user_offers_tracking" json:"tracking_code,omitempty"`
	Status        string    `gorm:"type:varchar(20);default:'active';index:idx_user_offers_status" json:"status"`
	Earnings      int       `gorm:"default:0" json:"earnings"`
	TotalClicks   int       `gorm:"default:0" json:"total_clicks"`
	TotalConversions int    `gorm:"default:0" json:"total_conversions"`
	JoinedAt      time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"joined_at"`
	UpdatedAt     time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	User          *AfftokUser  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Offer         *Offer       `gorm:"foreignKey:OfferID" json:"offer,omitempty"`
	Clicks        []Click      `gorm:"foreignKey:UserOfferID" json:"clicks,omitempty"`
	Conversions   []Conversion `gorm:"foreignKey:UserOfferID" json:"conversions,omitempty"`
}

func (UserOffer) TableName() string {
	return "user_offers"
}

func (uo *UserOffer) ConversionRate() float64 {
	totalClicks := len(uo.Clicks)
	totalConversions := len(uo.Conversions)
	if totalClicks == 0 {
		return 0
	}
	return (float64(totalConversions) / float64(totalClicks)) * 100
}
