package server_manager

import (
	"time"
)

// Server 服务器模型
type Server struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null;uniqueIndex" json:"name" binding:"required"`
	Host        string    `gorm:"size:255;not null" json:"host" binding:"required"`
	Port        int       `gorm:"not null;default:22" json:"port"`
	Username    string    `gorm:"size:100;not null" json:"username" binding:"required"`
	Password    string    `gorm:"size:255" json:"password,omitempty"` // 可选，如果使用密钥认证
	PrivateKey  string    `gorm:"type:text" json:"private_key,omitempty"` // SSH私钥
	Description string    `gorm:"size:500" json:"description"`
	OS          string    `gorm:"size:50" json:"os"` // 操作系统类型
	Status      string    `gorm:"size:20;default:unknown" json:"status"` // online, offline, unknown
	GroupID     *uint     `json:"group_id"` // 关联服务器组
	Group       *ServerGroup `gorm:"foreignKey:GroupID" json:"group,omitempty"`
	Tags        string    `gorm:"size:500" json:"tags"` // 标签，逗号分隔
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

// ServerGroup 服务器组模型
type ServerGroup struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null;uniqueIndex" json:"name" binding:"required"`
	Description string    `gorm:"size:500" json:"description"`
	Color       string    `gorm:"size:7;default:#3b82f6" json:"color"` // 组颜色
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index" json:"deleted_at,omitempty"`
	
	// 关联的服务器
	Servers []Server `gorm:"foreignKey:GroupID" json:"servers,omitempty"`
}

// CreateServerRequest 创建服务器请求
type CreateServerRequest struct {
	Name        string `json:"name" binding:"required"`
	Host        string `json:"host" binding:"required"`
	Port        int    `json:"port" binding:"min=1,max=65535"`
	Username    string `json:"username" binding:"required"`
	Password    string `json:"password"`
	PrivateKey  string `json:"private_key"`
	Description string `json:"description"`
	OS          string `json:"os"`
	GroupID     *uint  `json:"group_id"`
	Tags        string `json:"tags"`
}

// UpdateServerRequest 更新服务器请求
type UpdateServerRequest struct {
	Name        string `json:"name"`
	Host        string `json:"host"`
	Port        *int   `json:"port" binding:"omitempty,min=1,max=65535"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	PrivateKey  string `json:"private_key"`
	Description string `json:"description"`
	OS          string `json:"os"`
	GroupID     *uint  `json:"group_id"`
	Tags        string `json:"tags"`
}

// ServerResponse 服务器响应
type ServerResponse struct {
	ID          uint                 `json:"id"`
	Name        string               `json:"name"`
	Host        string               `json:"host"`
	Port        int                  `json:"port"`
	Username    string               `json:"username"`
	Description string               `json:"description"`
	OS          string               `json:"os"`
	Status      string               `json:"status"`
	GroupID     *uint                `json:"group_id"`
	Group       *ServerGroupResponse `json:"group,omitempty"`
	Tags        string               `json:"tags"`
	CreatedAt   time.Time            `json:"created_at"`
	UpdatedAt   time.Time            `json:"updated_at"`
}

// CreateServerGroupRequest 创建服务器组请求
type CreateServerGroupRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

// UpdateServerGroupRequest 更新服务器组请求
type UpdateServerGroupRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

// ServerGroupResponse 服务器组响应
type ServerGroupResponse struct {
	ID          uint             `json:"id"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
	Color       string           `json:"color"`
	ServerCount int              `json:"server_count,omitempty"`
	Servers     []ServerResponse `json:"servers,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
}

// SSHTestRequest SSH连接测试请求
type SSHTestRequest struct {
	Host       string `json:"host" binding:"required"`
	Port       int    `json:"port" binding:"required,min=1,max=65535"`
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password"`
	PrivateKey string `json:"private_key"`
}

// SSHTestResponse SSH连接测试响应
type SSHTestResponse struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	OSInfo    string `json:"os_info,omitempty"`    // 检测到的操作系统信息
	Uptime    string `json:"uptime,omitempty"`     // 系统运行时间
	LatencyMs int64  `json:"latency_ms,omitempty"` // 连接延迟
}

// ToResponse 转换为响应格式
func (s *Server) ToResponse() *ServerResponse {
	resp := &ServerResponse{
		ID:          s.ID,
		Name:        s.Name,
		Host:        s.Host,
		Port:        s.Port,
		Username:    s.Username,
		Description: s.Description,
		OS:          s.OS,
		Status:      s.Status,
		GroupID:     s.GroupID,
		Tags:        s.Tags,
		CreatedAt:   s.CreatedAt,
		UpdatedAt:   s.UpdatedAt,
	}
	
	if s.Group != nil {
		resp.Group = s.Group.ToResponse()
	}
	
	return resp
}

// ToResponse 转换为响应格式
func (sg *ServerGroup) ToResponse() *ServerGroupResponse {
	resp := &ServerGroupResponse{
		ID:          sg.ID,
		Name:        sg.Name,
		Description: sg.Description,
		Color:       sg.Color,
		CreatedAt:   sg.CreatedAt,
		UpdatedAt:   sg.UpdatedAt,
	}
	
	if sg.Servers != nil {
		resp.ServerCount = len(sg.Servers)
		servers := make([]ServerResponse, 0, len(sg.Servers))
		for _, server := range sg.Servers {
			servers = append(servers, *server.ToResponse())
		}
		resp.Servers = servers
	}
	
	return resp
}