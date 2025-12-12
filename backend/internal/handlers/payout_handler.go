package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/aljapah/afftok-backend-prod/internal/models"
)

// PayoutHandler handles payout-related API endpoints
// نظام Payoneer للدفعات - معطل حالياً وجاهز للتفعيل
type PayoutHandler struct {
	db *gorm.DB
}

// NewPayoutHandler creates a new payout handler
func NewPayoutHandler(db *gorm.DB) *PayoutHandler {
	return &PayoutHandler{db: db}
}

// ============================================================
// Admin Endpoints - نقاط API للوحة الإدارة
// ============================================================

// GetPayoutBatches returns all payout batches
// GET /api/admin/payouts/batches
func (h *PayoutHandler) GetPayoutBatches(c *gin.Context) {
	var batches []models.PayoutBatch
	
	result := h.db.Order("period DESC").Find(&batches)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch batches"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"batches": batches,
		"total":   len(batches),
		"system_status": "disabled", // النظام معطل حالياً
		"message": "Payoneer system is ready but not activated. Waiting for Payoneer partnership.",
	})
}

// GetPayoutBatch returns a single batch with its payouts
// GET /api/admin/payouts/batches/:id
func (h *PayoutHandler) GetPayoutBatch(c *gin.Context) {
	batchID := c.Param("id")
	
	var batch models.PayoutBatch
	result := h.db.Preload("Payouts").Preload("Payouts.Advertiser").Preload("Payouts.Publisher").
		Where("id = ?", batchID).First(&batch)
	
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Batch not found"})
		return
	}
	
	c.JSON(http.StatusOK, batch)
}

// GetAllPayouts returns all payouts with filters
// GET /api/admin/payouts
func (h *PayoutHandler) GetAllPayouts(c *gin.Context) {
	var payouts []models.Payout
	
	query := h.db.Preload("Advertiser").Preload("Publisher").Order("created_at DESC")
	
	// فلتر بالفترة
	if period := c.Query("period"); period != "" {
		query = query.Where("period = ?", period)
	}
	
	// فلتر بالحالة
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	// فلتر بالمعلن
	if advertiserID := c.Query("advertiser_id"); advertiserID != "" {
		query = query.Where("advertiser_id = ?", advertiserID)
	}
	
	// فلتر بالمروج
	if publisherID := c.Query("publisher_id"); publisherID != "" {
		query = query.Where("publisher_id = ?", publisherID)
	}
	
	result := query.Limit(500).Find(&payouts)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payouts"})
		return
	}
	
	// حساب الملخص
	var summary models.PayoutSummary
	h.db.Model(&models.Payout{}).Select("COUNT(*) as total_payouts, COALESCE(SUM(amount), 0) as total_amount, COALESCE(SUM(platform_fee), 0) as total_platform_fee").Scan(&summary)
	h.db.Model(&models.Payout{}).Where("status = ?", "pending").Select("COUNT(*) as pending_count, COALESCE(SUM(amount), 0) as pending_amount").Scan(&summary)
	h.db.Model(&models.Payout{}).Where("status = ?", "paid").Select("COUNT(*) as paid_count, COALESCE(SUM(amount), 0) as paid_amount").Scan(&summary)
	
	c.JSON(http.StatusOK, gin.H{
		"payouts":       payouts,
		"summary":       summary,
		"total":         len(payouts),
		"system_status": "disabled",
		"message":       "Payoneer system is ready but not activated.",
	})
}

