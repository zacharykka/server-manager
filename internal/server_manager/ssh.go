package server_manager

import (
	"fmt"
	"net"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
)

// SSHService SSH连接服务
type SSHService struct{}

// NewSSHService 创建SSH服务
func NewSSHService() *SSHService {
	return &SSHService{}
}

// TestConnection 测试SSH连接
func (s *SSHService) TestConnection(req *SSHTestRequest) *SSHTestResponse {
	start := time.Now()
	
	// 创建SSH配置
	config := &ssh.ClientConfig{
		User: req.Username,
		Auth: []ssh.AuthMethod{},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // 开发环境忽略主机密钥验证
		Timeout: 10 * time.Second,
	}

	// 添加认证方法
	if req.Password != "" {
		config.Auth = append(config.Auth, ssh.Password(req.Password))
	}
	
	if req.PrivateKey != "" {
		signer, err := ssh.ParsePrivateKey([]byte(req.PrivateKey))
		if err != nil {
			return &SSHTestResponse{
				Success: false,
				Message: fmt.Sprintf("Invalid private key: %v", err),
			}
		}
		config.Auth = append(config.Auth, ssh.PublicKeys(signer))
	}

	if len(config.Auth) == 0 {
		return &SSHTestResponse{
			Success: false,
			Message: "No authentication method provided (password or private key required)",
		}
	}

	// 建立连接
	address := fmt.Sprintf("%s:%d", req.Host, req.Port)
	client, err := ssh.Dial("tcp", address, config)
	if err != nil {
		return &SSHTestResponse{
			Success: false,
			Message: fmt.Sprintf("Connection failed: %v", err),
		}
	}
	defer client.Close()

	latency := time.Since(start).Milliseconds()

	// 测试基本命令执行
	session, err := client.NewSession()
	if err != nil {
		return &SSHTestResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to create session: %v", err),
			LatencyMs: latency,
		}
	}
	defer session.Close()

	// 获取操作系统信息
	osInfo, err := s.getOSInfo(client)
	if err != nil {
		// 即使获取OS信息失败，连接测试仍然算成功
		return &SSHTestResponse{
			Success:   true,
			Message:   "Connection successful, but failed to get system info",
			LatencyMs: latency,
		}
	}

	// 获取系统运行时间
	uptime, _ := s.getUptime(client)

	return &SSHTestResponse{
		Success:   true,
		Message:   "Connection successful",
		OSInfo:    osInfo,
		Uptime:    uptime,
		LatencyMs: latency,
	}
}

// TestConnectionWithServer 使用服务器配置测试连接
func (s *SSHService) TestConnectionWithServer(server *Server) *SSHTestResponse {
	req := &SSHTestRequest{
		Host:       server.Host,
		Port:       server.Port,
		Username:   server.Username,
		Password:   server.Password,
		PrivateKey: server.PrivateKey,
	}
	
	return s.TestConnection(req)
}

// getOSInfo 获取操作系统信息
func (s *SSHService) getOSInfo(client *ssh.Client) (string, error) {
	session, err := client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	// 尝试获取详细的OS信息
	commands := []string{
		"cat /etc/os-release | head -n 1",
		"uname -sr",
		"cat /etc/redhat-release",
		"cat /etc/debian_version",
		"sw_vers -productName -productVersion", // macOS
	}

	for _, cmd := range commands {
		output, err := session.Output(cmd)
		if err == nil && len(output) > 0 {
			result := strings.TrimSpace(string(output))
			if result != "" {
				// 清理输出
				if strings.Contains(result, "PRETTY_NAME=") {
					result = strings.TrimPrefix(result, "PRETTY_NAME=")
					result = strings.Trim(result, "\"")
				}
				return result, nil
			}
		}
		
		// 重新创建session用于下一个命令
		session.Close()
		session, err = client.NewSession()
		if err != nil {
			return "", err
		}
	}

	return "Unknown Linux Distribution", nil
}

// getUptime 获取系统运行时间
func (s *SSHService) getUptime(client *ssh.Client) (string, error) {
	session, err := client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	output, err := session.Output("uptime")
	if err != nil {
		return "", err
	}

	uptime := strings.TrimSpace(string(output))
	return uptime, nil
}

// ExecuteCommand 在服务器上执行命令
func (s *SSHService) ExecuteCommand(server *Server, command string) (string, error) {
	// 创建SSH配置
	config := &ssh.ClientConfig{
		User: server.Username,
		Auth: []ssh.AuthMethod{},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout: 30 * time.Second,
	}

	// 添加认证方法
	if server.Password != "" {
		config.Auth = append(config.Auth, ssh.Password(server.Password))
	}
	
	if server.PrivateKey != "" {
		signer, err := ssh.ParsePrivateKey([]byte(server.PrivateKey))
		if err != nil {
			return "", fmt.Errorf("invalid private key: %v", err)
		}
		config.Auth = append(config.Auth, ssh.PublicKeys(signer))
	}

	// 建立连接
	address := fmt.Sprintf("%s:%d", server.Host, server.Port)
	client, err := ssh.Dial("tcp", address, config)
	if err != nil {
		return "", fmt.Errorf("connection failed: %v", err)
	}
	defer client.Close()

	// 创建session
	session, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create session: %v", err)
	}
	defer session.Close()

	// 执行命令
	output, err := session.CombinedOutput(command)
	if err != nil {
		return string(output), fmt.Errorf("command execution failed: %v", err)
	}

	return string(output), nil
}

// CheckConnectivity 检查服务器连通性（不需要SSH）
func (s *SSHService) CheckConnectivity(host string, port int) bool {
	address := fmt.Sprintf("%s:%d", host, port)
	conn, err := net.DialTimeout("tcp", address, 5*time.Second)
	if err != nil {
		return false
	}
	defer conn.Close()
	return true
}