package handlers

import (
	"net/http"
	"time"

	"github.com/aljapah/afftok-backend-prod/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type KYCHandler struct {
	db *gorm.DB
}

func NewKYCHandler(db *gorm.DB) *KYCHandler {
	return &KYCHandler{db: db}
}

// ============================================
// KYC VERIFICATION ENDPOINTS
// ============================================

// SubmitKYC submits a new KYC verification request
func (h *KYCHandler) SubmitKYC(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Check if user already has pending or approved KYC
	var existingKYC models.KYCVerification
	if err := h.db.Where("user_id = ? AND status IN ?", userID, []string{"pending", "approved"}).First(&existingKYC).Error; err == nil {
		if existingKYC.Status == "approved" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "KYC already verified"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "KYC verification already pending"})
		return
	}

	type KYCRequest struct {
		FullLegalName    string `json:"full_legal_name" binding:"required"`
		DateOfBirth      string `json:"date_of_birth" binding:"required"`
		Nationality      string `json:"nationality" binding:"required,len=2"`
		Country          string `json:"country" binding:"required,len=2"`
		Address          string `json:"address"`
		City             string `json:"city"`
		PostalCode       string `json:"postal_code"`
		PhoneNumber      string `json:"phone_number"`
		DocumentType     string `json:"document_type" binding:"required"`
		DocumentNumber   string `json:"document_number"`
		DocumentFrontURL string `json:"document_front_url" binding:"required"`
		DocumentBackURL  string `json:"document_back_url"`
		SelfieURL        string `json:"selfie_url" binding:"required"`
		DocumentExpiry   string `json:"document_expiry"`
	}

	var req KYCRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Parse date of birth
	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date of birth format (use YYYY-MM-DD)"})
		return
	}

	// Parse document expiry if provided
	var docExpiry *time.Time
	if req.DocumentExpiry != "" {
		exp, err := time.Parse("2006-01-02", req.DocumentExpiry)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document expiry format"})
			return
		}
		docExpiry = &exp
	}

	kyc := models.KYCVerification{
		ID:               uuid.New(),
		UserID:           userID,
		FullLegalName:    req.FullLegalName,
		DateOfBirth:      dob,
		Nationality:      req.Nationality,
		Country:          req.Country,
		Address:          req.Address,
		City:             req.City,
		PostalCode:       req.PostalCode,
		PhoneNumber:      req.PhoneNumber,
		DocumentType:     req.DocumentType,
		DocumentNumber:   req.DocumentNumber,
		DocumentFrontURL: req.DocumentFrontURL,
		DocumentBackURL:  req.DocumentBackURL,
		SelfieURL:        req.SelfieURL,
		DocumentExpiry:   docExpiry,
		Status:           models.KYCStatusPending,
		RiskLevel:        "low",
	}

	if err := h.db.Create(&kyc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit KYC"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "KYC submitted successfully. Please wait for review.",
		"kyc":     kyc,
	})
}

// GetMyKYC returns the current user's KYC status
func (h *KYCHandler) GetMyKYC(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, _ := uuid.Parse(userIDStr.(string))

	var kyc models.KYCVerification
	if err := h.db.Where("user_id = ?", userID).Order("created_at DESC").First(&kyc).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"has_kyc":     false,
			"is_verified": false,
			"message":     "No KYC submitted yet",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"has_kyc":     true,
		"is_verified": kyc.Status == models.KYCStatusApproved,
		"kyc":         kyc,
	})
}

// ============================================
// PAYMENT METHOD ENDPOINTS
// ============================================

// AddPaymentMethod adds a new payment method
func (h *KYCHandler) AddPaymentMethod(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, _ := uuid.Parse(userIDStr.(string))

	type PaymentMethodRequest struct {
		MethodType    string `json:"method_type" binding:"required"` // bank_transfer, paypal, payoneer, crypto
		BankName      string `json:"bank_name"`
		AccountName   string `json:"account_name"`
		AccountNumber string `json:"account_number"`
		IBAN          string `json:"iban"`
		SwiftCode     string `json:"swift_code"`
		BankCountry   string `json:"bank_country"`
		PayPalEmail   string `json:"paypal_email"`
		PayoneerEmail string `json:"payoneer_email"`
		PayoneerID    string `json:"payoneer_id"`
		CryptoType    string `json:"crypto_type"`
		WalletAddress string `json:"wallet_address"`
		Network       string `json:"network"`
		IsDefault     bool   `json:"is_default"`
	}

	var req PaymentMethodRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Validate method type
	validTypes := map[string]bool{"bank_transfer": true, "paypal": true, "payoneer": true, "crypto": true}
	if !validTypes[req.MethodType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment method type"})
		return
	}

	// If setting as default, unset other defaults
	if req.IsDefault {
		h.db.Model(&models.PaymentMethod{}).Where("user_id = ?", userID).Update("is_default", false)
	}

	pm := models.PaymentMethod{
		ID:            uuid.New(),
		UserID:        userID,
		MethodType:    req.MethodType,
		IsDefault:     req.IsDefault,
		IsVerified:    false, // Will be verified after first successful payout
		BankName:      req.BankName,
		AccountName:   req.AccountName,
		AccountNumber: req.AccountNumber,
		IBAN:          req.IBAN,
		SwiftCode:     req.SwiftCode,
		BankCountry:   req.BankCountry,
		PayPalEmail:   req.PayPalEmail,
		PayoneerEmail: req.PayoneerEmail,
		PayoneerID:    req.PayoneerID,
		CryptoType:    req.CryptoType,
		WalletAddress: req.WalletAddress,
		Network:       req.Network,
		Status:        "active",
	}

	if err := h.db.Create(&pm).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add payment method"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":        true,
		"payment_method": pm,
	})
}