// GeneratePayoutBatch generates a new payout batch for a specific period
// POST /api/admin/payouts/generate
func (h *PayoutHandler) GeneratePayoutBatch(c *gin.Context) {
	var req models.GeneratePayoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	// تحديد الفترة
	if req.Period == "" {
		req.Period = fmt.Sprintf("%d-%02d", req.Year, req.Month)
	}
	
	// التحقق من عدم وجود دفعة لنفس الفترة
	var existingBatch models.PayoutBatch
	if h.db.Where("period = ?", req.Period).First(&existingBatch).Error == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":    "Batch already exists for this period",
			"batch_id": existingBatch.ID,
		})
		return
	}
	
	// حساب تواريخ الفترة
	year := req.Year
	month := req.Month
	periodStart := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	periodEnd := periodStart.AddDate(0, 1, 0).Add(-time.Second)
	
	// جلب جميع التحويلات المؤكدة للفترة
	var conversions []struct {
		AdvertiserID uuid.UUID
		PublisherID  uuid.UUID
		TotalAmount  float64
		Count        int
	}
	
	// Query: جلب التحويلات المجمعة حسب المعلن والمروج
	result := h.db.Table("conversions c").
		Select(`
			o.advertiser_id,
			uo.user_id as publisher_id,
			COALESCE(SUM(c.amount), 0) as total_amount,
			COUNT(*) as count
		`).
		Joins("JOIN user_offers uo ON c.user_offer_id = uo.id").
		Joins("JOIN offers o ON uo.offer_id = o.id").
		Where("c.status = ?", "approved").
		Where("c.converted_at >= ? AND c.converted_at <= ?", periodStart, periodEnd).
		Where("o.advertiser_id IS NOT NULL").
		Group("o.advertiser_id, uo.user_id").
		Scan(&conversions)
	
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate payouts", "details": result.Error.Error()})
		return
	}
	
	if len(conversions) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message":       "No approved conversions found for this period",
			"period":        req.Period,
			"payouts_count": 0,
		})
		return
	}
	
	// إنشاء الدفعة
	batch := models.PayoutBatch{
		ID:          uuid.New(),
		Period:      req.Period,
		PeriodStart: periodStart,
		PeriodEnd:   periodEnd,
		Status:      models.BatchStatusDraft,
		Currency:    "USD",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	// حساب الإحصائيات وإنشاء المستحقات
	var payouts []models.Payout
	advertisersMap := make(map[uuid.UUID]bool)
	publishersMap := make(map[uuid.UUID]bool)
	
	for _, conv := range conversions {
		payout := models.Payout{
			ID:               uuid.New(),
			BatchID:          &batch.ID,
			AdvertiserID:     conv.AdvertiserID,
			PublisherID:      conv.PublisherID,
			Amount:           conv.TotalAmount,
			PlatformFee:      conv.TotalAmount * 0.10, // 10% عمولة
			NetAmount:        conv.TotalAmount * 0.90,
			Currency:         "USD",
			Period:           req.Period,
			PeriodStart:      periodStart,
			PeriodEnd:        periodEnd,
			ConversionsCount: conv.Count,
			Status:           models.PayoutStatusPending,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}
		payouts = append(payouts, payout)
		
		batch.TotalAmount += payout.Amount
		batch.TotalPlatformFee += payout.PlatformFee
		batch.TotalNetAmount += payout.NetAmount
		batch.TotalConversions += conv.Count
		
		advertisersMap[conv.AdvertiserID] = true
		publishersMap[conv.PublisherID] = true
	}
	
	batch.TotalPayouts = len(payouts)
	batch.TotalAdvertisers = len(advertisersMap)
	batch.TotalPublishers = len(publishersMap)
	
	// حفظ في قاعدة البيانات
	tx := h.db.Begin()
	
	if err := tx.Create(&batch).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create batch"})
		return
	}
	
	if err := tx.Create(&payouts).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payouts"})
		return
	}
	
	tx.Commit()
	
	c.JSON(http.StatusOK, gin.H{
		"message":          "Payout batch generated successfully",
		"batch":            batch,
		"payouts_count":    len(payouts),
		"total_amount":     batch.TotalAmount,
		"platform_fee":     batch.TotalPlatformFee,
		"net_amount":       batch.TotalNetAmount,
		"system_status":    "disabled",
		"activation_note":  "This batch is saved but NOT submitted to Payoneer. System will be activated after Payoneer partnership.",
	})
}

// ExportPayoutBatchCSV exports a batch to CSV file
// GET /api/admin/payouts/batches/:id/export
func (h *PayoutHandler) ExportPayoutBatchCSV(c *gin.Context) {
	batchID := c.Param("id")
	
	var payouts []models.Payout
	result := h.db.Preload("Advertiser").Preload("Publisher").
		Where("batch_id = ?", batchID).Find(&payouts)
	
	if result.Error != nil || len(payouts) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No payouts found for this batch"})
		return
	}
	
	// إعداد ملف CSV
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=payout_batch_%s.csv", batchID))
	
	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()
	
	// كتابة العناوين
	headers := []string{
		"advertiser_id", "advertiser_email", "advertiser_payoneer",
		"publisher_id", "publisher_email", "publisher_payoneer",
		"amount", "platform_fee", "net_amount", "currency", "period", "conversions_count",
	}
	writer.Write(headers)
	
	// كتابة البيانات
	for _, p := range payouts {
		advEmail := ""
		advPayoneer := ""
		pubEmail := ""
		pubPayoneer := ""
		
		if p.Advertiser != nil {
			advEmail = p.Advertiser.Email
			advPayoneer = p.Advertiser.PayoneerEmail
		}
		if p.Publisher != nil {
			pubEmail = p.Publisher.Email
			pubPayoneer = p.Publisher.PayoneerEmail
		}
		
		row := []string{
			p.AdvertiserID.String(),
			advEmail,
			advPayoneer,
			p.PublisherID.String(),
			pubEmail,
			pubPayoneer,
			fmt.Sprintf("%.2f", p.Amount),
			fmt.Sprintf("%.2f", p.PlatformFee),
			fmt.Sprintf("%.2f", p.NetAmount),
			p.Currency,
			p.Period,
			fmt.Sprintf("%d", p.ConversionsCount),
		}
		writer.Write(row)
	}
}

