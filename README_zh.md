# 🚀 Server Manager

<div align="center">

一个基于 Go + React 的现代化服务器管理平台，集成 Ansible 自动化工具，提供直观的 Web 界面进行批量服务器管理。

[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

## ✨ 核心功能

- 🖥️ **批量服务器管理** - 支持主流 Linux 发行版管理
- 🔧 **Ansible 集成** - 执行 Adhoc 命令和 Playbook
- 📋 **Inventory 管理** - 动态和静态主机清单
- 📊 **实时任务监控** - WebSocket 实时输出
- 🔐 **用户认证系统** - JWT 令牌认证
- 🎨 **现代化 UI** - 响应式设计，暗色主题支持

## 🛠️ 技术栈

### 后端技术
- **框架**: [Gin](https://github.com/gin-gonic/gin) - 高性能 Go Web 框架
- **数据库**: PostgreSQL + Redis (缓存/会话)
- **ORM**: [GORM](https://gorm.io/) - Go 对象关系映射
- **认证**: JWT + bcrypt 密码加密
- **配置**: [Viper](https://github.com/spf13/viper) 配置管理
- **日志**: 结构化日志系统

### 前端技术
- **框架**: [React 19](https://reactjs.org/) + TypeScript
- **构建工具**: [Vite](https://vitejs.dev/) - 极速构建工具
- **UI 组件**: [Shadcn/UI](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **路由**: [React Router v6](https://reactrouter.com/)
- **HTTP 客户端**: [TanStack Query](https://tanstack.com/query) + Axios

### DevOps & 部署
- **容器化**: Docker + Docker Compose
- **进程管理**: systemd (二进制部署)
- **反向代理**: Nginx (生产环境)
- **开发工具**: Makefile + 热重载

## 🚦 快速开始

### 环境要求

- **Go**: 1.21+
- **Node.js**: 18+
- **Docker**: 20.10+ (可选)
- **PostgreSQL**: 15+ (可选，支持 SQLite 开发)

### 1. 克隆项目

```bash
git clone https://github.com/zacharykka/server-manager.git
cd server-manager
```

### 2. 后端设置

```bash
# 安装 Go 依赖
go mod download

# 启动后端服务 (使用 SQLite)
go run cmd/server/main.go

# 或使用 Makefile
make run
```

后端服务将运行在 `http://localhost:8080`

### 3. 前端设置

```bash
# 进入前端目录
cd web

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或使用 Makefile (在项目根目录)
make web-dev
```

前端服务将运行在 `http://localhost:5173`

### 4. 使用 Docker (推荐)

```bash
# 启动数据库服务
make dev-setup

# 或手动启动
docker compose -f docker-compose.dev.yml up -d postgres redis

# 查看服务状态
make status
```

## 📖 开发指南

### 项目结构

```
server-manager/
├── cmd/server/           # 应用入口
├── internal/            # 私有应用代码
│   ├── auth/           # 认证模块
│   ├── server/         # 服务器管理
│   ├── ansible/        # Ansible 集成
│   ├── middleware/     # 中间件
│   └── common/         # 公共组件
├── web/                # React 前端
│   ├── src/
│   │   ├── components/ # UI 组件
│   │   ├── pages/      # 页面组件
│   │   └── lib/        # 工具函数
├── configs/            # 配置文件
├── scripts/            # 数据库脚本
└── deployments/        # 部署配置
```

### 可用命令

```bash
# 开发环境
make dev-start          # 启动完整开发环境
make run               # 启动后端
make web-dev           # 启动前端

# 数据库
make dev-setup         # 启动数据库服务
make db-reset          # 重置数据库

# 代码质量
make test              # 运行测试
make fmt               # 格式化代码
make lint              # 代码检查

# 构建
make build             # 构建后端
make web-build         # 构建前端

# 查看所有命令
make help
```

## 🔧 配置说明

### 后端配置

编辑 `configs/config.dev.yaml`:

```yaml
app:
  name: "Server Manager"
  port: 8080
  mode: "development"

database:
  host: "localhost"
  port: 5432
  user: "postgres"
  password: "postgres"
  dbname: "servermanager"

jwt:
  secret: "your-secret-key"
  expire_hours: 24
```

### 前端配置

- **Tailwind CSS**: `web/tailwind.config.js`
- **TypeScript**: `web/tsconfig.app.json`
- **Vite**: `web/vite.config.ts`

## 🎯 开发计划

### Phase 1: 基础平台 ✅
- [x] 项目架构设计
- [x] 前后端框架搭建
- [x] 开发环境配置
- [ ] 用户认证系统

### Phase 2: 服务器管理
- [ ] 服务器 CRUD 操作
- [ ] SSH 连接测试
- [ ] 服务器分组管理

### Phase 3: Ansible 集成
- [ ] Adhoc 命令执行
- [ ] Inventory 管理
- [ ] Playbook 执行

### Phase 4: 高级功能
- [ ] 任务调度系统
- [ ] 实时日志输出
- [ ] 监控和告警

## 🤝 贡献指南

我们欢迎任何形式的贡献！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

本项目基于 MIT 许可证开源。查看 [LICENSE](LICENSE) 文件了解更多详情。

## 🆘 问题反馈

如果遇到问题或有建议，请提交 [Issue](https://github.com/zacharykka/server-manager/issues)。

## ⭐ 星标支持

如果这个项目对你有帮助，请给我们一个星标 ⭐

---

<div align="center">
  Made with ❤️ by the Server Manager Team
</div>