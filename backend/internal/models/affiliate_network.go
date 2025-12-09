package models

import (
	"time"

	"github.com/google/uuid"
)

// AffiliateNetwork represents external affiliate networks (Noon, Amazon, Payoneer, etc.)
type AffiliateNetwork struct {
	ID                  uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name                string    `gorm:"type:varchar(100);not null" json:"name"`
	NameAr              string    `gorm:"type:varchar(100)" json:"name_ar,omitempty"`
	Type                string    `gorm:"type:varchar(30);not null" json:"type"` // marketplace, payment_provider, direct
	LogoURL             string    `gorm:"type:text" json:"logo_url,omitempty"`
	WebsiteURL          string    `gorm:"type:text" json:"website_url,omitempty"`
	AffiliateProgramURL string    `gorm:"type:text" json:"affiliate_program_url,omitempty"`

	// API Integration
	APIURL    string `gorm:"type:text" json:"-"`
	APIKey    string `gorm:"type:text" json:"-"`
	APISecret string `gorm:"type:text" json:"-"`

	// Payment Info
	PaymentMethod   string `gorm:"type:varchar(50)" json:"payment_method,omitempty"`   // bank_transfer, paypal, payoneer, internal
	PaymentCurrency string `gorm:"type:varchar(3);default:'USD'" json:"payment_currency"`
	MinPayout       int    `gorm:"default:50" json:"min_payout"`
	PaymentCycle    string `gorm:"type:varchar(30)" json:"payment_cycle,omitempty"` // monthly, weekly, net30

	// Coverage
	SupportedCountries string `gorm:"type:text" json:"supported_countries,omitempty"` // JSON array

	// Status
	Status   string `gorm:"type:varchar(20);default:'active'" json:"status"`
	Priority int    `gorm:"default:0" json:"priority"`

	// Stats
	TotalOffers    int `gorm:"default:0" json:"total_offers"`
	TotalPromoters int `gorm:"default:0" json:"total_promoters"`

	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (AffiliateNetwork) TableName() string {
	return "affiliate_networks"
}

// PromoterNetworkAccount represents a promoter's account in an external network
type PromoterNetworkAccount struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	NetworkID uuid.UUID `gorm:"type:uuid;not null;index" json:"network_id"`

	// External Account Info
	ExternalAccountID string `gorm:"type:varchar(100)" json:"external_account_id,omitempty"`
	ExternalUsername  string `gorm:"type:varchar(100)" json:"external_username,omitempty"`
	ExternalEmail     string `gorm:"type:varchar(255)" json:"external_email,omitempty"`

	// Status
	Status     string     `gorm:"type:varchar(20);default:'pending'" json:"status"`
	VerifiedAt *time.Time `gorm:"" json:"verified_at,omitempty"`

	// Payment Info
	PaymentEmail  string `gorm:"type:varchar(255)" json:"payment_email,omitempty"`
	PaymentMethod string `gorm:"type:varchar(50)" json:"payment_method,omitempty"`

	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Relationships
	User    *AfftokUser       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Network *AffiliateNetwork `gorm:"foreignKey:NetworkID" json:"network,omitempty"`
}

func (PromoterNetworkAccount) TableName() string {
	return "promoter_network_accounts"
}

// PaymentSourceType constants
const (
	PaymentSourceDirect   = "direct"   // المعلن يدفع للمروج مباشرة (النظام الحالي)
	PaymentSourcePayoneer = "payoneer" // بايونير - قريباً
)

// NetworkType constants
const (
	NetworkTypeMarketplace      = "marketplace"       // نون، أمازون
	NetworkTypePaymentProvider  = "payment_provider"  // بايونير
	NetworkTypeDirect           = "direct"            // معلن مباشر
)

// NetworkStatus constants
const (
	NetworkStatusActive     = "active"
	NetworkStatusInactive   = "inactive"
	NetworkStatusComingSoon = "coming_soon"
)

// Predefined Networks - الشبكات المعرّفة مسبقاً
var PredefinedNetworks = []AffiliateNetwork{
	{
		Name:                "Direct",
		NameAr:              "مباشر",
		Type:                NetworkTypeDirect,
		LogoURL:             "",
		WebsiteURL:          "",
		AffiliateProgramURL: "",
		PaymentMethod:       "direct",
		PaymentCurrency:     "USD",
		MinPayout:           0,
		PaymentCycle:        "monthly",
		SupportedCountries:  `["SA", "AE", "EG", "MA", "DZ", "TN", "IN", "PK", "KW", "BH", "OM", "QA"]`,
		Status:              NetworkStatusActive,
		Priority:            1,
	},
	{
		Name:                "Payoneer",
		NameAr:              "بايونير",
		Type:                NetworkTypePaymentProvider,
		LogoURL:             "https://www.payoneer.com/favicon.ico",
		WebsiteURL:          "https://www.payoneer.com",
		AffiliateProgramURL: "https://www.payoneer.com/partners",
		PaymentMethod:       "payoneer",
		PaymentCurrency:     "USD",
		MinPayout:           50,
		PaymentCycle:        "weekly",
		SupportedCountries:  `["SA", "AE", "EG", "MA", "DZ", "TN", "IN", "PK", "KW", "BH", "OM", "QA"]`,
		Status:              NetworkStatusComingSoon,
		Priority:            10,
	},
}

