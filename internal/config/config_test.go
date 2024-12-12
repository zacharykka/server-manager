package config

import (
	"reflect"
	"testing"
)

func TestConfig(t *testing.T) {
	want := &Config{
		Service: serviceConfig{
			Address:  "127.0.0.1",
			Port:     12340,
			LogLevel: "debug",
			LogDir:   "/var/log/",
		},
		Database: databaseConfig{
			Host:     "127.0.0.1",
			Port:     3306,
			User:     "root",
			Password: "root",
			Dbname:   "server_manager",
		},
		Cache: cacheConfig{
			Host:     "127.0.0.1",
			Port:     6379,
			Password: "",
		},
		Auth: authConfig{
			JwtSecret:     "your-jwt-secret",
			JwtExpiration: 24,
		},
		source: "./config_test.yaml",
	}
	config := NewConfig("./config_test.yaml")
	config.Load()

	if !reflect.DeepEqual(config, want) {
		t.Errorf("want: %v, got: %v", want, config)
	}
}
