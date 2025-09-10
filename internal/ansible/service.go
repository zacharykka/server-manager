package ansible

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
	"gorm.io/gorm"
)

// Service 定义ansible服务接口
type Service interface {
	// Adhoc命令相关
	ExecuteAdhocCommand(ctx context.Context, userID uint, req *AdhocExecutionRequest) (*AdhocExecution, error)
	GetAdhocExecution(id uint) (*AdhocExecution, error)
	ListAdhocExecutions(userID uint, offset, limit int) ([]AdhocExecution, int64, error)
	
	// Inventory管理相关
	CreateInventory(userID uint, req *InventoryRequest) (*Inventory, error)
	UpdateInventory(id uint, userID uint, req *InventoryRequest) (*Inventory, error)
	DeleteInventory(id uint, userID uint) error
	GetInventory(id uint) (*Inventory, error)
	ListInventories(userID uint, offset, limit int) ([]Inventory, int64, error)
	GetDefaultInventory(userID uint) (*Inventory, error)
	
	// Playbook管理相关
	CreatePlaybook(userID uint, req *PlaybookRequest) (*Playbook, error)
	UpdatePlaybook(id uint, userID uint, req *PlaybookRequest) (*Playbook, error)
	DeletePlaybook(id uint, userID uint) error
	GetPlaybook(id uint) (*Playbook, error)
	ListPlaybooks(userID uint, offset, limit int) ([]Playbook, int64, error)
	
	// 统计信息
	GetExecutionStats(userID uint) (*ExecutionStats, error)
	
	// 系统检查
	CheckAnsibleInstallation() error
}

// AnsibleService ansible服务实现
type AnsibleService struct {
	db       *gorm.DB
	executor CommandExecutor
}

// NewAnsibleService 创建新的ansible服务
func NewAnsibleService(db *gorm.DB, executor CommandExecutor) *AnsibleService {
	return &AnsibleService{
		db:       db,
		executor: executor,
	}
}

// ExecuteAdhocCommand 执行adhoc命令
func (s *AnsibleService) ExecuteAdhocCommand(ctx context.Context, userID uint, req *AdhocExecutionRequest) (*AdhocExecution, error) {
	// 验证请求参数
	if err := ValidateAdhocRequest(req); err != nil {
		return nil, fmt.Errorf("invalid request: %v", err)
	}
	
	// 创建执行记录
	execution := &AdhocExecution{
		Command:   fmt.Sprintf("ansible %s -m %s", req.Hosts, req.Module),
		Module:    req.Module,
		Args:      req.Args,
		Inventory: req.Inventory,
		Hosts:     req.Hosts,
		Status:    "pending",
		UserID:    userID,
	}
	
	// 处理额外变量
	if req.ExtraVars != nil {
		extraVarsJSON, err := json.Marshal(req.ExtraVars)
		if err != nil {
			return nil, fmt.Errorf("marshal extra vars failed: %v", err)
		}
		execution.ExtraVars = string(extraVarsJSON)
	}
	
	// 保存到数据库
	if err := s.db.Create(execution).Error; err != nil {
		return nil, fmt.Errorf("create execution record failed: %v", err)
	}
	
	// 异步执行命令
	go s.executeAdhocAsync(ctx, execution, req)
	
	return execution, nil
}

// executeAdhocAsync 异步执行adhoc命令
func (s *AnsibleService) executeAdhocAsync(ctx context.Context, execution *AdhocExecution, req *AdhocExecutionRequest) {
	// 更新状态为运行中
	startTime := time.Now()
	s.updateExecutionStatus(execution.ID, "running", &startTime, nil)
	
	// 执行命令
	result, err := s.executor.ExecuteAdhoc(ctx, req)
	
	endTime := time.Now()
	
	// 更新执行结果
	updates := map[string]interface{}{
		"end_time":     &endTime,
		"duration":     int(endTime.Sub(startTime).Seconds()),
		"output":       "",
		"error_output": "",
		"exit_code":    0,
		"status":       "failed",
	}
	
	if err != nil {
		updates["error_output"] = err.Error()
		updates["status"] = "failed"
	} else {
		updates["output"] = result.Output
		updates["error_output"] = result.ErrorOutput
		updates["exit_code"] = result.ExitCode
		if result.Success {
			updates["status"] = "success"
		} else {
			updates["status"] = "failed"
		}
	}
	
	s.db.Model(&AdhocExecution{}).Where("id = ?", execution.ID).Updates(updates)
}

