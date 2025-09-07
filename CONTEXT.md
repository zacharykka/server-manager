# Server Manager 项目上下文

## 项目概述

**项目名称**: Server Manager
**目标**: 创建一个Golang web项目，后端使用ansible对服务器进行批量管理

## 功能需求

### 主要功能
- 批量部署服务器
- 服务器类型：常见Linux发行版(Debian系/RedHat系/ArchLinux/Alpine/Openwrt等)

### Ansible场景
1. **Inventory管理**: 增删改查
   - 长期inventory
   - 临时inventory
2. **Adhoc命令执行**
3. **Playbook管理和执行**

### 用户界面
- 左右分隔布局：左边导航栏，右边界面
- 登录界面
- 仪表板
- 用户信息管理
- Ansible各种功能页面
- 执行信息实时输出

### 用户权限
- 暂时只做单用户，留出扩展空间开发多用户

### 部署方式
- 二进制部署
- 容器部署

### 数据存储需求
- 任务历史
- 服务器信息
- 日志
- inventory
- playbook
- adhoc记录

## 技术架构

### 整体架构（分层设计）
```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Web Frontend  │  │   REST API      │  │  WebSocket   │ │
│  │ (React+TS+Shadcn)│ │   (Gin/Echo)    │  │   Gateway    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Business Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │   Server    │ │   Ansible   │ │    Task     │ │  User  │ │
│  │  Service    │ │  Service    │ │  Service    │ │Service │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │  Database   │ │    Cache    │ │   Message   │ │  File  │ │
│  │ Repository  │ │   (Redis)   │ │   Queue     │ │Storage │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

**后端技术栈:**
- Web框架: Gin
- 数据库: PostgreSQL (主库) + Redis (缓存/会话)
- ORM: GORM
- WebSocket: Gorilla WebSocket
- 配置管理: Viper
- 日志: Zap + Lumberjack

**前端技术栈:**
- 框架: React 18 + TypeScript
- UI组件库: Shadcn/UI (基于Radix UI + Tailwind CSS)
- 状态管理: Zustand
- 路由: React Router v6
- HTTP客户端: Axios 或 TanStack Query
- 构建工具: Vite

**部署相关:**
- 容器化: Docker + Docker Compose
- 进程管理: systemd (二进制部署)
- 反向代理: Nginx

### 核心模块

```go
internal/
├── auth/          // 认证授权模块
├── server/        // 服务器管理模块
├── ansible/       // Ansible集成模块
├── task/          // 任务管理模块
├── user/          // 用户管理模块
├── websocket/     // WebSocket通信模块
├── common/        // 公共组件
└── middleware/    // 中间件
```

### 数据库设计

**核心表结构:**
- users: 用户表
- servers: 服务器表
- server_groups: 服务器组表
- server_group_members: 服务器组关联表
- inventories: Inventory表
- playbooks: Playbook表
- task_executions: 任务执行记录表
- task_logs: 任务执行详细日志表

### Ansible集成策略

**集成方式**: 命令行调用 (使用 `os/exec` 包)
- 通过管道实时获取输出
- 更稳定可靠，完全兼容Ansible功能

**实时通信方案**: WebSocket架构
- 实时任务输出推送
- 客户端连接管理
- 消息广播机制

## 开发计划

### MVP功能范围

**Phase 1: 基础平台搭建 (2-3周)**
- 用户认证系统
- 服务器管理 (增删改查、SSH连接测试)
- 基础UI框架

**Phase 2: Ansible基础集成 (2-3周)**
- Adhoc命令执行
- 静态Inventory管理

**Phase 3: 任务管理系统 (2-3周)**
- 任务执行历史
- Playbook基础支持

### 完整开发计划

**Sprint 1: 项目初始化 (1周)**
- Day 1-2: 项目结构搭建
- Day 3-4: 基础框架集成
- Day 5-7: 用户认证系统

**Sprint 2: 服务器管理 (1-2周)**
- Week 1: 服务器CRUD API开发
- Week 2: 服务器管理页面

**Sprint 3: Ansible基础集成 (2周)**
- Week 1: Ansible命令行集成，Adhoc API开发
- Week 2: Adhoc执行页面

**Sprint 4: Inventory管理 (1-2周)**
- Week 1: Inventory CRUD API
- Week 2: Inventory管理页面

**Sprint 5: Playbook管理 (1-2周)**
- Week 1: Playbook存储和管理
- Week 2: Playbook管理页面

### MVP交付标准
1. 用户能够登录系统并管理服务器信息
2. 能够对目标服务器执行Adhoc命令并查看结果
3. 能够上传和管理Inventory文件
4. 能够上传和执行简单的Playbook
5. 能够查看执行历史和基础日志

### 暂缓功能 (后续阶段)
- WebSocket实时输出
- 高级权限管理
- 任务调度系统
- 监控和告警
- 性能优化

## 项目结构

```
server-manager/
├── cmd/
│   └── server/
│       └── main.go                 # 应用入口
├── internal/
│   ├── auth/                       # 认证模块
│   ├── server/                     # 服务器管理模块
│   ├── ansible/                    # Ansible集成模块
│   ├── task/                       # 任务管理模块
│   ├── websocket/                  # WebSocket模块
│   ├── user/                       # 用户管理模块
│   ├── middleware/                 # 中间件
│   ├── config/                     # 配置管理
│   └── common/                     # 公共组件
├── pkg/                            # 公共包
├── web/                            # 前端代码 (React)
├── scripts/                        # 脚本文件
├── configs/                        # 配置文件
├── deployments/                    # 部署文件
├── docs/                          # 文档
├── tests/                         # 测试文件
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

