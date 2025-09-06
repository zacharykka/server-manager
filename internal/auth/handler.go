package auth

import (
	"net/http"
	"strconv"
	"time"

	"server-manager/internal/common"
	"server-manager/internal/middleware"
	"server-manager/internal/user"

	"github.com/gin-gonic/gin"
)

// Handler 认证处理器
type Handler struct {
	userService *user.Service
	jwtManager  *JWTManager
}

// NewHandler 创建认证处理器
func NewHandler(userService *user.Service, jwtManager *JWTManager) *Handler {
	return &Handler{
		userService: userService,
		jwtManager:  jwtManager,
	}
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token     string            `json:"token"`
	User      *user.UserResponse `json:"user"`
	ExpiresAt int64             `json:"expires_at"`
}

// Register 用户注册
func (h *Handler) Register(c *gin.Context) {
	var req user.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	// 创建用户
	newUser, err := h.userService.Create(&req)
	if err != nil {
		if err == user.ErrUserExists {
			c.JSON(http.StatusConflict, common.ErrorResponse("Username or email already exists"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to create user"))
		return
	}

	// 生成JWT令牌
	token, err := h.jwtManager.GenerateToken(newUser.ID, newUser.Username, newUser.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to generate token"))
		return
	}

	response := LoginResponse{
		Token:     token,
		User:      newUser.ToResponse(),
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
	}

	c.JSON(http.StatusCreated, common.SuccessResponse("User registered successfully", response))
}

// Login 用户登录
func (h *Handler) Login(c *gin.Context) {
	var req user.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	// 验证用户凭据
	authenticatedUser, err := h.userService.Authenticate(req.Username, req.Password)
	if err != nil {
		if err == user.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, common.ErrorResponse("Invalid username or password"))
			return
		}
		if err == user.ErrUserNotActive {
			c.JSON(http.StatusUnauthorized, common.ErrorResponse("User account is disabled"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Authentication failed"))
		return
	}

	// 生成JWT令牌
	token, err := h.jwtManager.GenerateToken(authenticatedUser.ID, authenticatedUser.Username, authenticatedUser.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to generate token"))
		return
	}

	response := LoginResponse{
		Token:     token,
		User:      authenticatedUser.ToResponse(),
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Login successful", response))
}

// RefreshToken 刷新令牌
func (h *Handler) RefreshToken(c *gin.Context) {
	// 从当前认证用户获取信息
	userData, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, common.ErrorResponse("Authentication required"))
		return
	}
	
	claims := userData.(*Claims)

	// 生成新的令牌
	token, err := h.jwtManager.GenerateToken(claims.UserID, claims.Username, claims.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to generate token"))
		return
	}

	response := map[string]interface{}{
		"token":      token,
		"expires_at": time.Now().Add(24 * time.Hour).Unix(),
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Token refreshed successfully", response))
}

// GetProfile 获取用户资料
func (h *Handler) GetProfile(c *gin.Context) {
	userData, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, common.ErrorResponse("Authentication required"))
		return
	}
	
	claims := userData.(*Claims)
	
	// 获取完整用户信息
	userInfo, err := h.userService.GetByID(claims.UserID)
	if err != nil {
		if err == user.ErrUserNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("User not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to get user profile"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Profile retrieved successfully", userInfo.ToResponse()))
}

// UpdateProfile 更新用户资料
func (h *Handler) UpdateProfile(c *gin.Context) {
	currentUser := middleware.GetUserFromContext(c)
	if currentUser == nil {
		c.JSON(http.StatusUnauthorized, common.ErrorResponse("Authentication required"))
		return
	}

	var req user.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	// 非管理员用户不能修改角色和激活状态
	if currentUser.Role != "admin" {
		req.Role = ""
		req.IsActive = nil
	}

	// 更新用户信息
	updatedUser, err := h.userService.Update(currentUser.UserID, &req)
	if err != nil {
		if err == user.ErrUserExists {
			c.JSON(http.StatusConflict, common.ErrorResponse("Username or email already exists"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to update profile"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Profile updated successfully", updatedUser.ToResponse()))
}

// ChangePassword 修改密码
func (h *Handler) ChangePassword(c *gin.Context) {
	currentUser := middleware.GetUserFromContext(c)
	if currentUser == nil {
		c.JSON(http.StatusUnauthorized, common.ErrorResponse("Authentication required"))
		return
	}

	var req user.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	// 修改密码
	if err := h.userService.ChangePassword(currentUser.UserID, &req); err != nil {
		if err == user.ErrInvalidCredentials {
			c.JSON(http.StatusBadRequest, common.ErrorResponse("Current password is incorrect"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to change password"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Password changed successfully", nil))
}

// GetUsers 获取用户列表（管理员功能）
func (h *Handler) GetUsers(c *gin.Context) {
	// 解析查询参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit

	// 获取用户列表
	users, total, err := h.userService.List(offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to get users"))
		return
	}

	// 转换为响应格式
	userResponses := make([]*user.UserResponse, len(users))
	for i, u := range users {
		userResponses[i] = u.ToResponse()
	}

	response := map[string]interface{}{
		"users": userResponses,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Users retrieved successfully", response))
}

// GetUser 获取指定用户信息（管理员功能）
func (h *Handler) GetUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid user ID"))
		return
	}

	userInfo, err := h.userService.GetByID(uint(userID))
	if err != nil {
		if err == user.ErrUserNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("User not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to get user"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("User retrieved successfully", userInfo.ToResponse()))
}

// UpdateUser 更新指定用户（管理员功能）
func (h *Handler) UpdateUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid user ID"))
		return
	}

	var req user.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	// 更新用户信息
	updatedUser, err := h.userService.Update(uint(userID), &req)
	if err != nil {
		if err == user.ErrUserNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("User not found"))
			return
		}
		if err == user.ErrUserExists {
			c.JSON(http.StatusConflict, common.ErrorResponse("Username or email already exists"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to update user"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("User updated successfully", updatedUser.ToResponse()))
}

// DeleteUser 删除指定用户（管理员功能）
func (h *Handler) DeleteUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid user ID"))
		return
	}

	// 删除用户
	if err := h.userService.Delete(uint(userID)); err != nil {
		if err == user.ErrUserNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("User not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to delete user"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("User deleted successfully", nil))
}