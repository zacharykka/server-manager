package user

import (
	"errors"
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserExists        = errors.New("user already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotActive     = errors.New("user is not active")
)

// Service 用户服务
type Service struct {
	db *gorm.DB
}

// NewService 创建用户服务
func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// Create 创建用户
func (s *Service) Create(req *CreateUserRequest) (*User, error) {
	// 检查用户名是否已存在
	var existingUser User
	if err := s.db.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
		return nil, ErrUserExists
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// 设置默认角色
	role := req.Role
	if role == "" {
		role = "user"
	}

	user := &User{
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     role,
		IsActive: true,
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

// GetByID 根据ID获取用户
func (s *Service) GetByID(id uint) (*User, error) {
	var user User
	if err := s.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// GetByUsername 根据用户名获取用户
func (s *Service) GetByUsername(username string) (*User, error) {
	var user User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// GetByEmail 根据邮箱获取用户
func (s *Service) GetByEmail(email string) (*User, error) {
	var user User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// Authenticate 验证用户凭据
func (s *Service) Authenticate(username, password string) (*User, error) {
	// 获取用户（支持用户名或邮箱登录）
	var user User
	if err := s.db.Where("username = ? OR email = ?", username, username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	// 检查用户是否激活
	if !user.IsActive {
		return nil, ErrUserNotActive
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return &user, nil
}

// Update 更新用户信息
func (s *Service) Update(id uint, req *UpdateUserRequest) (*User, error) {
	user, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	// 检查用户名或邮箱是否被其他用户使用
	if req.Username != "" && req.Username != user.Username {
		var existingUser User
		if err := s.db.Where("username = ? AND id != ?", req.Username, id).First(&existingUser).Error; err == nil {
			return nil, ErrUserExists
		}
		user.Username = req.Username
	}

	if req.Email != "" && req.Email != user.Email {
		var existingUser User
		if err := s.db.Where("email = ? AND id != ?", req.Email, id).First(&existingUser).Error; err == nil {
			return nil, ErrUserExists
		}
		user.Email = req.Email
	}

	if req.Role != "" {
		user.Role = req.Role
	}

	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	user.UpdatedAt = time.Now()

	if err := s.db.Save(user).Error; err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return user, nil
}

// ChangePassword 修改密码
func (s *Service) ChangePassword(id uint, req *ChangePasswordRequest) error {
	user, err := s.GetByID(id)
	if err != nil {
		return err
	}

	// 验证旧密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		return ErrInvalidCredentials
	}

	// 加密新密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user.Password = string(hashedPassword)
	user.UpdatedAt = time.Now()

	if err := s.db.Save(user).Error; err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// Delete 删除用户（软删除）
func (s *Service) Delete(id uint) error {
	if err := s.db.Delete(&User{}, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}

// List 获取用户列表
func (s *Service) List(offset, limit int) ([]*User, int64, error) {
	var users []*User
	var total int64

	// 获取总数
	if err := s.db.Model(&User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 获取用户列表
	if err := s.db.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}