// updateExecutionStatus 更新执行状态
func (s *AnsibleService) updateExecutionStatus(id uint, status string, startTime, endTime *time.Time) {
	updates := map[string]interface{}{
		"status": status,
	}
	
	if startTime != nil {
		updates["start_time"] = startTime
	}
	
	if endTime != nil {
		updates["end_time"] = endTime
	}
	
	s.db.Model(&AdhocExecution{}).Where("id = ?", id).Updates(updates)
}

// GetAdhocExecution 获取adhoc执行记录
func (s *AnsibleService) GetAdhocExecution(id uint) (*AdhocExecution, error) {
	var execution AdhocExecution
	err := s.db.First(&execution, id).Error
	if err != nil {
		return nil, err
	}
	return &execution, nil
}

// ListAdhocExecutions 列出adhoc执行记录
func (s *AnsibleService) ListAdhocExecutions(userID uint, offset, limit int) ([]AdhocExecution, int64, error) {
	var executions []AdhocExecution
	var total int64
	
	query := s.db.Model(&AdhocExecution{}).Where("user_id = ?", userID)
	
	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// 获取分页数据
	err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&executions).Error
	if err != nil {
		return nil, 0, err
	}
	
	return executions, total, nil
}

// CreateInventory 创建inventory
func (s *AnsibleService) CreateInventory(userID uint, req *InventoryRequest) (*Inventory, error) {
	// 如果设置为默认，需要先取消其他默认inventory
	if req.IsDefault {
		s.db.Model(&Inventory{}).Where("user_id = ? AND is_default = ?", userID, true).Update("is_default", false)
	}
	
	inventory := &Inventory{
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		Content:     req.Content,
		IsDefault:   req.IsDefault,
		UserID:      userID,
	}
	
	if inventory.Type == "" {
		inventory.Type = "static"
	}
	
	if err := s.db.Create(inventory).Error; err != nil {
		return nil, err
	}
	
	return inventory, nil
}

// UpdateInventory 更新inventory
func (s *AnsibleService) UpdateInventory(id uint, userID uint, req *InventoryRequest) (*Inventory, error) {
	var inventory Inventory
	if err := s.db.Where("id = ? AND user_id = ?", id, userID).First(&inventory).Error; err != nil {
		return nil, err
	}
	
	// 如果设置为默认，需要先取消其他默认inventory
	if req.IsDefault {
		s.db.Model(&Inventory{}).Where("user_id = ? AND is_default = ? AND id != ?", userID, true, id).Update("is_default", false)
	}
	
	inventory.Name = req.Name
	inventory.Description = req.Description
	inventory.Type = req.Type
	inventory.Content = req.Content
	inventory.IsDefault = req.IsDefault
	
	if inventory.Type == "" {
		inventory.Type = "static"
	}
	
	if err := s.db.Save(&inventory).Error; err != nil {
		return nil, err
	}
	
	return &inventory, nil
}

// DeleteInventory 删除inventory
func (s *AnsibleService) DeleteInventory(id uint, userID uint) error {
	result := s.db.Where("id = ? AND user_id = ?", id, userID).Delete(&Inventory{})
	if result.Error != nil {
		return result.Error
	}
	
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	
	return nil
}

// GetInventory 获取inventory
func (s *AnsibleService) GetInventory(id uint) (*Inventory, error) {
	var inventory Inventory
	err := s.db.First(&inventory, id).Error
	if err != nil {
		return nil, err
	}
	return &inventory, nil
}

