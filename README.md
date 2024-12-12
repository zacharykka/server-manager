# Server Manager

## 1. Introduction

This is a server manager tool that allows you to manage your servers using Ansible.

Power by 
- [gin](https://github.com/gin-gonic/gin)
- [gorm](https://github.com/go-gorm/gorm)
- [go-ansible](https://github.com/apenella/go-ansible)
- [viper](https://github.com/spf13/viper)
- [zap](https://github.com/uber-go/zap)

### 1.1 Project Structure

- `cmd`: Entry points for the application
- `configs`: Configuration files
- `db`: Database migrations
- `internal`: Private application code
  - `apis`: HTTP handlers and routing
  - `app`: Contains business logic
  - `config`: Read configuration files
  - `domain`: Contains business entities and interfaces
  - `middleware`: Middleware for HTTP requests
  - `model`: External tools and configurations
  - `repository`: Implements data storage interfaces
- `scripts`: Scripts for development


### 1.2 APIs