## 当前进展

### 已完成 ✅
- ✅ 需求分析和架构设计
- ✅ Go项目结构初始化
- ✅ 基础Go依赖安装
- ✅ 基础服务器框架 (Gin + 配置 + 中间件)
- ✅ 健康检查接口测试通过
- ✅ **React前端项目完整配置**
  - React 19 + TypeScript + Vite
  - 标准Tailwind CSS 4.x 完整配置（已修复自定义颜色问题）
  - UI组件库基础组件 (Button, Input, Card, Label等)
  - 路径别名配置 (@/*)
  - PostCSS 和 Autoprefixer
- ✅ **开发环境完整设置**
  - Docker Compose 开发配置
  - PostgreSQL 数据库 schema 设计
  - 开发配置文件 (config.dev.yaml)
  - Makefile 开发工具链
  - 前后端服务正常运行
- ✅ **Sprint 1: 后端用户认证系统完整实现**
  - 用户模型和数据库表 (GORM + SQLite)
  - JWT 认证管理器 (token生成/验证)
  - 完整认证API端点 (注册/登录/资料管理)
  - 基于角色的访问控制 (admin/user)
  - 密码bcrypt加密
  - 默认管理员用户自动创建
  - 认证中间件和权限验证
  - 所有API端点测试验证通过
- ✅ **完整前端认证系统实现**
  - 登录/注册表单组件 (标准Tailwind CSS样式)
  - Zustand状态管理 (用户状态和认证持久化)
  - API客户端配置 (Axios + JWT token自动管理)
  - 路由保护中间件 (支持管理员权限)
  - 用户资料管理页面
  - 响应式仪表板布局和侧边栏导航
  - React Router路由配置
  - TypeScript类型安全
  - 前后端认证集成测试通过
- ✅ **安全加密系统增强实现**
  - ✅ **双重密码加密保护**
    - 前端SHA-256+盐值客户端哈希 (`web/src/lib/crypto.ts`)
    - 后端bcrypt服务器端加密 (修改 `internal/user/service.go`)
    - 密码传输安全：永不明文传输
  - ✅ **前端加密实现**
    - 客户端不可逆SHA-256哈希函数
    - 固定盐值: `server-manager-2025-secure-salt`
    - 密码强度验证规则 (大小写字母+数字+特殊字符+8位以上)
    - 登录和注册流程自动加密
  - ✅ **后端加密处理**
    - 修改认证逻辑处理预哈希密码
    - 用户创建/密码变更支持双重加密
    - 默认管理员用户兼容新加密方式
  - ✅ **数据迁移完成**
    - 清理旧用户数据
    - 重新创建兼容双重加密的默认用户
    - 前端登录功能验证正常
- ✅ **Sprint 2: 服务器管理模块完整实现**
  - ✅ **服务器管理后端API**
    - 服务器模型和数据库表 (`internal/server_manager/model.go`)
    - 完整CRUD服务层 (`internal/server_manager/service.go`)
    - SSH连接测试功能 (`internal/server_manager/ssh.go`)
    - 服务器管理API处理器 (`internal/server_manager/handler.go`)
    - 服务器组管理功能 (创建/编辑/删除/查询)
    - 服务器统计信息API
    - 搜索和筛选功能
    - 全部API端点测试验证通过
  - ✅ **服务器管理前端界面**
    - 服务器API客户端 (`web/src/services/server.ts`)
    - React状态管理钩子 (`web/src/hooks/useServer.ts`) 
    - 服务器列表页面 (`web/src/pages/ServersPage.tsx`)
    - 服务器表单组件 (`web/src/components/ServerForm.tsx`)
    - 路由集成到App.tsx
    - 搜索、筛选、分页功能
    - SSH连接测试界面
  - ✅ **UI组件依赖解决**
    - Badge组件 (`web/src/components/ui/badge.tsx`)
    - Select组件 (`web/src/components/ui/select.tsx`)
    - Tabs组件 (`web/src/components/ui/tabs.tsx`)
    - Table组件 (`web/src/components/ui/table.tsx`)
    - AlertDialog组件 (`web/src/components/ui/alert-dialog.tsx`)
    - Textarea组件 (`web/src/components/ui/textarea.tsx`)
    - TypeScript类型导入优化 (使用 `import type`)

### 当前运行状态 🚀
- **前端**: http://localhost:5173 ✅
  - React + Vite 开发服务器
  - 标准Tailwind CSS配置正常工作
  - 热重载正常工作
  - 所有UI组件和页面正常显示
  - **双重加密认证系统正常工作**
  - **服务器管理界面完全功能正常**
- **后端**: http://localhost:8080 ✅
  - Go + Gin 服务器运行中
  - SQLite 开发数据库已初始化
  - 默认管理员账户: admin/admin123 (使用双重加密)
  - 完整认证API已就绪和测试验证
  - **安全的双重密码加密系统正常运行**
  - **服务器管理API全部就绪和测试验证**
  - 所有端点正常工作:
    - 🔓 公开: `/health`, `/api/v1/auth/login`, `/api/v1/auth/register`  
    - 🔒 认证: `/api/v1/profile`, `/api/v1/change-password`, `/api/v1/refresh-token`
    - 👑 管理员: `/api/v1/admin/users/*`
    - 🖥️ **服务器管理**: `/api/v1/servers/*`, `/api/v1/server-groups/*`, `/api/v1/test-ssh`, `/api/v1/server-stats`

### 当前任务 ✅
- ✅ **已完成**: React前端认证系统完整实现
- ✅ **已完成**: 双重密码加密安全系统实现
- ✅ **已完成**: Sprint 2服务器管理模块完整实现
  - ✅ 服务器管理后端API (CRUD + SSH测试 + 统计)
  - ✅ 服务器组管理功能 
  - ✅ 前端服务器管理界面 (列表 + 表单 + 搜索 + 筛选)
  - ✅ 完整API测试验证通过
  - ✅ 所有UI组件依赖问题已解决

### 下一步计划
1. **Sprint 3: Ansible基础集成**
   - Ansible命令行集成框架
   - Adhoc命令执行API开发  
   - 命令执行结果存储和展示
   - 实时输出WebSocket集成

2. **Ansible前端界面**
   - Adhoc命令执行页面
   - 命令历史和结果查看
   - 命令模板管理
   - 实时执行输出显示

## 技术细节

### 已创建的Go文件
- `cmd/server/main.go`: 应用入口点
- `internal/config/config.go`: 配置管理 (支持环境变量)
- `internal/server/server.go`: Gin服务器设置 + 路由配置 + 数据库初始化 + **双重加密兼容的默认用户创建**
- `internal/middleware/logger.go`: 日志中间件
- `internal/middleware/cors.go`: CORS中间件  
- `internal/middleware/auth.go`: JWT认证中间件 + 权限验证
- `internal/common/response.go`: 统一响应格式
- **认证系统模块:**
  - `internal/user/model.go`: 用户模型和请求/响应结构体
  - `internal/user/service.go`: 用户业务逻辑服务 (CRUD + 双重加密密码验证)
  - `internal/auth/jwt.go`: JWT token管理器
  - `internal/auth/handler.go`: 认证API处理器 (登录/注册/资料管理)
- **服务器管理模块:**
  - `internal/server_manager/model.go`: 服务器和服务器组模型
  - `internal/server_manager/service.go`: 服务器管理业务逻辑 (CRUD + 搜索 + 统计)
  - `internal/server_manager/ssh.go`: SSH连接测试功能 
  - `internal/server_manager/handler.go`: 服务器管理API处理器

### 已安装的Go依赖
- github.com/gin-gonic/gin: Web框架
- github.com/golang-jwt/jwt/v5: JWT认证
- gorm.io/gorm: ORM
- gorm.io/driver/sqlite: SQLite驱动
- gorm.io/driver/postgres: PostgreSQL驱动
- github.com/go-redis/redis/v8: Redis客户端
- golang.org/x/crypto/bcrypt: 密码加密
- **内置Go包**: `crypto/sha256`, `encoding/hex` (用于前端兼容的SHA-256哈希)

### 前端项目完整配置
- **React项目**: `/web/` 目录，使用 Vite + React 19 + TypeScript
- **依赖包**: 
  - UI: `@tanstack/react-query`, `axios`, `react-router-dom`, `zustand`
  - Tailwind: `tailwindcss`, `@tailwindcss/postcss`, `autoprefixer`
  - Radix UI: `@radix-ui/react-label`
  - 工具: `class-variance-authority`, `clsx`, `tailwind-merge`
  - **加密**: `crypto-js` (用于SHA-256客户端哈希)
- **配置文件**:
  - `tailwind.config.js`: 标准Tailwind CSS 4.x 配置
  - `postcss.config.js`: PostCSS 配置
  - `vite.config.ts`: Vite 配置，包含路径别名
  - `tsconfig.app.json`: TypeScript 配置，包含路径映射
- **UI组件**: 
  - `src/components/ui/`: Button, Input, Label, Card, Badge, Select, Table, AlertDialog, Tabs, Textarea等组件
  - `src/components/auth/`: LoginForm, RegisterForm, ProtectedRoute
  - `src/components/layout/`: DashboardLayout, Sidebar
  - `src/components/ServerForm.tsx`: 服务器添加/编辑表单
- **页面组件**:
  - `src/pages/auth/`: LoginPage, RegisterPage
  - `src/pages/`: DashboardPage, ProfilePage, ServersPage
  - `src/hooks/useServer.ts`: 服务器管理状态钩子
- **状态管理**: `src/stores/auth.ts` (Zustand + persist)
- **API服务**: `src/services/auth.ts` + `src/lib/api.ts` (Axios配置)
- **工具函数**: 
  - `src/lib/utils.ts` (cn 函数用于样式合并)
  - **`src/lib/crypto.ts` (客户端SHA-256加密 + 密码强度验证)**
- **自定义Hooks**: `src/hooks/useAuth.ts` (认证逻辑封装 + 双重加密集成)

### 开发环境配置
- **Docker配置**: `docker-compose.dev.yml` (PostgreSQL + Redis + 可选API服务)
- **数据库**: `scripts/init-db.sql` (完整的PostgreSQL schema)
- **开发配置**: `configs/config.dev.yaml` (应用配置)
- **开发工具**: `Makefile` (常用开发命令)
- **容器配置**: `Dockerfile.dev` (开发环境Docker镜像)

## 注意事项

### 开发环境使用
1. **启动服务**: 
   - 前端: `cd web && npm run dev` (端口 5173)
   - 后端: `go run cmd/server/main.go` (端口 8080)
   - 或使用: `make dev-start` (启动数据库) + 分别启动前后端
   - **注意**: 实际运行端口可能因冲突调整为5174

2. **数据库**: 当前使用SQLite开发，Docker PostgreSQL配置已就绪
3. **认证**: 使用JWT token认证机制，密钥配置在 config.dev.yaml
4. **安全性**: **双重密码加密** - 前端SHA-256哈希 + 后端bcrypt，传输层无明文密码
5. **API路径**: 后端API前缀 `/api/v1/`，静态文件服务 `/static/`
6. **开发工具**: Makefile提供常用命令 (`make help` 查看)

### 技术栈版本
- **前端**: React 19, Vite 7.1, Tailwind CSS 4.x, TypeScript 5.8
- **后端**: Go 1.21, Gin框架, GORM v2
- **数据库**: PostgreSQL 15 (生产) / SQLite (开发)
- **缓存**: Redis 7
- **容器**: Docker Compose v2

## 风险和缓解

**技术风险:**
- Ansible集成复杂度 → 先实现简单命令调用
- 前后端数据同步 → 使用TypeScript定义共享类型
- 并发任务处理 → MVP阶段使用同步执行

**进度风险:**
- 开发时间估算偏差 → 每Sprint结束评估进度

---

*最后更新: 2025-09-07*
*项目状态: Sprint 2服务器管理模块完整实现 - 准备进入Sprint 3 Ansible集成开发*  
*开发环境: ✅ 完全就绪 (前端: :5173, 后端: :8080)*
*安全状态: ✅ 双重加密保护正常工作 (前端SHA-256 + 后端bcrypt)*
*当前里程碑: MVP Phase 2 - 服务器管理功能完成，准备开始Ansible集成功能*