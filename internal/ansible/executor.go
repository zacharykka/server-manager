package ansible

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
	"server-manager/internal/config"
)

// CommandExecutor 定义命令执行接口
type CommandExecutor interface {
	ExecuteAdhoc(ctx context.Context, req *AdhocExecutionRequest) (*ExecutionResult, error)
	ExecutePlaybook(ctx context.Context, req *PlaybookExecutionRequest) (*ExecutionResult, error)
	CheckAnsibleInstallation() error
}

// ExecutionResult 表示命令执行结果
type ExecutionResult struct {
	Success     bool   `json:"success"`
	Output      string `json:"output"`
	ErrorOutput string `json:"error_output"`
	ExitCode    int    `json:"exit_code"`
	Duration    int    `json:"duration"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
}

// DefaultCommandExecutor 默认命令执行器
type DefaultCommandExecutor struct {
	workDir        string
	tempDir        string
	ansiblePath    string
	outputCallback func(string) // 实时输出回调函数
}

// NewCommandExecutor 创建新的命令执行器
func NewCommandExecutor(workDir string) *DefaultCommandExecutor {
	tempDir := filepath.Join(workDir, "temp", "ansible")
	// 确保临时目录存在
	os.MkdirAll(tempDir, 0755)
	
	// 智能探测ansible路径
	ansiblePath := detectAnsiblePath("")
	
	return &DefaultCommandExecutor{
		workDir:     workDir,
		tempDir:     tempDir,
		ansiblePath: ansiblePath,
	}
}

// NewCommandExecutorWithConfig 使用配置创建命令执行器
func NewCommandExecutorWithConfig(cfg *config.Config) *DefaultCommandExecutor {
	workDir := cfg.Ansible.WorkDir
	if workDir == "" {
		workDir = "./"
	}
	
	tempDir := cfg.Ansible.TempDir
	if tempDir == "" {
		tempDir = filepath.Join(workDir, "temp", "ansible")
	}
	
	// 确保临时目录存在
	os.MkdirAll(tempDir, 0755)
	
	// 使用配置中的路径或智能探测
	ansiblePath := detectAnsiblePath(cfg.Ansible.Path)
	
	return &DefaultCommandExecutor{
		workDir:     workDir,
		tempDir:     tempDir,
		ansiblePath: ansiblePath,
	}
}

// detectAnsiblePath 智能探测ansible命令路径
func detectAnsiblePath(configPath string) string {
	// 1. 优先使用配置文件中的路径
	if configPath != "" {
		if _, err := os.Stat(configPath); err == nil {
			return configPath
		}
	}
	
	// 2. 检查环境变量
	if envPath := os.Getenv("ANSIBLE_PATH"); envPath != "" {
		if _, err := os.Stat(envPath); err == nil {
			return envPath
		}
	}
	
	// 3. 尝试使用which命令查找ansible
	if path, err := exec.LookPath("ansible"); err == nil {
		return path
	}
	
	// 4. 检查常见安装路径
	commonPaths := []string{
		"/usr/local/bin/ansible",      // 常规Linux安装
		"/opt/homebrew/bin/ansible",   // macOS Homebrew (Apple Silicon)
		"/usr/local/homebrew/bin/ansible", // macOS Homebrew (Intel)
		"/usr/bin/ansible",            // 系统包管理器安装
		"/bin/ansible",                // 系统路径
	}
	
	for _, path := range commonPaths {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	
	// 5. 最后回退到PATH中的ansible
	return "ansible"
}

// SetOutputCallback 设置实时输出回调函数
func (e *DefaultCommandExecutor) SetOutputCallback(callback func(string)) {
	e.outputCallback = callback
}

// CheckAnsibleInstallation 检查ansible是否已安装
func (e *DefaultCommandExecutor) CheckAnsibleInstallation() error {
	cmd := exec.Command(e.ansiblePath, "--version")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ansible not installed or not in PATH: %v\nOutput: %s", err, string(output))
	}
	return nil
}

// ExecuteAdhoc 执行adhoc命令
func (e *DefaultCommandExecutor) ExecuteAdhoc(ctx context.Context, req *AdhocExecutionRequest) (*ExecutionResult, error) {
	startTime := time.Now()
	
	// 构建ansible命令
	args := []string{
		req.Hosts,
		"-m", req.Module,
	}
	
	// 添加模块参数
	if req.Args != "" {
		args = append(args, "-a", req.Args)
	}
	
	// 处理inventory
	inventoryFile, err := e.prepareInventory(req.Inventory)
	if err != nil {
		return nil, fmt.Errorf("prepare inventory failed: %v", err)
	}
	defer os.Remove(inventoryFile) // 清理临时文件
	
	args = append(args, "-i", inventoryFile)
	
	// 处理额外变量
	if req.ExtraVars != nil && len(req.ExtraVars) > 0 {
		extraVarsFile, err := e.prepareExtraVars(req.ExtraVars)
		if err != nil {
			return nil, fmt.Errorf("prepare extra vars failed: %v", err)
		}
		defer os.Remove(extraVarsFile)
		args = append(args, "-e", "@"+extraVarsFile)
	}
	
	// 添加输出格式参数
	args = append(args, "-v") // 详细输出
	
	// 执行命令
	result, err := e.executeCommand(ctx, e.ansiblePath, args, startTime)
	if err != nil {
		return nil, err
	}
	
	return result, nil
}

// ExecutePlaybook 执行playbook
func (e *DefaultCommandExecutor) ExecutePlaybook(ctx context.Context, req *PlaybookExecutionRequest) (*ExecutionResult, error) {
	// 这里需要根据playbook ID获取playbook内容
	// 暂时返回未实现错误，等待后续实现
	return nil, fmt.Errorf("playbook execution not implemented yet")
}

// prepareInventory 准备inventory文件
func (e *DefaultCommandExecutor) prepareInventory(inventory string) (string, error) {
	if inventory == "" {
		inventory = "localhost ansible_connection=local"
	}
	
	// 创建临时inventory文件
	tempFile := filepath.Join(e.tempDir, fmt.Sprintf("inventory_%d", time.Now().UnixNano()))
	
	err := os.WriteFile(tempFile, []byte(inventory), 0644)
	if err != nil {
		return "", fmt.Errorf("write inventory file failed: %v", err)
	}
	
	return tempFile, nil
}

// prepareExtraVars 准备额外变量文件
func (e *DefaultCommandExecutor) prepareExtraVars(extraVars map[string]interface{}) (string, error) {
	// 将额外变量转换为JSON
	varsJSON, err := json.Marshal(extraVars)
	if err != nil {
		return "", fmt.Errorf("marshal extra vars failed: %v", err)
	}
	
	// 创建临时变量文件
	tempFile := filepath.Join(e.tempDir, fmt.Sprintf("extravars_%d.json", time.Now().UnixNano()))
	
	err = os.WriteFile(tempFile, varsJSON, 0644)
	if err != nil {
		return "", fmt.Errorf("write extra vars file failed: %v", err)
	}
	
	return tempFile, nil
}

// executeCommand 执行命令并收集输出
func (e *DefaultCommandExecutor) executeCommand(ctx context.Context, command string, args []string, startTime time.Time) (*ExecutionResult, error) {
	// 创建一个新的上下文，设置30秒超时
	cmdCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	cmd := exec.CommandContext(cmdCtx, command, args...)
	
	// 创建管道来收集输出
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("create stdout pipe failed: %v", err)
	}
	
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("create stderr pipe failed: %v", err)
	}
	
	// 启动命令
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("start command failed: %v", err)
	}
	
	// 收集输出
	var outputLines []string
	var errorLines []string
	
	// 创建goroutine来读取输出
	outputDone := make(chan bool)
	errorDone := make(chan bool)
	
	go e.readOutput(stdout, &outputLines, outputDone)
	go e.readOutput(stderr, &errorLines, errorDone)
	
	// 等待命令执行完成
	err = cmd.Wait()
	
	// 等待输出读取完成
	<-outputDone
	<-errorDone
	
	endTime := time.Now()
	duration := int(endTime.Sub(startTime).Seconds())
	
	// 构建结果
	result := &ExecutionResult{
		Success:     err == nil,
		Output:      strings.Join(outputLines, "\n"),
		ErrorOutput: strings.Join(errorLines, "\n"),
		ExitCode:    cmd.ProcessState.ExitCode(),
		Duration:    duration,
		StartTime:   startTime,
		EndTime:     endTime,
	}
	
	return result, nil
}

// readOutput 读取命令输出
func (e *DefaultCommandExecutor) readOutput(reader io.Reader, lines *[]string, done chan bool) {
	defer close(done)
	
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		line := scanner.Text()
		*lines = append(*lines, line)
		
		// 如果设置了回调函数，实时输出
		if e.outputCallback != nil {
			e.outputCallback(line)
		}
	}
}

// ValidateAdhocRequest 验证adhoc请求参数
func ValidateAdhocRequest(req *AdhocExecutionRequest) error {
	if req.Module == "" {
		return fmt.Errorf("module is required")
	}
	
	if req.Hosts == "" {
		return fmt.Errorf("hosts is required")
	}
	
	// 验证模块名称是否有效
	validModules := map[string]bool{
		"shell":    true,
		"command":  true,
		"copy":     true,
		"file":     true,
		"service":  true,
		"package":  true,
		"yum":      true,
		"apt":      true,
		"ping":     true,
		"setup":    true,
		"debug":    true,
		"template": true,
		"lineinfile": true,
		"replace":  true,
		"user":     true,
		"group":    true,
		"cron":     true,
		"mount":    true,
		"git":      true,
	}
	
	if !validModules[req.Module] {
		return fmt.Errorf("unsupported module: %s", req.Module)
	}
	
	return nil
}

// GetCommonModules 获取常用ansible模块列表
func GetCommonModules() []map[string]string {
	return []map[string]string{
		{"name": "shell", "description": "Execute shell commands"},
		{"name": "command", "description": "Execute commands without shell"},
		{"name": "copy", "description": "Copy files to remote locations"},
		{"name": "file", "description": "Manage files and file properties"},
		{"name": "service", "description": "Manage services"},
		{"name": "package", "description": "Manage packages"},
		{"name": "yum", "description": "Manage packages with yum"},
		{"name": "apt", "description": "Manage packages with apt"},
		{"name": "ping", "description": "Test connection to hosts"},
		{"name": "setup", "description": "Gather facts about remote hosts"},
		{"name": "debug", "description": "Print statements during execution"},
		{"name": "template", "description": "Process Jinja2 templates"},
		{"name": "lineinfile", "description": "Manage lines in text files"},
		{"name": "replace", "description": "Replace text in files"},
		{"name": "user", "description": "Manage user accounts"},
		{"name": "group", "description": "Manage groups"},
		{"name": "cron", "description": "Manage cron entries"},
		{"name": "mount", "description": "Manage mounted filesystems"},
		{"name": "git", "description": "Deploy software from git repositories"},
	}
}