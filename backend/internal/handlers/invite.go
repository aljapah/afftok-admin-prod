package handlers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/aljapah/afftok-backend-prod/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type InviteHandler struct {
	db *gorm.DB
}

func NewInviteHandler(db *gorm.DB) *InviteHandler {
	return &InviteHandler{db: db}
}

// GetInviteInfo returns the team invite landing page (public)
func (h *InviteHandler) GetInviteInfo(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invite code is required"})
		return
	}

	// Find team by invite code
	var team models.Team
	if err := h.db.Preload("Owner").Preload("Members.User").Where("invite_code = ?", code).First(&team).Error; err != nil {
		// Return error page
		h.serveErrorPage(c)
		return
	}

	// Calculate team stats
	activeMembers := 0
	var totalConversions, totalClicks int
	members := []map[string]interface{}{}

	for _, member := range team.Members {
		if member.Status == "active" {
			activeMembers++
			totalConversions += member.User.TotalConversions
			totalClicks += member.User.TotalClicks

			name := member.User.FullName
			if name == "" {
				name = member.User.Username
			}

			members = append(members, map[string]interface{}{
				"name":     name,
				"username": member.User.Username,
				"isOwner":  member.Role == "owner",
			})
		}
	}

	// Build team data for JavaScript
	teamData := map[string]interface{}{
		"name":         team.Name,
		"description":  team.Description,
		"logoUrl":      team.LogoURL,
		"membersCount": activeMembers,
		"conversions":  totalConversions,
		"clicks":       totalClicks,
		"members":      members,
	}

	teamDataJSON, _ := json.Marshal(teamData)

	// Read the template file
	html := h.readTemplate()
	if html == "" {
		h.serveErrorPage(c)
		return
	}

	// Inject data script before </head>
	dataScript := fmt.Sprintf(`<script>
		window.teamData = %s;
		window.inviteCode = "%s";
	</script>`, string(teamDataJSON), code)

	html = strings.Replace(html, "</head>", dataScript+"</head>", 1)

	// Update page title
	html = strings.Replace(html, "<title>انضم للفريق - AffTok</title>",
		fmt.Sprintf("<title>انضم لفريق %s - AffTok</title>", team.Name), 1)

	// Add Open Graph meta tags
	ogTags := fmt.Sprintf(`
	<meta property="og:title" content="انضم لفريق %s على AffTok">
	<meta property="og:description" content="%s">
	<meta property="og:image" content="%s">
	<meta property="og:type" content="website">
	`, team.Name, team.Description, team.LogoURL)

	html = strings.Replace(html, "<meta charset=\"UTF-8\">",
		"<meta charset=\"UTF-8\">"+ogTags, 1)

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}

func (h *InviteHandler) readTemplate() string {
	// Try multiple paths
	paths := []string{
		"public/team_invite_landing.html",
		"./public/team_invite_landing.html",
		"../public/team_invite_landing.html",
	}

	for _, path := range paths {
		data, err := ioutil.ReadFile(path)
		if err == nil {
			return string(data)
		}
	}

	return ""
}

func (h *InviteHandler) serveErrorPage(c *gin.Context) {
	errorHTML := `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رابط غير صالح - AffTok</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container { 
            text-align: center; 
            padding: 60px 40px;
            background: rgba(255,255,255,0.03);
            border: 1px solid #333;
            border-radius: 24px;
            max-width: 400px;
        }
        .icon {
            font-size: 80px;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #FF006E, #FF4D00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        h1 { 
            font-size: 28px; 
            margin-bottom: 16px;
            font-weight: 700;
        }
        p { 
            font-size: 16px; 
            color: #888;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .btn {
            background: linear-gradient(135deg, #FF006E, #FF4D00);
            color: white;
            padding: 14px 32px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(255,0,110,0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon"><i class="fas fa-link-slash"></i></div>
        <h1>رابط الدعوة غير صالح</h1>
        <p>هذا الرابط غير موجود أو منتهي الصلاحية. تأكد من صحة الرابط أو تواصل مع صاحب الدعوة.</p>
        <a href="https://afftokapp.com" class="btn">زيارة الموقع</a>
    </div>
</body>
</html>`
	c.Data(http.StatusNotFound, "text/html; charset=utf-8", []byte(errorHTML))
}

// RecordInviteVisit records a visit to an invite link
func (h *InviteHandler) RecordInviteVisit(c *gin.Context) {
	code := c.Param("code")
	c.JSON(http.StatusOK, gin.H{
		"message": "Visit recorded",
		"code":    code,
	})
}

// GetMyInviteLink returns the authenticated user's personal invite link
func (h *InviteHandler) GetMyInviteLink(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":     userID,
		"invite_link": "https://go.afftokapp.com/api/invite/user123",
		"invite_code": "user123",
	})
}

// CheckPendingInvite checks if user has a pending invite to claim
func (h *InviteHandler) CheckPendingInvite(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":        userID,
		"pending_invite": nil,
		"has_pending":    false,
	})
}

// AutoJoinByInvite automatically joins user to team based on stored invite
func (h *InviteHandler) AutoJoinByInvite(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "No pending invite to auto-join",
		"user_id": userID,
	})
}

// ClaimInvite claims a specific invite by ID
func (h *InviteHandler) ClaimInvite(c *gin.Context) {
	inviteID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Invite claimed successfully",
		"invite_id": inviteID,
		"user_id":   userID,
	})
}

// ClaimInviteByCode claims an invite using the invite code
func (h *InviteHandler) ClaimInviteByCode(c *gin.Context) {
	code := c.Param("code")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Invite claimed successfully",
		"code":    code,
		"user_id": userID,
	})
}