// GetMyPaymentMethods returns user's payment methods
func (h *KYCHandler) GetMyPaymentMethods(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, _ := uuid.Parse(userIDStr.(string))

	var methods []models.PaymentMethod
	h.db.Where("user_id = ? AND status = 'active'", userID).Find(&methods)

	c.JSON(http.StatusOK, gin.H{
		"payment_methods": methods,
	})
}

// DeletePaymentMethod deletes a payment method
func (h *KYCHandler) DeletePaymentMethod(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, _ := uuid.Parse(userIDStr.(string))
	methodID, _ := uuid.Parse(c.Param("id"))

	result := h.db.Where("id = ? AND user_id = ?", methodID, userID).Delete(&models.PaymentMethod{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment method not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ============================================
// PAYOUT REQUEST ENDPOINTS
// ============================================

// RequestPayout creates a new payout request
func (h *KYCHandler) RequestPayout(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, _ := uuid.Parse(userIDStr.(string))

	// Check KYC status
	var kyc models.KYCVerification
	if err := h.db.Where("user_id = ? AND status = 'approved'", userID).First(&kyc).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "KYC verification required before requesting payout",
			"code":    "KYC_REQUIRED",
			"message": "Please complete KYC verification first",
		})
		return
	}

	type PayoutRequestBody struct {
		PaymentMethodID string `json:"payment_method_id" binding:"required"`
		Amount          int    `json:"amount" binding:"required,min=1000"` // min $10
		UserNotes       string `json:"user_notes"`
	}

	var req PayoutRequestBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request. Minimum amount is $10"})
		return
	}

	pmID, _ := uuid.Parse(req.PaymentMethodID)

	// Verify payment method belongs to user
	var pm models.PaymentMethod
	if err := h.db.Where("id = ? AND user_id = ?", pmID, userID).First(&pm).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment method"})
		return
	}

	// Check user balance
	var user models.AfftokUser
	h.db.First(&user, "id = ?", userID)
	if user.TotalEarnings < req.Amount {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Insufficient balance",
			"balance": user.TotalEarnings,
		})
		return
	}

	// Check for pending payout
	var pendingPayout models.PayoutRequest
	if err := h.db.Where("user_id = ? AND status IN ?", userID, []string{"pending", "processing"}).First(&pendingPayout).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "You already have a pending payout request",
		})
		return
	}

	// Calculate fee (2% or min $1)
	fee := req.Amount * 2 / 100
	if fee < 100 {
		fee = 100
	}
	netAmount := req.Amount - fee

	payout := models.PayoutRequest{
		ID:              uuid.New(),
		UserID:          userID,
		PaymentMethodID: pmID,
		Amount:          req.Amount,
		Currency:        "USD",
		Fee:             fee,
		NetAmount:       netAmount,
		Status:          models.PayoutStatusPending,
		UserNotes:       req.UserNotes,
	}

	if err := h.db.Create(&payout).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payout request"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Payout request submitted successfully",
		"payout":  payout,
	})
}

// GetMyPayouts returns user's payout history
func (h *KYCHandler) GetMyPayouts(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, _ := uuid.Parse(userIDStr.(string))

	var payouts []models.PayoutRequest
	h.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&payouts)

	c.JSON(http.StatusOK, gin.H{
		"payouts": payouts,
	})
}

