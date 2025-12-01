package handlers

import (
	"fmt"
	"net/http"

	"github.com/aljapah/afftok-backend-prod/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserStatsResponse struct {
	TotalClicks          int     `json:"total_clicks"`
	TotalConversions     int     `json:"total_conversions"`
	TotalRegisteredOffers int    `json:"total_registered_offers"`
	MonthlyClicks        int     `json:"monthly_clicks"`
	MonthlyConversions   int     `json:"monthly_conversions"`
	GlobalRank           int     `json:"global_rank"`
	ConversionRate       float64 `json:"conversion_rate"`
}

type UserResponseWithStats struct {
	ID                   uuid.UUID         `json:"id"`
	Username             string            `json:"username"`
	Email                string            `json:"email"`
	FullName             string            `json:"full_name"`
	AvatarURL            string            `json:"avatar_url"`
	Bio                  string            `json:"bio"`
	Role                 string            `json:"role"`
	Status               string            `json:"status"`
	Points               int               `json:"points"`
	Level                int               `json:"level"`
	CreatedAt            string            `json:"created_at"`
	Stats                UserStatsResponse `json:"stats"`
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var user models.AfftokUser
	if err := h.db.Preload("UserBadges.Badge").First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var totalClicks int64
	var totalConversions int64
	var totalOffers int64
	var monthlyClicks int64
	var monthlyConversions int64

	h.db.Model(&models.Click{}).
		Joins("JOIN user_offers ON clicks.user_offer_id = user_offers.id").
		Where("user_offers.user_id = ? AND user_offers.status = ?", user.ID, "active").
		Count(&totalClicks)

	h.db.Model(&models.Conversion{}).
		Joins("JOIN user_offers ON conversions.user_offer_id = user_offers.id").
		Where("user_offers.user_id = ? AND conversions.status = ?", user.ID, "approved").
		Count(&totalConversions)

	h.db.Model(&models.UserOffer{}).
		Where("user_id = ? AND status = ?", user.ID, "active").
		Count(&totalOffers)

	h.db.Model(&models.Click{}).
		Joins("JOIN user_offers ON clicks.user_offer_id = user_offers.id").
		Where("user_offers.user_id = ? AND user_offers.status = ? AND EXTRACT(MONTH FROM clicks.clicked_at) = EXTRACT(MONTH FROM NOW())", user.ID, "active").
		Count(&monthlyClicks)

	h.db.Model(&models.Conversion{}).
		Joins("JOIN user_offers ON conversions.user_offer_id = user_offers.id").
		Where("user_offers.user_id = ? AND conversions.status = ? AND EXTRACT(MONTH FROM conversions.converted_at) = EXTRACT(MONTH FROM NOW())", user.ID, "approved").
		Count(&monthlyConversions)

	conversionRate := 0.0
	if totalClicks > 0 {
		conversionRate = (float64(totalConversions) / float64(totalClicks)) * 100
	}

	var globalRank int64 = 1
	h.db.Model(&models.AfftokUser{}).
		Where("total_conversions > ?", user.TotalConversions).
		Count(&globalRank)
	globalRank += 1

	stats := UserStatsResponse{
		TotalClicks:           int(totalClicks),
		TotalConversions:      int(totalConversions),
		TotalRegisteredOffers: int(totalOffers),
		MonthlyClicks:         int(monthlyClicks),
		MonthlyConversions:    int(monthlyConversions),
		GlobalRank:            int(globalRank),
		ConversionRate:        conversionRate,
	}

	response := UserResponseWithStats{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		FullName:  user.FullName,
		AvatarURL: user.AvatarURL,
		Bio:       user.Bio,
		Role:      user.Role,
		Status:    user.Status,
		Points:    user.Points,
		Level:     user.Level,
		CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		Stats:     stats,
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    response,
	})
}
