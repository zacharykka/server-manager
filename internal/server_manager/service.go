package server_manager

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
)

var (
	ErrServerNotFound      = errors.New("server not found")
	ErrServerExists        = errors.New("server name already exists")
	ErrServerGroupNotFound = errors.New("server group not found")
	ErrServerGroupExists   = errors.New("server group name already exists")
)

// Service 服务器管理服务
type Service struct {
	db *gorm.DB
}

// NewService 创建服务器管理服务
func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// 服务器相关操作

// CreateServer 创建服务器
func (s *Service) CreateServer(req *CreateServerRequest) (*Server, error) {
	// 检查服务器名称是否已存在
	var existingServer Server
	if err := s.db.Where("name = ?", req.Name).First(&existingServer).Error; err == nil {
		return nil, ErrServerExists
	}

	// 验证组是否存在
	if req.GroupID != nil {
		var group ServerGroup
		if err := s.db.First(&group, *req.GroupID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrServerGroupNotFound
			}
			return nil, err
		}
	}

	// 设置默认端口
	port := req.Port
	if port == 0 {
		port = 22
	}

	server := &Server{
		Name:        req.Name,
		Host:        req.Host,
		Port:        port,
		Username:    req.Username,
		Password:    req.Password,
		PrivateKey:  req.PrivateKey,
		Description: req.Description,
		OS:          req.OS,
		Status:      "unknown",
		GroupID:     req.GroupID,
		Tags:        req.Tags,
	}

	if err := s.db.Create(server).Error; err != nil {
		return nil, fmt.Errorf("failed to create server: %w", err)
	}

	// 预加载关联数据
	if err := s.db.Preload("Group").First(server, server.ID).Error; err != nil {
		return nil, err
	}

	return server, nil
}

// GetServerByID 根据ID获取服务器
func (s *Service) GetServerByID(id uint) (*Server, error) {
	var server Server
	if err := s.db.Preload("Group").First(&server, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrServerNotFound
		}
		return nil, err
	}
	return &server, nil
}

// GetServerByName 根据名称获取服务器
func (s *Service) GetServerByName(name string) (*Server, error) {
	var server Server
	if err := s.db.Preload("Group").Where("name = ?", name).First(&server).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrServerNotFound
		}
		return nil, err
	}
	return &server, nil
}

// UpdateServer 更新服务器信息
func (s *Service) UpdateServer(id uint, req *UpdateServerRequest) (*Server, error) {
	server, err := s.GetServerByID(id)
	if err != nil {
		return nil, err
	}

	// 检查名称冲突
	if req.Name != "" && req.Name != server.Name {
		var existingServer Server
		if err := s.db.Where("name = ? AND id != ?", req.Name, id).First(&existingServer).Error; err == nil {
			return nil, ErrServerExists
		}
		server.Name = req.Name
	}

	// 验证组是否存在
	if req.GroupID != nil && *req.GroupID != 0 {
		var group ServerGroup
		if err := s.db.First(&group, *req.GroupID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrServerGroupNotFound
			}
			return nil, err
		}
		server.GroupID = req.GroupID
	} else if req.GroupID != nil && *req.GroupID == 0 {
		server.GroupID = nil
	}

	// 更新字段
	if req.Host != "" {
		server.Host = req.Host
	}
	if req.Port != nil {
		server.Port = *req.Port
	}
	if req.Username != "" {
		server.Username = req.Username
	}
	if req.Password != "" {
		server.Password = req.Password
	}
	if req.PrivateKey != "" {
		server.PrivateKey = req.PrivateKey
	}
	if req.Description != "" {
		server.Description = req.Description
	}
	if req.OS != "" {
		server.OS = req.OS
	}
	if req.Tags != "" {
		server.Tags = req.Tags
	}

	server.UpdatedAt = time.Now()

	if err := s.db.Save(server).Error; err != nil {
		return nil, fmt.Errorf("failed to update server: %w", err)
	}

	// 重新加载关联数据
	if err := s.db.Preload("Group").First(server, server.ID).Error; err != nil {
		return nil, err
	}

	return server, nil
}

// UpdateServerStatus 更新服务器状态
func (s *Service) UpdateServerStatus(id uint, status string) error {
	return s.db.Model(&Server{}).Where("id = ?", id).Update("status", status).Error
}

// DeleteServer 删除服务器（软删除）
func (s *Service) DeleteServer(id uint) error {
	if err := s.db.Delete(&Server{}, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrServerNotFound
		}
		return fmt.Errorf("failed to delete server: %w", err)
	}
	return nil
}