// CancelPayout cancels a pending payout request
func (h *KYCHandler) CancelPayout(c *gin.Context) {
	userIDStr, _ := c.Get("userID")
	userID, _ := uuid.Parse(userIDStr.(string))
	payoutID, _ := uuid.Parse(c.Param("id"))

	var payout models.PayoutRequest
	if err := h.db.Where("id = ? AND user_id = ? AND status = 'pending'", payoutID, userID).First(&payout).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pending payout not found"})
		return
	}

	payout.Status = models.PayoutStatusCancelled
	h.db.Save(&payout)

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Payout cancelled"})
}

// ============================================
// ADMIN KYC ENDPOINTS
// ============================================

// AdminGetKYCList returns list of KYC verifications for admin
func (h *KYCHandler) AdminGetKYCList(c *gin.Context) {
	status := c.Query("status") // pending, approved, rejected
	
	query := h.db.Model(&models.KYCVerification{}).Preload("User")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var kycs []models.KYCVerification
	query.Order("created_at DESC").Find(&kycs)

	c.JSON(http.StatusOK, gin.H{
		"kyc_verifications": kycs,
		"total":             len(kycs),
	})
}

// AdminReviewKYC approves or rejects a KYC verification
func (h *KYCHandler) AdminReviewKYC(c *gin.Context) {
	kycID, _ := uuid.Parse(c.Param("id"))
	adminIDStr, _ := c.Get("userID")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	type ReviewRequest struct {
		Action          string `json:"action" binding:"required"` // approve, reject
		RejectionReason string `json:"rejection_reason"`
		RiskLevel       string `json:"risk_level"`
		RiskNotes       string `json:"risk_notes"`
	}

	var req ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var kyc models.KYCVerification
	if err := h.db.First(&kyc, "id = ?", kycID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "KYC not found"})
		return
	}

	if kyc.Status != models.KYCStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "KYC already reviewed"})
		return
	}

	now := time.Now()
	kyc.ReviewedBy = &adminID
	kyc.ReviewedAt = &now

	switch req.Action {
	case "approve":
		kyc.Status = models.KYCStatusApproved
		kyc.RiskLevel = req.RiskLevel
		if kyc.RiskLevel == "" {
			kyc.RiskLevel = "low"
		}
		kyc.RiskNotes = req.RiskNotes
	case "reject":
		kyc.Status = models.KYCStatusRejected
		kyc.RejectionReason = req.RejectionReason
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
		return
	}

	h.db.Save(&kyc)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"kyc":     kyc,
	})
}

// AdminGetPayoutList returns list of payout requests for admin
func (h *KYCHandler) AdminGetPayoutList(c *gin.Context) {
	status := c.Query("status")
	
	query := h.db.Model(&models.PayoutRequest{}).Preload("User").Preload("PaymentMethod")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var payouts []models.PayoutRequest
	query.Order("created_at DESC").Find(&payouts)

	c.JSON(http.StatusOK, gin.H{
		"payouts": payouts,
		"total":   len(payouts),
	})
}

// AdminProcessPayout processes a payout request
func (h *KYCHandler) AdminProcessPayout(c *gin.Context) {
	payoutID, _ := uuid.Parse(c.Param("id"))
	adminIDStr, _ := c.Get("userID")
	adminID, _ := uuid.Parse(adminIDStr.(string))

	type ProcessRequest struct {
		Action          string `json:"action" binding:"required"` // approve, reject, complete
		TransactionID   string `json:"transaction_id"`
		RejectionReason string `json:"rejection_reason"`
		AdminNotes      string `json:"admin_notes"`
	}

	var req ProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var payout models.PayoutRequest
	if err := h.db.First(&payout, "id = ?", payoutID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payout not found"})
		return
	}

	now := time.Now()
	payout.ProcessedBy = &adminID
	payout.ProcessedAt = &now
	payout.AdminNotes = req.AdminNotes

	switch req.Action {
	case "approve":
		if payout.Status != models.PayoutStatusPending {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payout is not pending"})
			return
		}
		payout.Status = models.PayoutStatusProcessing
		
	case "complete":
		if payout.Status != models.PayoutStatusProcessing {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payout is not in processing"})
			return
		}
		payout.Status = models.PayoutStatusCompleted
		payout.TransactionID = req.TransactionID
		
		// Deduct from user balance
		h.db.Model(&models.AfftokUser{}).Where("id = ?", payout.UserID).
			UpdateColumn("total_earnings", gorm.Expr("total_earnings - ?", payout.Amount))
			
		// Mark payment method as verified
		h.db.Model(&models.PaymentMethod{}).Where("id = ?", payout.PaymentMethodID).
			Update("is_verified", true)
			
	case "reject":
		payout.Status = models.PayoutStatusRejected
		payout.RejectionReason = req.RejectionReason
		
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
		return
	}

	h.db.Save(&payout)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"payout":  payout,
	})
}

