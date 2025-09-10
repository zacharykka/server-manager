package ansible

import (
	"time"
)

// AdhocExecution 表示adhoc命令执行记录
type AdhocExecution struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Command     string    `json:"command" gorm:"not null"`                    // 执行的命令
	Module      string    `json:"module" gorm:"not null"`                     // ansible模块名称 (shell, command, copy等)
	Args        string    `json:"args"`                                       // 模块参数
	Inventory   string    `json:"inventory" gorm:"type:text"`                 // inventory内容 (可以是主机列表或文件路径)
	Hosts       string    `json:"hosts" gorm:"not null"`                      // 目标主机或组
	ExtraVars   string    `json:"extra_vars" gorm:"type:text"`                // 额外变量JSON格式
	Status      string    `json:"status" gorm:"default:'pending'"`            // pending, running, success, failed
	Output      string    `json:"output" gorm:"type:text"`                    // 命令输出
	ErrorOutput string    `json:"error_output" gorm:"type:text"`              // 错误输出
	ExitCode    int       `json:"exit_code" gorm:"default:0"`                 // 退出码
	StartTime   *time.Time `json:"start_time"`                                // 开始时间
	EndTime     *time.Time `json:"end_time"`                                  // 结束时间
	Duration    int       `json:"duration"`                                   // 执行时长(秒)
	UserID      uint      `json:"user_id" gorm:"not null"`                    // 执行用户ID
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// PlaybookExecution 表示playbook执行记录
type PlaybookExecution struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`                       // playbook名称
	PlaybookPath string   `json:"playbook_path" gorm:"not null"`              // playbook文件路径
	Inventory   string    `json:"inventory" gorm:"type:text"`                 // inventory内容
	ExtraVars   string    `json:"extra_vars" gorm:"type:text"`                // 额外变量JSON格式
	Tags        string    `json:"tags"`                                       // 标签
	SkipTags    string    `json:"skip_tags"`                                  // 跳过的标签
	Status      string    `json:"status" gorm:"default:'pending'"`            // pending, running, success, failed
	Output      string    `json:"output" gorm:"type:text"`                    // 命令输出
	ErrorOutput string    `json:"error_output" gorm:"type:text"`              // 错误输出
	ExitCode    int       `json:"exit_code" gorm:"default:0"`                 // 退出码
	StartTime   *time.Time `json:"start_time"`                                // 开始时间
	EndTime     *time.Time `json:"end_time"`                                  // 结束时间
	Duration    int       `json:"duration"`                                   // 执行时长(秒)
	UserID      uint      `json:"user_id" gorm:"not null"`                    // 执行用户ID
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Inventory 表示inventory管理
type Inventory struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null;uniqueIndex"`           // inventory名称
	Description string    `json:"description"`                                // 描述
	Type        string    `json:"type" gorm:"not null;default:'static'"`      // static, dynamic
	Content     string    `json:"content" gorm:"type:text"`                   // inventory内容
	IsDefault   bool      `json:"is_default" gorm:"default:false"`            // 是否为默认inventory
	UserID      uint      `json:"user_id" gorm:"not null"`                    // 创建用户ID
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Playbook 表示playbook管理
type Playbook struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null;uniqueIndex"`           // playbook名称
	Description string    `json:"description"`                                // 描述
	FileName    string    `json:"file_name" gorm:"not null"`                  // 文件名
	Content     string    `json:"content" gorm:"type:text"`                   // playbook内容(YAML)
	Tags        string    `json:"tags"`                                       // 标签，逗号分隔
	UserID      uint      `json:"user_id" gorm:"not null"`                    // 创建用户ID
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// AdhocExecutionRequest 表示adhoc命令执行请求
type AdhocExecutionRequest struct {
	Module    string            `json:"module" binding:"required"`              // ansible模块名称
	Args      string            `json:"args"`                                   // 模块参数
	Hosts     string            `json:"hosts" binding:"required"`               // 目标主机或组
	Inventory string            `json:"inventory"`                              // inventory内容或ID
	ExtraVars map[string]interface{} `json:"extra_vars"`                       // 额外变量
}

// PlaybookExecutionRequest 表示playbook执行请求
type PlaybookExecutionRequest struct {
	PlaybookID uint              `json:"playbook_id" binding:"required"`        // playbook ID
	Inventory  string            `json:"inventory"`                              // inventory内容或ID
	ExtraVars  map[string]interface{} `json:"extra_vars"`                       // 额外变量
	Tags       string            `json:"tags"`                                   // 标签
	SkipTags   string            `json:"skip_tags"`                              // 跳过的标签
}

// InventoryRequest 表示inventory创建/更新请求
type InventoryRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Content     string `json:"content" binding:"required"`
	IsDefault   bool   `json:"is_default"`
}

// PlaybookRequest 表示playbook创建/更新请求
type PlaybookRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	FileName    string `json:"file_name" binding:"required"`
	Content     string `json:"content" binding:"required"`
	Tags        string `json:"tags"`
}

// ExecutionStats 表示执行统计信息
type ExecutionStats struct {
	TotalExecutions     int64 `json:"total_executions"`
	SuccessfulExecutions int64 `json:"successful_executions"`
	FailedExecutions    int64 `json:"failed_executions"`
	RunningExecutions   int64 `json:"running_executions"`
}