// ListServers 获取服务器列表
func (s *Service) ListServers(groupID *uint, offset, limit int) ([]*Server, int64, error) {
	var servers []*Server
	var total int64

	query := s.db.Model(&Server{})
	if groupID != nil {
		if *groupID == 0 {
			// groupID = 0 表示查询未分组的服务器
			query = query.Where("group_id IS NULL")
		} else {
			query = query.Where("group_id = ?", *groupID)
		}
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 获取服务器列表
	if err := query.Preload("Group").Offset(offset).Limit(limit).Order("created_at DESC").Find(&servers).Error; err != nil {
		return nil, 0, err
	}

	return servers, total, nil
}

// SearchServers 搜索服务器
func (s *Service) SearchServers(keyword string, offset, limit int) ([]*Server, int64, error) {
	var servers []*Server
	var total int64

	// 构建搜索查询
	query := s.db.Model(&Server{}).Where(
		"name LIKE ? OR host LIKE ? OR description LIKE ? OR tags LIKE ?",
		"%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%",
	)

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 获取服务器列表
	if err := query.Preload("Group").Offset(offset).Limit(limit).Order("created_at DESC").Find(&servers).Error; err != nil {
		return nil, 0, err
	}

	return servers, total, nil
}

// 服务器组相关操作

// CreateServerGroup 创建服务器组
func (s *Service) CreateServerGroup(req *CreateServerGroupRequest) (*ServerGroup, error) {
	// 检查组名称是否已存在
	var existingGroup ServerGroup
	if err := s.db.Where("name = ?", req.Name).First(&existingGroup).Error; err == nil {
		return nil, ErrServerGroupExists
	}

	// 设置默认颜色
	color := req.Color
	if color == "" {
		color = "#3b82f6"
	}

	group := &ServerGroup{
		Name:        req.Name,
		Description: req.Description,
		Color:       color,
	}

	if err := s.db.Create(group).Error; err != nil {
		return nil, fmt.Errorf("failed to create server group: %w", err)
	}

	return group, nil
}

// GetServerGroupByID 根据ID获取服务器组
func (s *Service) GetServerGroupByID(id uint) (*ServerGroup, error) {
	var group ServerGroup
	if err := s.db.Preload("Servers").First(&group, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrServerGroupNotFound
		}
		return nil, err
	}
	return &group, nil
}

// UpdateServerGroup 更新服务器组
func (s *Service) UpdateServerGroup(id uint, req *UpdateServerGroupRequest) (*ServerGroup, error) {
	group, err := s.GetServerGroupByID(id)
	if err != nil {
		return nil, err
	}

	// 检查名称冲突
	if req.Name != "" && req.Name != group.Name {
		var existingGroup ServerGroup
		if err := s.db.Where("name = ? AND id != ?", req.Name, id).First(&existingGroup).Error; err == nil {
			return nil, ErrServerGroupExists
		}
		group.Name = req.Name
	}

	// 更新字段
	if req.Description != "" {
		group.Description = req.Description
	}
	if req.Color != "" {
		group.Color = req.Color
	}

	group.UpdatedAt = time.Now()

	if err := s.db.Save(group).Error; err != nil {
		return nil, fmt.Errorf("failed to update server group: %w", err)
	}

	return group, nil
}

// DeleteServerGroup 删除服务器组
func (s *Service) DeleteServerGroup(id uint) error {
	// 检查组是否存在
	group, err := s.GetServerGroupByID(id)
	if err != nil {
		return err
	}

	// 检查是否有关联的服务器
	var serverCount int64
	if err := s.db.Model(&Server{}).Where("group_id = ?", id).Count(&serverCount).Error; err != nil {
		return err
	}

	if serverCount > 0 {
		return fmt.Errorf("cannot delete server group with %d servers, move servers first", serverCount)
	}

	if err := s.db.Delete(group).Error; err != nil {
		return fmt.Errorf("failed to delete server group: %w", err)
	}

	return nil
}

// ListServerGroups 获取服务器组列表
func (s *Service) ListServerGroups() ([]*ServerGroup, error) {
	var groups []*ServerGroup
	
	if err := s.db.Preload("Servers").Order("created_at DESC").Find(&groups).Error; err != nil {
		return nil, err
	}

	return groups, nil
}

// GetServerStats 获取服务器统计信息
func (s *Service) GetServerStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// 总服务器数量
	var totalServers int64
	if err := s.db.Model(&Server{}).Count(&totalServers).Error; err != nil {
		return nil, err
	}
	stats["total_servers"] = totalServers

	// 按状态统计
	statusStats := make(map[string]int64)
	rows, err := s.db.Model(&Server{}).Select("status, count(*) as count").Group("status").Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int64
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		statusStats[status] = count
	}
	stats["status_stats"] = statusStats

	// 总组数量
	var totalGroups int64
	if err := s.db.Model(&ServerGroup{}).Count(&totalGroups).Error; err != nil {
		return nil, err
	}
	stats["total_groups"] = totalGroups

	return stats, nil
}