// ListInventories 列出inventory
func (s *AnsibleService) ListInventories(userID uint, offset, limit int) ([]Inventory, int64, error) {
	var inventories []Inventory
	var total int64
	
	query := s.db.Model(&Inventory{}).Where("user_id = ?", userID)
	
	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// 获取分页数据
	err := query.Order("is_default DESC, created_at DESC").Offset(offset).Limit(limit).Find(&inventories).Error
	if err != nil {
		return nil, 0, err
	}
	
	return inventories, total, nil
}

// GetDefaultInventory 获取默认inventory
func (s *AnsibleService) GetDefaultInventory(userID uint) (*Inventory, error) {
	var inventory Inventory
	err := s.db.Where("user_id = ? AND is_default = ?", userID, true).First(&inventory).Error
	if err != nil {
		return nil, err
	}
	return &inventory, nil
}

// CreatePlaybook 创建playbook
func (s *AnsibleService) CreatePlaybook(userID uint, req *PlaybookRequest) (*Playbook, error) {
	playbook := &Playbook{
		Name:        req.Name,
		Description: req.Description,
		FileName:    req.FileName,
		Content:     req.Content,
		Tags:        req.Tags,
		UserID:      userID,
	}
	
	if err := s.db.Create(playbook).Error; err != nil {
		return nil, err
	}
	
	return playbook, nil
}

// UpdatePlaybook 更新playbook
func (s *AnsibleService) UpdatePlaybook(id uint, userID uint, req *PlaybookRequest) (*Playbook, error) {
	var playbook Playbook
	if err := s.db.Where("id = ? AND user_id = ?", id, userID).First(&playbook).Error; err != nil {
		return nil, err
	}
	
	playbook.Name = req.Name
	playbook.Description = req.Description
	playbook.FileName = req.FileName
	playbook.Content = req.Content
	playbook.Tags = req.Tags
	
	if err := s.db.Save(&playbook).Error; err != nil {
		return nil, err
	}
	
	return &playbook, nil
}

// DeletePlaybook 删除playbook
func (s *AnsibleService) DeletePlaybook(id uint, userID uint) error {
	result := s.db.Where("id = ? AND user_id = ?", id, userID).Delete(&Playbook{})
	if result.Error != nil {
		return result.Error
	}
	
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	
	return nil
}

// GetPlaybook 获取playbook
func (s *AnsibleService) GetPlaybook(id uint) (*Playbook, error) {
	var playbook Playbook
	err := s.db.First(&playbook, id).Error
	if err != nil {
		return nil, err
	}
	return &playbook, nil
}

// ListPlaybooks 列出playbook
func (s *AnsibleService) ListPlaybooks(userID uint, offset, limit int) ([]Playbook, int64, error) {
	var playbooks []Playbook
	var total int64
	
	query := s.db.Model(&Playbook{}).Where("user_id = ?", userID)
	
	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// 获取分页数据
	err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&playbooks).Error
	if err != nil {
		return nil, 0, err
	}
	
	return playbooks, total, nil
}

// GetExecutionStats 获取执行统计信息
func (s *AnsibleService) GetExecutionStats(userID uint) (*ExecutionStats, error) {
	var stats ExecutionStats
	
	// 获取总执行数
	s.db.Model(&AdhocExecution{}).Where("user_id = ?", userID).Count(&stats.TotalExecutions)
	
	// 获取成功执行数
	s.db.Model(&AdhocExecution{}).Where("user_id = ? AND status = ?", userID, "success").Count(&stats.SuccessfulExecutions)
	
	// 获取失败执行数
	s.db.Model(&AdhocExecution{}).Where("user_id = ? AND status = ?", userID, "failed").Count(&stats.FailedExecutions)
	
	// 获取运行中执行数
	s.db.Model(&AdhocExecution{}).Where("user_id = ? AND status = ?", userID, "running").Count(&stats.RunningExecutions)
	
	return &stats, nil
}

// CheckAnsibleInstallation 检查ansible安装
func (s *AnsibleService) CheckAnsibleInstallation() error {
	return s.executor.CheckAnsibleInstallation()
}