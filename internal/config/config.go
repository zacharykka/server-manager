package config

import (
	"fmt"
	"os"

	"github.com/spf13/viper"
)

type Config struct {
	Service  serviceConfig
	Database databaseConfig
	Cache    cacheConfig
	Auth     authConfig
	source   string
}

type databaseConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	Dbname   string `yaml:"dbname"`
}

type cacheConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Password string `yaml:"password"`
}

type authConfig struct {
	JwtSecret            string `yaml:"jwt_secret"`
	JwtExpiration        int    `yaml:"jwt_expiration"`
	JwtRefreshSecret     string `yaml:"jwt_refresh_secret"`
	JwtRefreshExpiration int    `yaml:"jwt_refresh_expiration"`
}

type serviceConfig struct {
	Address  string `yaml:"address"`
	Port     int    `yaml:"port"`
	LogLevel string `yaml:"log_level"`
	LogDir   string `yaml:"log_dir"`
}

// NewConfig create a new config instance
func NewConfig(source string) *Config {
	return &Config{source: source}
}

// Load load the config from the source file
func (c *Config) Load() {
	// check the config file if exists
	_, err := os.Stat(c.source)
	if err != nil {
		panic(fmt.Errorf("fatal config file not found: %w", err))
	}

	// read the config file by viper
	viper.SetConfigFile(c.source)
	err = viper.ReadInConfig()
	if err != nil {
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	// set service config
	c.Service = serviceConfig{Address: viper.GetString("service.address"), Port: viper.GetInt("service.port"), LogLevel: viper.GetString("service.log_level"), LogDir: viper.GetString("service.log_dir")}

	// set database config
	c.Database = databaseConfig{Host: viper.GetString("database.host"), Port: viper.GetInt("database.port"), User: viper.GetString("database.user"), Password: viper.GetString("database.password"), Dbname: viper.GetString("database.dbname")}

	// set cache config
	c.Cache = cacheConfig{Host: viper.GetString("cache.host"), Port: viper.GetInt("cache.port"), Password: viper.GetString("cache.password")}

	// set auth config
	c.Auth = authConfig{JwtSecret: viper.GetString("auth.jwt_secret"), JwtExpiration: viper.GetInt("auth.jwt_expiration"), JwtRefreshSecret: viper.GetString("auth.jwt_refresh_secret"), JwtRefreshExpiration: viper.GetInt("auth.jwt_refresh_expiration")}
}
