package models

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
)

// AfftokUser represents an affiliate marketer or advertiser
type AfftokUser struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Username         string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Email            string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash     string    `gorm:"type:varchar(255);not null" json:"-"`
	FullName         string    `gorm:"type:varchar(100)" json:"full_name,omitempty"`
	AvatarURL        string    `gorm:"type:text" json:"avatar_url,omitempty"`
	Bio              string    `gorm:"type:text" json:"bio,omitempty"`
	Role             string    `gorm:"type:varchar(20);default:'promoter'" json:"role"` // promoter or advertiser
	Status           string    `gorm:"type:varchar(20);default:'active'" json:"status"`
	Points           int       `gorm:"default:0" json:"points"`
	Level            int       `gorm:"default:1" json:"level"`
	TotalClicks      int       `gorm:"default:0" json:"total_clicks"`
	TotalConversions int       `gorm:"default:0" json:"total_conversions"`
	TotalEarnings    int       `gorm:"default:0" json:"total_earnings"`
	CreatedAt        time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt        time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	
	// Unique referral code (8 random hex chars) - for professional short links
	UniqueCode       string    `gorm:"type:varchar(16);uniqueIndex" json:"unique_code,omitempty"`
	
	// Payment method for receiving earnings
	PaymentMethod    string    `gorm:"type:text" json:"payment_method,omitempty"`

	// KYC Status - يتحول لـ required تلقائياً عند كشف سلوك مشبوه
	// none = عادي | required = مطلوب تحقق | verified = تم التحقق | rejected = مرفوض
	KYCStatus        string    `gorm:"type:varchar(20);default:'none'" json:"kyc_status"`
	KYCRequiredAt    *time.Time `json:"kyc_required_at,omitempty"`    // متى طُلب التحقق
	KYCVerifiedAt    *time.Time `json:"kyc_verified_at,omitempty"`    // متى تم التحقق
	KYCProviderRef   string    `gorm:"type:varchar(100)" json:"kyc_provider_ref,omitempty"` // معرف من مزود خارجي (SumSub/Veriff)

	// Payoneer Integration - نظام بايونير للدفعات (قريباً)
	PayoneerEmail    string `gorm:"type:varchar(255)" json:"payoneer_email,omitempty"`
	PayoneerStatus   string `gorm:"type:varchar(20);default:'none'" json:"payoneer_status"` // none, pending, verified
	PayoneerVerifiedAt *time.Time `json:"payoneer_verified_at,omitempty"`

	// Advertiser-specific fields (only used when Role = "advertiser")
	CompanyName string `gorm:"type:varchar(100)" json:"company_name,omitempty"`
	Phone       string `gorm:"type:varchar(30)" json:"phone,omitempty"`
	Website     string `gorm:"type:text" json:"website,omitempty"`
	Country     string `gorm:"type:varchar(50)" json:"country,omitempty"`

	// Relationships
	UserOffers       []UserOffer `gorm:"foreignKey:UserID" json:"user_offers,omitempty"`
	TeamMember       *TeamMember `gorm:"foreignKey:UserID" json:"team_member,omitempty"`
	UserBadges       []UserBadge `gorm:"foreignKey:UserID" json:"user_badges,omitempty"`
	AdvertiserOffers []Offer     `gorm:"foreignKey:AdvertiserID" json:"advertiser_offers,omitempty"` // Offers created by this advertiser
}

// TableName specifies the table name
func (AfftokUser) TableName() string {
	return "afftok_users"
}

// UserLevel returns the user level based on conversions
func (u *AfftokUser) UserLevel() string {
	switch {
	case u.TotalConversions >= 500:
		return "legend"
	case u.TotalConversions >= 201:
		return "master"
	case u.TotalConversions >= 51:
		return "expert"
	case u.TotalConversions >= 11:
		return "pro"
	default:
		return "rookie"
	}
}

// UserLevelEmoji returns emoji for user level
func (u *AfftokUser) UserLevelEmoji() string {
	level := u.UserLevel()
	switch level {
	case "legend":
		return "🏆"
	case "master":
		return "👑"
	case "expert":
		return "💎"
	case "pro":
		return "⭐"
	default:
		return "🌱"
	}
}

// ConversionRate calculates the conversion rate
func (u *AfftokUser) ConversionRate() float64 {
	if u.TotalClicks == 0 {
		return 0
	}
	return (float64(u.TotalConversions) / float64(u.TotalClicks)) * 100
}

// PersonalLink returns the user's personal link (uses unique code if available)
func (u *AfftokUser) PersonalLink() string {
	if u.UniqueCode != "" {
		return "go.afftokapp.com/r/" + u.UniqueCode
	}
	return "go.afftokapp.com/u/" + u.Username
}

// GenerateUniqueCode generates a random 8-character hex code
func GenerateUniqueCode() string {
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// KYC Status Constants
const (
	KYCStatusNone     = "none"     // عادي - لا يحتاج تحقق
	KYCStatusRequired = "required" // مطلوب تحقق - تم كشف سلوك مشبوه
	KYCStatusVerified = "verified" // تم التحقق بنجاح
	KYCStatusRejected = "rejected" // مرفوض - فشل التحقق
)

// RequiresKYC checks if user needs KYC verification
func (u *AfftokUser) RequiresKYC() bool {
	return u.KYCStatus == KYCStatusRequired
}

// IsKYCVerified checks if user passed KYC
func (u *AfftokUser) IsKYCVerified() bool {
	return u.KYCStatus == KYCStatusVerified
}

// IsKYCRejected checks if user failed KYC
func (u *AfftokUser) IsKYCRejected() bool {
	return u.KYCStatus == KYCStatusRejected
}

// CanPromote checks if user can continue promoting
func (u *AfftokUser) CanPromote() bool {
	// Can promote if: no KYC needed OR already verified
	return u.KYCStatus == KYCStatusNone || u.KYCStatus == KYCStatusVerified
}

// AdminUser represents an admin panel user
type AdminUser struct {
	ID           int       `gorm:"primary_key;auto_increment" json:"id"`
	OpenID       string    `gorm:"type:varchar(64);uniqueIndex;not null" json:"open_id"`
	Name         string    `gorm:"type:text" json:"name,omitempty"`
	Email        string    `gorm:"type:varchar(320)" json:"email,omitempty"`
	LoginMethod  string    `gorm:"type:varchar(64)" json:"login_method,omitempty"`
	Role         string    `gorm:"type:varchar(20);default:'user'" json:"role"`
	CreatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	LastSignedIn time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"last_signed_in"`
}

// TableName specifies the table name
func (AdminUser) TableName() string {
	return "admin_users"
}
