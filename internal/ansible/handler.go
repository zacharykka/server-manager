package ansible

import (
	"net/http"
	"strconv"
	"strings"
	
	"github.com/gin-gonic/gin"
	"server-manager/internal/common"
)

// Handler ansible API处理器
type Handler struct {
	service Service
}

// NewHandler 创建新的处理器
func NewHandler(service Service) *Handler {
	return &Handler{
		service: service,
	}
}

// RegisterRoutes 注册路由
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	// Adhoc命令相关路由
	adhoc := r.Group("/ansible/adhoc")
	{
		adhoc.POST("/execute", h.ExecuteAdhoc)
		adhoc.GET("/executions", h.ListAdhocExecutions)
		adhoc.GET("/executions/:id", h.GetAdhocExecution)
	}
	
	// Inventory管理路由
	inventory := r.Group("/ansible/inventories")
	{
		inventory.POST("", h.CreateInventory)
		inventory.GET("", h.ListInventories)
		inventory.GET("/:id", h.GetInventory)
		inventory.PUT("/:id", h.UpdateInventory)
		inventory.DELETE("/:id", h.DeleteInventory)
		inventory.GET("/default", h.GetDefaultInventory)
	}
	
	// Playbook管理路由
	playbook := r.Group("/ansible/playbooks")
	{
		playbook.POST("", h.CreatePlaybook)
		playbook.GET("", h.ListPlaybooks)
		playbook.GET("/:id", h.GetPlaybook)
		playbook.PUT("/:id", h.UpdatePlaybook)
		playbook.DELETE("/:id", h.DeletePlaybook)
	}
	
	// 统计和系统信息路由
	system := r.Group("/ansible/system")
	{
		system.GET("/stats", h.GetExecutionStats)
		system.GET("/check", h.CheckAnsible)
		system.GET("/modules", h.GetCommonModules)
	}
}

// ExecuteAdhoc 执行adhoc命令
func (h *Handler) ExecuteAdhoc(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	var req AdhocExecutionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request parameters"))
		return
	}
	
	execution, err := h.service.ExecuteAdhocCommand(c.Request.Context(), userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Execute adhoc command failed"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Adhoc command executed successfully", execution))
}

// ListAdhocExecutions 列出adhoc执行记录
func (h *Handler) ListAdhocExecutions(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	
	offset := (page - 1) * pageSize
	
	executions, total, err := h.service.ListAdhocExecutions(userID, offset, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Get executions failed"))
		return
	}
	
	response := map[string]interface{}{
		"data":       executions,
		"total":      total,
		"page":       page,
		"page_size":  pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Executions retrieved successfully", response))
}

// GetAdhocExecution 获取adhoc执行记录详情
func (h *Handler) GetAdhocExecution(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid execution ID"))
		return
	}
	
	execution, err := h.service.GetAdhocExecution(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, common.ErrorResponse("Execution not found"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Execution retrieved successfully", execution))
}

// CreateInventory 创建inventory
func (h *Handler) CreateInventory(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	var req InventoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request parameters"))
		return
	}
	
	inventory, err := h.service.CreateInventory(userID, &req)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			c.JSON(http.StatusConflict, common.ErrorResponse("Inventory name already exists"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Create inventory failed"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Inventory created successfully", inventory))
}

// ListInventories 列出inventory
func (h *Handler) ListInventories(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	
	offset := (page - 1) * pageSize
	
	inventories, total, err := h.service.ListInventories(userID, offset, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Get inventories failed"))
		return
	}
	
	response := map[string]interface{}{
		"data":       inventories,
		"total":      total,
		"page":       page,
		"page_size":  pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Inventories retrieved successfully", response))
}

// GetInventory 获取inventory详情
func (h *Handler) GetInventory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid inventory ID"))
		return
	}
	
	inventory, err := h.service.GetInventory(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, common.ErrorResponse("Inventory not found"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Inventory retrieved successfully", inventory))
}

// UpdateInventory 更新inventory
func (h *Handler) UpdateInventory(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid inventory ID"))
		return
	}
	
	var req InventoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request parameters"))
		return
	}
	
	inventory, err := h.service.UpdateInventory(uint(id), userID, &req)
	if err != nil {
		if strings.Contains(err.Error(), "record not found") {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Inventory not found"))
			return
		}
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			c.JSON(http.StatusConflict, common.ErrorResponse("Inventory name already exists"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Update inventory failed"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Inventory updated successfully", inventory))
}

// DeleteInventory 删除inventory
func (h *Handler) DeleteInventory(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid inventory ID"))
		return
	}
	
	err = h.service.DeleteInventory(uint(id), userID)
	if err != nil {
		if strings.Contains(err.Error(), "record not found") {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Inventory not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Delete inventory failed"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Inventory deleted successfully", map[string]string{"message": "Inventory deleted successfully"}))
}

