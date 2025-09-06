package middleware

import (
	"net/http"
	"strings"

	"server-manager/internal/common"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	AuthorizationHeader = "Authorization"
	BearerPrefix        = "Bearer "
	UserContextKey      = "user"
)

var (
	ErrTokenInvalid   = "token is invalid"
	ErrTokenExpired   = "token is expired"
	ErrTokenMalformed = "token is malformed"
)

// Claims JWT声明
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware JWT认证中间件
func AuthMiddleware(secretKey string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		token := extractTokenFromHeader(c)
		if token == "" {
			c.JSON(http.StatusUnauthorized, common.ErrorResponse("Missing or invalid authorization header"))
			c.Abort()
			return
		}

		claims, err := validateToken(token, secretKey)
		if err != nil {
			c.JSON(http.StatusUnauthorized, common.ErrorResponse(err.Error()))
			c.Abort()
			return
		}

		// 将用户信息存储到上下文中
		c.Set(UserContextKey, claims)
		c.Next()
	})
}

// OptionalAuthMiddleware 可选认证中间件（不强制要求认证）
func OptionalAuthMiddleware(secretKey string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		token := extractTokenFromHeader(c)
		if token != "" {
			claims, err := validateToken(token, secretKey)
			if err == nil {
				c.Set(UserContextKey, claims)
			}
		}
		c.Next()
	})
}

// RequireRole 要求特定角色的中间件
func RequireRole(roles ...string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		user := GetUserFromContext(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, common.ErrorResponse("Authentication required"))
			c.Abort()
			return
		}

		// 检查用户是否具有所需角色
		hasRole := false
		for _, role := range roles {
			if user.Role == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, common.ErrorResponse("Insufficient permissions"))
			c.Abort()
			return
		}

		c.Next()
	})
}

// RequireAdmin 要求管理员权限的中间件
func RequireAdmin() gin.HandlerFunc {
	return RequireRole("admin")
}

// validateToken 验证JWT令牌
func validateToken(tokenString, secretKey string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(token *jwt.Token) (interface{}, error) {
			// 验证签名方法
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secretKey), nil
		},
	)

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}

	return claims, nil
}

// extractTokenFromHeader 从请求头中提取JWT令牌
func extractTokenFromHeader(c *gin.Context) string {
	authHeader := c.GetHeader(AuthorizationHeader)
	if authHeader == "" {
		return ""
	}

	if !strings.HasPrefix(authHeader, BearerPrefix) {
		return ""
	}

	return strings.TrimPrefix(authHeader, BearerPrefix)
}

// GetUserFromContext 从上下文中获取用户信息
func GetUserFromContext(c *gin.Context) *Claims {
	value, exists := c.Get(UserContextKey)
	if !exists {
		return nil
	}

	user, ok := value.(*Claims)
	if !ok {
		return nil
	}

	return user
}

// GetCurrentUserID 获取当前用户ID
func GetCurrentUserID(c *gin.Context) uint {
	user := GetUserFromContext(c)
	if user == nil {
		return 0
	}
	return user.UserID
}

// IsCurrentUser 检查是否为当前用户
func IsCurrentUser(c *gin.Context, userID uint) bool {
	currentUserID := GetCurrentUserID(c)
	return currentUserID != 0 && currentUserID == userID
}

// IsAdmin 检查是否为管理员
func IsAdmin(c *gin.Context) bool {
	user := GetUserFromContext(c)
	return user != nil && user.Role == "admin"
}

// CanAccessUser 检查是否可以访问指定用户（管理员或用户本人）
func CanAccessUser(c *gin.Context, userID uint) bool {
	return IsAdmin(c) || IsCurrentUser(c, userID)
}