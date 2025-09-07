package server_manager

import (
	"net/http"
	"strconv"

	"server-manager/internal/common"

	"github.com/gin-gonic/gin"
)

// Handler 服务器管理处理器
type Handler struct {
	service    *Service
	sshService *SSHService
}

// NewHandler 创建服务器管理处理器
func NewHandler(service *Service, sshService *SSHService) *Handler {
	return &Handler{
		service:    service,
		sshService: sshService,
	}
}

// 服务器相关接口

// CreateServer 创建服务器
func (h *Handler) CreateServer(c *gin.Context) {
	var req CreateServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	server, err := h.service.CreateServer(&req)
	if err != nil {
		if err == ErrServerExists {
			c.JSON(http.StatusConflict, common.ErrorResponse("Server name already exists"))
			return
		}
		if err == ErrServerGroupNotFound {
			c.JSON(http.StatusBadRequest, common.ErrorResponse("Server group not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to create server"))
		return
	}

	c.JSON(http.StatusCreated, common.SuccessResponse("Server created successfully", server.ToResponse()))
}

// GetServer 获取单个服务器
func (h *Handler) GetServer(c *gin.Context) {
	serverID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid server ID"))
		return
	}

	server, err := h.service.GetServerByID(uint(serverID))
	if err != nil {
		if err == ErrServerNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Server not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to get server"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Server retrieved successfully", server.ToResponse()))
}

// UpdateServer 更新服务器
func (h *Handler) UpdateServer(c *gin.Context) {
	serverID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid server ID"))
		return
	}

	var req UpdateServerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	server, err := h.service.UpdateServer(uint(serverID), &req)
	if err != nil {
		if err == ErrServerNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Server not found"))
			return
		}
		if err == ErrServerExists {
			c.JSON(http.StatusConflict, common.ErrorResponse("Server name already exists"))
			return
		}
		if err == ErrServerGroupNotFound {
			c.JSON(http.StatusBadRequest, common.ErrorResponse("Server group not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to update server"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Server updated successfully", server.ToResponse()))
}

// DeleteServer 删除服务器
func (h *Handler) DeleteServer(c *gin.Context) {
	serverID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid server ID"))
		return
	}

	if err := h.service.DeleteServer(uint(serverID)); err != nil {
		if err == ErrServerNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Server not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to delete server"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Server deleted successfully", nil))
}

// ListServers 获取服务器列表
func (h *Handler) ListServers(c *gin.Context) {
	// 解析查询参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")
	groupIDStr := c.Query("group_id")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit
	var servers []*Server
	var total int64
	var err error

	// 解析groupID
	var groupID *uint
	if groupIDStr != "" {
		if gid, err := strconv.ParseUint(groupIDStr, 10, 32); err == nil {
			groupIDValue := uint(gid)
			groupID = &groupIDValue
		}
	}

	// 执行搜索或列表查询
	if search != "" {
		servers, total, err = h.service.SearchServers(search, offset, limit)
	} else {
		servers, total, err = h.service.ListServers(groupID, offset, limit)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to get servers"))
		return
	}

	// 转换为响应格式
	serverResponses := make([]*ServerResponse, len(servers))
	for i, server := range servers {
		serverResponses[i] = server.ToResponse()
	}

	response := map[string]interface{}{
		"servers": serverResponses,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Servers retrieved successfully", response))
}

// TestServerConnection 测试服务器连接
func (h *Handler) TestServerConnection(c *gin.Context) {
	serverID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid server ID"))
		return
	}

	server, err := h.service.GetServerByID(uint(serverID))
	if err != nil {
		if err == ErrServerNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Server not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to get server"))
		return
	}

	// 执行连接测试
	result := h.sshService.TestConnectionWithServer(server)

	// 更新服务器状态
	if result.Success {
		h.service.UpdateServerStatus(server.ID, "online")
	} else {
		h.service.UpdateServerStatus(server.ID, "offline")
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Connection test completed", result))
}

// TestSSHConnection 测试SSH连接（不保存服务器）
func (h *Handler) TestSSHConnection(c *gin.Context) {
	var req SSHTestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	result := h.sshService.TestConnection(&req)
	c.JSON(http.StatusOK, common.SuccessResponse("Connection test completed", result))
}

// 服务器组相关接口

// CreateServerGroup 创建服务器组
func (h *Handler) CreateServerGroup(c *gin.Context) {
	var req CreateServerGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	group, err := h.service.CreateServerGroup(&req)
	if err != nil {
		if err == ErrServerGroupExists {
			c.JSON(http.StatusConflict, common.ErrorResponse("Server group name already exists"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to create server group"))
		return
	}

	c.JSON(http.StatusCreated, common.SuccessResponse("Server group created successfully", group.ToResponse()))
}

// GetServerGroup 获取服务器组
func (h *Handler) GetServerGroup(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid group ID"))
		return
	}

	group, err := h.service.GetServerGroupByID(uint(groupID))
	if err != nil {
		if err == ErrServerGroupNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Server group not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to get server group"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Server group retrieved successfully", group.ToResponse()))
}

// UpdateServerGroup 更新服务器组
func (h *Handler) UpdateServerGroup(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid group ID"))
		return
	}

	var req UpdateServerGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request: "+err.Error()))
		return
	}

	group, err := h.service.UpdateServerGroup(uint(groupID), &req)
	if err != nil {
		if err == ErrServerGroupNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Server group not found"))
			return
		}
		if err == ErrServerGroupExists {
			c.JSON(http.StatusConflict, common.ErrorResponse("Server group name already exists"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to update server group"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Server group updated successfully", group.ToResponse()))
}

// DeleteServerGroup 删除服务器组
func (h *Handler) DeleteServerGroup(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid group ID"))
		return
	}

	if err := h.service.DeleteServerGroup(uint(groupID)); err != nil {
		if err == ErrServerGroupNotFound {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Server group not found"))
			return
		}
		c.JSON(http.StatusBadRequest, common.ErrorResponse(err.Error()))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Server group deleted successfully", nil))
}

// ListServerGroups 获取服务器组列表
func (h *Handler) ListServerGroups(c *gin.Context) {
	groups, err := h.service.ListServerGroups()
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to get server groups"))
		return
	}

	// 转换为响应格式
	groupResponses := make([]*ServerGroupResponse, len(groups))
	for i, group := range groups {
		groupResponses[i] = group.ToResponse()
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Server groups retrieved successfully", groupResponses))
}

// GetServerStats 获取服务器统计信息
func (h *Handler) GetServerStats(c *gin.Context) {
	stats, err := h.service.GetServerStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Failed to get server statistics"))
		return
	}

	c.JSON(http.StatusOK, common.SuccessResponse("Server statistics retrieved successfully", stats))
}