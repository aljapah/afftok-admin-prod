package handlers

import (
	"net/http"

	"github.com/aljapah/afftok-backend-prod/internal/models"
	"github.com/aljapah/afftok-backend-prod/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// KYCSimpleHandler handles simplified KYC operations
type KYCSimpleHandler struct {
	db         *gorm.DB
	kycService *services.KYCAutoService
}

// NewKYCSimpleHandler creates a new KYC handler
func NewKYCSimpleHandler(db *gorm.DB) *KYCSimpleHandler {
	return &KYCSimpleHandler{
		db:         db,
		kycService: services.NewKYCAutoService(db),
	}
}

// GetMyKYCStatus returns current user's KYC status
// GET /api/kyc/status
func (h *KYCSimpleHandler) GetMyKYCStatus(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	uid, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.AfftokUser
	if err := h.db.Select("kyc_status, kyc_required_at, kyc_verified_at").
		First(&user, "id = ?", uid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	response := gin.H{
		"kyc_status":      user.KYCStatus,
		"can_promote":     user.CanPromote(),
		"requires_kyc":    user.RequiresKYC(),
		"is_verified":     user.IsKYCVerified(),
	}

	if user.KYCRequiredAt != nil {
		response["kyc_required_at"] = user.KYCRequiredAt
	}
	if user.KYCVerifiedAt != nil {
		response["kyc_verified_at"] = user.KYCVerifiedAt
	}

	// If KYC is required, include verification URL
	if user.RequiresKYC() {
		response["verification_url"] = "https://verify.sumsub.com/idensic/l/#/afftok" // مثال - يتم تغييره لمزود حقيقي
		response["message"] = "Identity verification required to continue promoting"
		response["message_ar"] = "مطلوب تأكيد الهوية لاستمرار الترويج"
	}

	c.JSON(http.StatusOK, response)
}

// ProviderWebhook receives verification result from external KYC provider
// POST /api/kyc/webhook
// This is called by SumSub/Veriff/Persona when verification completes
func (h *KYCSimpleHandler) ProviderWebhook(c *gin.Context) {
	// Verify webhook signature (implement based on provider)
	// For now, we accept a simple JSON payload
	
	var req struct {
		UserID       string `json:"user_id" binding:"required"`
		ExternalID   string `json:"external_id"`
		ReviewStatus string `json:"review_status" binding:"required"` // "completed", "rejected"
		ReviewResult string `json:"review_result"`                    // "GREEN", "RED"
		ProviderName string `json:"provider"`                         // "sumsub", "veriff", "persona"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	uid, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Determine if verified based on provider response
	verified := req.ReviewStatus == "completed" && req.ReviewResult == "GREEN"
	providerRef := req.ProviderName + ":" + req.ExternalID

	if err := h.kycService.UpdateKYCFromProvider(uid, verified, providerRef); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update KYC status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"user_id":  req.UserID,
		"verified": verified,
	})
}

// AdminGetUserKYC returns KYC status for a specific user
// GET /api/admin/kyc/:id
func (h *KYCSimpleHandler) AdminGetUserKYC(c *gin.Context) {
	userIDParam := c.Param("id")
	uid, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.AfftokUser
	if err := h.db.Select("id, username, email, kyc_status, kyc_required_at, kyc_verified_at, kyc_provider_ref").
		First(&user, "id = ?", uid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":          user.ID,
		"username":         user.Username,
		"email":            user.Email,
		"kyc_status":       user.KYCStatus,
		"kyc_required_at":  user.KYCRequiredAt,
		"kyc_verified_at":  user.KYCVerifiedAt,
		"kyc_provider_ref": user.KYCProviderRef,
	})
}

// AdminGetUsersRequiringKYC returns list of users with KYC required status
// GET /api/admin/kyc/pending
func (h *KYCSimpleHandler) AdminGetUsersRequiringKYC(c *gin.Context) {
	var users []models.AfftokUser
	if err := h.db.Where("kyc_status = ?", models.KYCStatusRequired).
		Select("id, username, email, kyc_status, kyc_required_at").
		Order("kyc_required_at DESC").
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"count": len(users),
		"users": users,
	})
}

// AdminResetKYC resets KYC status to none
// POST /api/admin/kyc/:id/reset
func (h *KYCSimpleHandler) AdminResetKYC(c *gin.Context) {
	userIDParam := c.Param("id")
	uid, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.kycService.ResetKYCStatus(uid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset KYC status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "KYC status reset to none",
	})
}

// AdminManualVerify manually marks user as verified (emergency use only)
// POST /api/admin/kyc/:id/verify
func (h *KYCSimpleHandler) AdminManualVerify(c *gin.Context) {
	userIDParam := c.Param("id")
	uid, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.kycService.UpdateKYCFromProvider(uid, true, "admin:manual"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User manually verified",
	})
}

// AdminTriggerKYC manually triggers KYC requirement for a user
// POST /api/admin/kyc/:id/require
func (h *KYCSimpleHandler) AdminTriggerKYC(c *gin.Context) {
	userIDParam := c.Param("id")
	uid, err := uuid.Parse(userIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	triggered, reason, err := h.kycService.CheckAndTriggerKYC(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check KYC"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"triggered": triggered,
		"reason":    reason,
	})
}

