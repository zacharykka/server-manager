package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrTokenInvalid   = errors.New("token is invalid")
	ErrTokenExpired   = errors.New("token is expired")
	ErrTokenMalformed = errors.New("token is malformed")
)

// Claims JWT声明
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// JWTManager JWT管理器
type JWTManager struct {
	secretKey     string
	tokenDuration time.Duration
}

// NewJWTManager 创建JWT管理器
func NewJWTManager(secretKey string, tokenDuration time.Duration) *JWTManager {
	return &JWTManager{
		secretKey:     secretKey,
		tokenDuration: tokenDuration,
	}
}

// GenerateToken 生成JWT令牌
func (manager *JWTManager) GenerateToken(userID uint, username, role string) (string, error) {
	claims := &Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(manager.tokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "server-manager",
			Subject:   username,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(manager.secretKey))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken 验证JWT令牌
func (manager *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(token *jwt.Token) (interface{}, error) {
			// 验证签名方法
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(manager.secretKey), nil
		},
	)

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		if errors.Is(err, jwt.ErrTokenMalformed) {
			return nil, ErrTokenMalformed
		}
		return nil, ErrTokenInvalid
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrTokenInvalid
	}

	return claims, nil
}

// RefreshToken 刷新令牌
func (manager *JWTManager) RefreshToken(tokenString string) (string, error) {
	claims, err := manager.ValidateToken(tokenString)
	if err != nil {
		// 如果令牌过期，我们仍然可以尝试刷新（在合理的时间窗口内）
		if !errors.Is(err, ErrTokenExpired) {
			return "", err
		}
		
		// 解析过期的令牌以获取声明
		token, _ := jwt.ParseWithClaims(
			tokenString,
			&Claims{},
			func(token *jwt.Token) (interface{}, error) {
				return []byte(manager.secretKey), nil
			},
		)
		
		if token == nil {
			return "", ErrTokenInvalid
		}
		
		claims, ok := token.Claims.(*Claims)
		if !ok {
			return "", ErrTokenInvalid
		}
		
		// 检查令牌是否在刷新窗口内（例如过期后1小时内）
		refreshWindow := time.Hour
		if time.Since(claims.ExpiresAt.Time) > refreshWindow {
			return "", ErrTokenExpired
		}
	}

	// 生成新令牌
	return manager.GenerateToken(claims.UserID, claims.Username, claims.Role)
}