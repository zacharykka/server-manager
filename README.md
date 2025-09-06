# 🚀 Server Manager

<div align="center">

A modern server management platform built with Go + React, integrated with Ansible automation tools, providing an intuitive web interface for batch server management.

[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

[English](README.md) | [中文](README_zh.md)

</div>

## ✨ Key Features

- 🖥️ **Batch Server Management** - Support for mainstream Linux distributions
- 🔧 **Ansible Integration** - Execute Adhoc commands and Playbooks
- 📋 **Inventory Management** - Dynamic and static host inventories
- 📊 **Real-time Task Monitoring** - WebSocket real-time output
- 🔐 **User Authentication** - JWT token authentication
- 🎨 **Modern UI** - Responsive design with dark theme support

## 🛠️ Tech Stack

### Backend Technologies
- **Framework**: [Gin](https://github.com/gin-gonic/gin) - High-performance Go web framework
- **Database**: PostgreSQL + Redis (cache/sessions)
- **ORM**: [GORM](https://gorm.io/) - Go object-relational mapping
- **Authentication**: JWT + bcrypt password encryption
- **Configuration**: [Viper](https://github.com/spf13/viper) configuration management
- **Logging**: Structured logging system

### Frontend Technologies
- **Framework**: [React 19](https://reactjs.org/) + TypeScript
- **Build Tool**: [Vite](https://vitejs.dev/) - Lightning-fast build tool
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **HTTP Client**: [TanStack Query](https://tanstack.com/query) + Axios

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Process Management**: systemd (binary deployment)
- **Reverse Proxy**: Nginx (production)
- **Development Tools**: Makefile + Hot reload

## 🚦 Quick Start

### Prerequisites

- **Go**: 1.21+
- **Node.js**: 18+
- **Docker**: 20.10+ (optional)
- **PostgreSQL**: 15+ (optional, supports SQLite for development)

### 1. Clone the Project

```bash
git clone https://github.com/zacharykka/server-manager.git
cd server-manager
```

### 2. Backend Setup

```bash
# Install Go dependencies
go mod download

# Start backend service (using SQLite)
go run cmd/server/main.go

# Or use Makefile
make run
```

Backend service will run on `http://localhost:8080`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd web

# Install dependencies
npm install

# Start development server
npm run dev

# Or use Makefile (from project root)
make web-dev
```

Frontend service will run on `http://localhost:5173`

### 4. Using Docker (Recommended)

```bash
# Start database services
make dev-setup

# Or manually start
docker compose -f docker-compose.dev.yml up -d postgres redis

# Check service status
make status
```

## 📖 Development Guide

### Project Structure

```
server-manager/
├── cmd/server/           # Application entry point
├── internal/            # Private application code
│   ├── auth/           # Authentication module
│   ├── server/         # Server management
│   ├── ansible/        # Ansible integration
│   ├── middleware/     # Middleware
│   └── common/         # Common components
├── web/                # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   └── lib/        # Utility functions
├── configs/            # Configuration files
├── scripts/            # Database scripts
└── deployments/        # Deployment configurations
```

### Available Commands

```bash
# Development environment
make dev-start          # Start complete development environment
make run               # Start backend
make web-dev           # Start frontend

# Database
make dev-setup         # Start database services
make db-reset          # Reset database

# Code quality
make test              # Run tests
make fmt               # Format code
make lint              # Code linting

# Build
make build             # Build backend
make web-build         # Build frontend

# View all commands
make help
```

## 🔧 Configuration

### Backend Configuration

Edit `configs/config.dev.yaml`:

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

### Frontend Configuration

- **Tailwind CSS**: `web/tailwind.config.js`
- **TypeScript**: `web/tsconfig.app.json`
- **Vite**: `web/vite.config.ts`

## 🎯 Development Roadmap

### Phase 1: Base Platform ✅
- [x] Project architecture design
- [x] Frontend and backend framework setup
- [x] Development environment configuration
- [ ] User authentication system

### Phase 2: Server Management
- [ ] Server CRUD operations
- [ ] SSH connection testing
- [ ] Server group management

### Phase 3: Ansible Integration
- [ ] Adhoc command execution
- [ ] Inventory management
- [ ] Playbook execution

### Phase 4: Advanced Features
- [ ] Task scheduling system
- [ ] Real-time log output
- [ ] Monitoring and alerting

## 🤝 Contributing

We welcome contributions of all kinds!

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open-sourced under the MIT License. See the [LICENSE](LICENSE) file for more details.

## 🆘 Support

If you encounter any issues or have suggestions, please submit an [Issue](https://github.com/zacharykka/server-manager/issues).

## ⭐ Star Support

If this project helps you, please give us a star ⭐

---

<div align="center">
  Made with ❤️ by the Server Manager Team
</div>