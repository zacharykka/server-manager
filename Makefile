# Server Manager Makefile

# 变量定义
APP_NAME := server-manager
GO_VERSION := 1.21
DOCKER_COMPOSE_DEV := docker compose -f docker-compose.dev.yml

# 默认目标
.DEFAULT_GOAL := help

# 帮助信息
.PHONY: help
help: ## 显示帮助信息
	@echo "Server Manager 开发命令："
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# 开发环境设置
.PHONY: dev-setup
dev-setup: ## 设置开发环境
	@echo "设置开发环境..."
	$(DOCKER_COMPOSE_DEV) up -d postgres redis
	@echo "等待数据库启动..."
	@sleep 10
	@echo "开发环境设置完成！"

.PHONY: dev-down
dev-down: ## 停止开发环境
	$(DOCKER_COMPOSE_DEV) down

.PHONY: dev-clean
dev-clean: ## 清理开发环境（包括数据卷）
	$(DOCKER_COMPOSE_DEV) down -v
	docker system prune -f

# 数据库操作
.PHONY: db-reset
db-reset: ## 重置数据库
	$(DOCKER_COMPOSE_DEV) down postgres
	docker volume rm server-manager_postgres_data || true
	$(DOCKER_COMPOSE_DEV) up -d postgres
	@echo "数据库重置完成！"

.PHONY: db-migrate
db-migrate: ## 运行数据库迁移（如果有的话）
	@echo "运行数据库迁移..."
	# TODO: 添加迁移命令

# Go应用操作
.PHONY: run
run: ## 运行Go后端应用
	@echo "启动Go后端服务器..."
	go run cmd/server/main.go

.PHONY: build
build: ## 构建Go应用
	@echo "构建应用..."
	go build -o bin/$(APP_NAME) cmd/server/main.go

.PHONY: test
test: ## 运行测试
	go test -v ./...

.PHONY: test-cover
test-cover: ## 运行测试并生成覆盖率报告
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "覆盖率报告生成在 coverage.html"

# 前端操作
.PHONY: web-install
web-install: ## 安装前端依赖
	cd web && npm install

.PHONY: web-dev
web-dev: ## 启动前端开发服务器
	cd web && npm run dev

.PHONY: web-build
web-build: ## 构建前端应用
	cd web && npm run build

.PHONY: web-lint
web-lint: ## 前端代码检查
	cd web && npm run lint

# 开发工具
.PHONY: fmt
fmt: ## 格式化Go代码
	go fmt ./...
	goimports -w .

.PHONY: lint
lint: ## 运行Go代码检查
	golangci-lint run

.PHONY: mod-tidy
mod-tidy: ## 清理Go模块依赖
	go mod tidy

# 组合命令
.PHONY: dev-start
dev-start: dev-setup ## 启动完整开发环境
	@echo "启动完整开发环境..."
	@echo "数据库和Redis已启动"
	@echo "请在不同终端中运行："
	@echo "  make run      # 启动后端"
	@echo "  make web-dev  # 启动前端"

.PHONY: dev-all
dev-all: dev-setup ## 使用Docker启动全部服务（包括API）
	$(DOCKER_COMPOSE_DEV) --profile api up -d

.PHONY: logs
logs: ## 查看开发环境日志
	$(DOCKER_COMPOSE_DEV) logs -f

.PHONY: status
status: ## 查看服务状态
	$(DOCKER_COMPOSE_DEV) ps

# 清理
.PHONY: clean
clean: ## 清理构建文件
	rm -rf bin/
	rm -f coverage.out coverage.html
	cd web && rm -rf dist/