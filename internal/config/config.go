package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Redis    RedisConfig    `yaml:"redis"`
	Auth     AuthConfig     `yaml:"auth"`
	Ansible  AnsibleConfig  `yaml:"ansible"`
}

type ServerConfig struct {
	Port         int    `yaml:"port"`
	Host         string `yaml:"host"`
	ReadTimeout  int    `yaml:"read_timeout"`
	WriteTimeout int    `yaml:"write_timeout"`
}

type DatabaseConfig struct {
	Driver   string `yaml:"driver"`
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Database string `yaml:"database"`
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	SSLMode  string `yaml:"ssl_mode"`
}

type RedisConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Password string `yaml:"password"`
	Database int    `yaml:"database"`
}

type AuthConfig struct {
	JWTSecret     string `yaml:"jwt_secret"`
	TokenDuration int    `yaml:"token_duration"` // hours
}

type AnsibleConfig struct {
	Path       string `yaml:"path"`        // Ansible命令路径
	WorkDir    string `yaml:"work_dir"`    // 工作目录
	TempDir    string `yaml:"temp_dir"`    // 临时文件目录
	Timeout    int    `yaml:"timeout"`     // 命令执行超时时间（秒）
	Verbose    bool   `yaml:"verbose"`     // 是否启用详细输出
}

func Load() (*Config, error) {
	config := &Config{
		Server: ServerConfig{
			Port:         getEnvAsInt("SERVER_PORT", 8080),
			Host:         getEnv("SERVER_HOST", "0.0.0.0"),
			ReadTimeout:  getEnvAsInt("SERVER_READ_TIMEOUT", 30),
			WriteTimeout: getEnvAsInt("SERVER_WRITE_TIMEOUT", 30),
		},
		Database: DatabaseConfig{
			Driver:   getEnv("DB_DRIVER", "sqlite"),
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvAsInt("DB_PORT", 5432),
			Database: getEnv("DB_DATABASE", "server_manager.db"),
			Username: getEnv("DB_USERNAME", ""),
			Password: getEnv("DB_PASSWORD", ""),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnvAsInt("REDIS_PORT", 6379),
			Password: getEnv("REDIS_PASSWORD", ""),
			Database: getEnvAsInt("REDIS_DATABASE", 0),
		},
		Auth: AuthConfig{
			JWTSecret:     getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
			TokenDuration: getEnvAsInt("TOKEN_DURATION", 24),
		},
		Ansible: AnsibleConfig{
			Path:    getEnv("ANSIBLE_PATH", ""),
			WorkDir: getEnv("ANSIBLE_WORK_DIR", "./"),
			TempDir: getEnv("ANSIBLE_TEMP_DIR", ""),
			Timeout: getEnvAsInt("ANSIBLE_TIMEOUT", 30),
			Verbose: getEnvAsBool("ANSIBLE_VERBOSE", true),
		},
	}

	return config, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if valueStr := os.Getenv(key); valueStr != "" {
		if value, err := strconv.Atoi(valueStr); err == nil {
			return value
		}
		fmt.Printf("Warning: Invalid value for %s, using default: %d\n", key, defaultValue)
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if valueStr := os.Getenv(key); valueStr != "" {
		if value, err := strconv.ParseBool(valueStr); err == nil {
			return value
		}
		fmt.Printf("Warning: Invalid boolean value for %s, using default: %t\n", key, defaultValue)
	}
	return defaultValue
}