// GetPayoutsSummary returns summary statistics
// GET /api/admin/payouts/summary
func (h *PayoutHandler) GetPayoutsSummary(c *gin.Context) {
	var summary struct {
		TotalBatches      int64   `json:"total_batches"`
		TotalPayouts      int64   `json:"total_payouts"`
		TotalAmount       float64 `json:"total_amount"`
		TotalPlatformFee  float64 `json:"total_platform_fee"`
		PendingBatches    int64   `json:"pending_batches"`
		CompletedBatches  int64   `json:"completed_batches"`
		TotalPublishers   int64   `json:"total_publishers"`
		TotalAdvertisers  int64   `json:"total_advertisers"`
	}
	
	h.db.Model(&models.PayoutBatch{}).Count(&summary.TotalBatches)
	h.db.Model(&models.Payout{}).Count(&summary.TotalPayouts)
	h.db.Model(&models.Payout{}).Select("COALESCE(SUM(amount), 0)").Scan(&summary.TotalAmount)
	h.db.Model(&models.Payout{}).Select("COALESCE(SUM(platform_fee), 0)").Scan(&summary.TotalPlatformFee)
	h.db.Model(&models.PayoutBatch{}).Where("status IN ?", []string{"draft", "submitted", "processing"}).Count(&summary.PendingBatches)
	h.db.Model(&models.PayoutBatch{}).Where("status = ?", "completed").Count(&summary.CompletedBatches)
	h.db.Model(&models.Payout{}).Distinct("publisher_id").Count(&summary.TotalPublishers)
	h.db.Model(&models.Payout{}).Distinct("advertiser_id").Count(&summary.TotalAdvertisers)
	
	c.JSON(http.StatusOK, gin.H{
		"summary":       summary,
		"system_status": "disabled",
		"message":       "Payoneer integration ready but not activated",
	})
}

// ============================================================
// Promoter Endpoints - نقاط API للمروج
// ============================================================

// GetPromoterPayouts returns payouts for a specific promoter
// GET /api/promoter/payouts
func (h *PayoutHandler) GetPromoterPayouts(c *gin.Context) {
	userID := c.GetString("user_id") // من الـ middleware
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	
	var payouts []models.Payout
	h.db.Preload("Advertiser").Where("publisher_id = ?", userID).
		Order("created_at DESC").Limit(100).Find(&payouts)
	
	// حساب الإجماليات
	var totalPending, totalPaid float64
	for _, p := range payouts {
		if p.Status == models.PayoutStatusPending {
			totalPending += p.NetAmount
		} else if p.Status == models.PayoutStatusPaid {
			totalPaid += p.NetAmount
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"payouts":       payouts,
		"total_pending": totalPending,
		"total_paid":    totalPaid,
		"system_status": "coming_soon",
		"message":       "نظام الدفعات التلقائية عبر Payoneer قادم قريباً! حالياً يتم الدفع مباشرة من المعلن.",
	})
}

// UpdatePromoterPayoneerEmail updates the promoter's Payoneer email
// PUT /api/promoter/payoneer-email
func (h *PayoutHandler) UpdatePromoterPayoneerEmail(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	
	var req struct {
		PayoneerEmail string `json:"payoneer_email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	result := h.db.Model(&models.AfftokUser{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"payoneer_email":  req.PayoneerEmail,
		"payoneer_status": "pending",
		"updated_at":      time.Now(),
	})
	
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message":       "Payoneer email updated successfully",
		"status":        "pending",
		"system_status": "coming_soon",
		"note":          "سيتم تفعيل الدفعات التلقائية قريباً. حالياً استمر باستخدام طريقة الدفع المحددة في ملفك الشخصي.",
	})
}

// ============================================================
// Advertiser Endpoints - نقاط API للمعلن
// ============================================================

// GetAdvertiserPayouts returns payouts that an advertiser needs to pay
// GET /api/advertiser/payouts
func (h *PayoutHandler) GetAdvertiserPayouts(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	
	var payouts []models.Payout
	h.db.Preload("Publisher").Where("advertiser_id = ?", userID).
		Order("created_at DESC").Limit(100).Find(&payouts)
	
	// حساب الإجماليات
	var totalPending, totalPaid float64
	for _, p := range payouts {
		if p.Status == models.PayoutStatusPending {
			totalPending += p.Amount
		} else if p.Status == models.PayoutStatusPaid {
			totalPaid += p.Amount
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"payouts":       payouts,
		"total_pending": totalPending,
		"total_paid":    totalPaid,
		"system_status": "coming_soon",
		"message":       "نظام الدفعات التلقائية عبر Payoneer قادم قريباً! حالياً استمر بالدفع مباشرة للمروجين.",
	})
}

// UpdateAdvertiserPayoneerEmail updates the advertiser's Payoneer email
// PUT /api/advertiser/payoneer-email
func (h *PayoutHandler) UpdateAdvertiserPayoneerEmail(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	
	var req struct {
		PayoneerEmail string `json:"payoneer_email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	result := h.db.Model(&models.AfftokUser{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"payoneer_email":  req.PayoneerEmail,
		"payoneer_status": "pending",
		"updated_at":      time.Now(),
	})
	
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message":       "Payoneer email updated successfully",
		"status":        "pending",
		"system_status": "coming_soon",
		"note":          "سيتم تفعيل السحب التلقائي من حسابك قريباً. حالياً استمر بالدفع مباشرة للمروجين.",
	})
}

// ============================================================
// ملاحظة: هذه الـ endpoints معطلة عملياً
// تُرجع البيانات مع رسالة "coming_soon"
// سيتم تفعيلها بعد التعاقد مع Payoneer
// ============================================================