// GetDefaultInventory 获取默认inventory
func (h *Handler) GetDefaultInventory(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	inventory, err := h.service.GetDefaultInventory(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, common.ErrorResponse("Default inventory not found"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Default inventory retrieved successfully", inventory))
}

// CreatePlaybook 创建playbook
func (h *Handler) CreatePlaybook(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	var req PlaybookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request parameters"))
		return
	}
	
	playbook, err := h.service.CreatePlaybook(userID, &req)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			c.JSON(http.StatusConflict, common.ErrorResponse("Playbook name already exists"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Create playbook failed"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Playbook created successfully", playbook))
}

// ListPlaybooks 列出playbook
func (h *Handler) ListPlaybooks(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	// 解析分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	
	offset := (page - 1) * pageSize
	
	playbooks, total, err := h.service.ListPlaybooks(userID, offset, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Get playbooks failed"))
		return
	}
	
	response := map[string]interface{}{
		"data":       playbooks,
		"total":      total,
		"page":       page,
		"page_size":  pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Playbooks retrieved successfully", response))
}

// GetPlaybook 获取playbook详情
func (h *Handler) GetPlaybook(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid playbook ID"))
		return
	}
	
	playbook, err := h.service.GetPlaybook(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, common.ErrorResponse("Playbook not found"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Playbook retrieved successfully", playbook))
}

// UpdatePlaybook 更新playbook
func (h *Handler) UpdatePlaybook(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid playbook ID"))
		return
	}
	
	var req PlaybookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid request parameters"))
		return
	}
	
	playbook, err := h.service.UpdatePlaybook(uint(id), userID, &req)
	if err != nil {
		if strings.Contains(err.Error(), "record not found") {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Playbook not found"))
			return
		}
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			c.JSON(http.StatusConflict, common.ErrorResponse("Playbook name already exists"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Update playbook failed"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Playbook updated successfully", playbook))
}

// DeletePlaybook 删除playbook
func (h *Handler) DeletePlaybook(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, common.ErrorResponse("Invalid playbook ID"))
		return
	}
	
	err = h.service.DeletePlaybook(uint(id), userID)
	if err != nil {
		if strings.Contains(err.Error(), "record not found") {
			c.JSON(http.StatusNotFound, common.ErrorResponse("Playbook not found"))
			return
		}
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Delete playbook failed"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Playbook deleted successfully", map[string]string{"message": "Playbook deleted successfully"}))
}

// GetExecutionStats 获取执行统计信息
func (h *Handler) GetExecutionStats(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	stats, err := h.service.GetExecutionStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.ErrorResponse("Get execution stats failed"))
		return
	}
	
	c.JSON(http.StatusOK, common.SuccessResponse("Execution stats retrieved successfully", stats))
}

// CheckAnsible 检查ansible安装状态
func (h *Handler) CheckAnsible(c *gin.Context) {
	err := h.service.CheckAnsibleInstallation()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, common.ErrorResponse("Ansible not available"))
		return
	}
	
	response := map[string]interface{}{
		"ansible_available": true,
		"message": "Ansible is installed and available",
	}
	c.JSON(http.StatusOK, common.SuccessResponse("Ansible status checked successfully", response))
}

// GetCommonModules 获取常用模块列表
func (h *Handler) GetCommonModules(c *gin.Context) {
	modules := GetCommonModules()
	c.JSON(http.StatusOK, common.SuccessResponse("Common modules retrieved successfully", modules))
}