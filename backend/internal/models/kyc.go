package models

import (
	"time"

	"github.com/google/uuid"
)

// KYCStatus represents the verification status
type KYCStatus string

const (
	KYCStatusPending   KYCStatus = "pending"
	KYCStatusApproved  KYCStatus = "approved"
	KYCStatusRejected  KYCStatus = "rejected"
	KYCStatusExpired   KYCStatus = "expired"
)

// KYCVerification represents a user's KYC verification record
type KYCVerification struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	
	// Personal Information
	FullLegalName   string    `gorm:"type:varchar(200);not null" json:"full_legal_name"`
	DateOfBirth     time.Time `gorm:"type:date" json:"date_of_birth"`
	Nationality     string    `gorm:"type:varchar(2)" json:"nationality"` // ISO country code
	Country         string    `gorm:"type:varchar(2);not null" json:"country"` // Residence country
	Address         string    `gorm:"type:text" json:"address"`
	City            string    `gorm:"type:varchar(100)" json:"city"`
	PostalCode      string    `gorm:"type:varchar(20)" json:"postal_code"`
	PhoneNumber     string    `gorm:"type:varchar(30)" json:"phone_number"`
	
	// Document Information
	DocumentType    string    `gorm:"type:varchar(50);not null" json:"document_type"` // passport, national_id, driving_license
	DocumentNumber  string    `gorm:"type:varchar(100)" json:"document_number"`
	DocumentFrontURL string   `gorm:"type:text" json:"document_front_url"`
	DocumentBackURL  string   `gorm:"type:text" json:"document_back_url"`
	SelfieURL       string    `gorm:"type:text" json:"selfie_url"`
	DocumentExpiry  *time.Time `gorm:"type:date" json:"document_expiry,omitempty"`
	
	// Verification Status
	Status          KYCStatus `gorm:"type:varchar(20);default:'pending';index" json:"status"`
	RejectionReason string    `gorm:"type:text" json:"rejection_reason,omitempty"`
	ReviewedBy      *uuid.UUID `gorm:"type:uuid" json:"reviewed_by,omitempty"`
	ReviewedAt      *time.Time `json:"reviewed_at,omitempty"`
	
	// Risk Assessment
	RiskLevel       string    `gorm:"type:varchar(20);default:'low'" json:"risk_level"` // low, medium, high
	RiskNotes       string    `gorm:"type:text" json:"risk_notes,omitempty"`
	
	// Timestamps
	CreatedAt       time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt       time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	
	// Relationships
	User            *AfftokUser `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (KYCVerification) TableName() string {
	return "kyc_verifications"
}

// IsVerified checks if KYC is approved
func (k *KYCVerification) IsVerified() bool {
	return k.Status == KYCStatusApproved
}

// CanRequestPayout checks if user can request payout
func (k *KYCVerification) CanRequestPayout() bool {
	return k.Status == KYCStatusApproved
}

// PaymentMethod represents a user's payout method
type PaymentMethod struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	
	// Method Type
	MethodType    string `gorm:"type:varchar(50);not null" json:"method_type"` // bank_transfer, paypal, payoneer, crypto
	IsDefault     bool   `gorm:"default:false" json:"is_default"`
	IsVerified    bool   `gorm:"default:false" json:"is_verified"`
	
	// Bank Transfer Details
	BankName      string `gorm:"type:varchar(200)" json:"bank_name,omitempty"`
	AccountName   string `gorm:"type:varchar(200)" json:"account_name,omitempty"`
	AccountNumber string `gorm:"type:varchar(100)" json:"account_number,omitempty"`
	IBAN          string `gorm:"type:varchar(50)" json:"iban,omitempty"`
	SwiftCode     string `gorm:"type:varchar(20)" json:"swift_code,omitempty"`
	BankCountry   string `gorm:"type:varchar(2)" json:"bank_country,omitempty"`
	
	// PayPal Details
	PayPalEmail   string `gorm:"type:varchar(255)" json:"paypal_email,omitempty"`
	
	// Payoneer Details
	PayoneerEmail string `gorm:"type:varchar(255)" json:"payoneer_email,omitempty"`
	PayoneerID    string `gorm:"type:varchar(100)" json:"payoneer_id,omitempty"`
	
	// Crypto Details
	CryptoType    string `gorm:"type:varchar(20)" json:"crypto_type,omitempty"` // btc, eth, usdt
	WalletAddress string `gorm:"type:varchar(200)" json:"wallet_address,omitempty"`
	Network       string `gorm:"type:varchar(50)" json:"network,omitempty"` // erc20, trc20, bep20
	
	// Status
	Status        string `gorm:"type:varchar(20);default:'active'" json:"status"`
	
	// Timestamps
	CreatedAt     time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt     time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	
	// Relationships
	User          *AfftokUser `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (PaymentMethod) TableName() string {
	return "payment_methods"
}

// PayoutRequest represents a withdrawal request
type PayoutRequest struct {
	ID              uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID          uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	PaymentMethodID uuid.UUID  `gorm:"type:uuid;not null" json:"payment_method_id"`
	
	// Amount
	Amount          int        `gorm:"not null" json:"amount"` // in cents
	Currency        string     `gorm:"type:varchar(3);default:'USD'" json:"currency"`
	Fee             int        `gorm:"default:0" json:"fee"` // processing fee
	NetAmount       int        `gorm:"not null" json:"net_amount"` // amount - fee
	
	// Status
	Status          string     `gorm:"type:varchar(20);default:'pending';index" json:"status"` // pending, processing, completed, rejected, cancelled
	RejectionReason string     `gorm:"type:text" json:"rejection_reason,omitempty"`
	
	// Processing Info
	TransactionID   string     `gorm:"type:varchar(100)" json:"transaction_id,omitempty"`
	ProcessedBy     *uuid.UUID `gorm:"type:uuid" json:"processed_by,omitempty"`
	ProcessedAt     *time.Time `json:"processed_at,omitempty"`
	
	// Notes
	UserNotes       string     `gorm:"type:text" json:"user_notes,omitempty"`
	AdminNotes      string     `gorm:"type:text" json:"admin_notes,omitempty"`
	
	// Timestamps
	CreatedAt       time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt       time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	
	// Relationships
	User            *AfftokUser    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	PaymentMethod   *PaymentMethod `gorm:"foreignKey:PaymentMethodID" json:"payment_method,omitempty"`
}

func (PayoutRequest) TableName() string {
	return "payout_requests"
}

// PayoutStatus constants
const (
	PayoutStatusPending    = "pending"
	PayoutStatusProcessing = "processing"
	PayoutStatusCompleted  = "completed"
	PayoutStatusRejected   = "rejected"
	PayoutStatusCancelled  = "cancelled"
)

// MinPayoutAmount minimum payout amount in cents ($10)
const MinPayoutAmount = 1000

