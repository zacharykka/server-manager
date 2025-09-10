package server

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"server-manager/internal/auth"
	"server-manager/internal/config"
	"server-manager/internal/middleware"
	"server-manager/internal/user"
	"server-manager/internal/server_manager"
	"server-manager/internal/ansible"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Server struct {
	config *config.Config
	router *gin.Engine
	db     *gorm.DB
}

func New(cfg *config.Config) *Server {
	return &Server{
		config: cfg,
		router: gin.New(),
	}
}

func (s *Server) Start() error {
	// 初始化数据库
	if err := s.initDatabase(); err != nil {
		return fmt.Errorf("failed to initialize database: %w", err)
	}

	// 设置Gin模式
	if s.config.Server.Host != "0.0.0.0" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 添加中间件
	s.router.Use(gin.Recovery())
	s.router.Use(middleware.Logger())
	s.router.Use(middleware.CORS())

	// 设置路由
	s.setupRoutes()

	// 创建HTTP服务器
	srv := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", s.config.Server.Host, s.config.Server.Port),
		Handler:      s.router,
		ReadTimeout:  time.Duration(s.config.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(s.config.Server.WriteTimeout) * time.Second,
	}

	// 启动服务器的goroutine
	go func() {
		log.Printf("Server starting on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		return fmt.Errorf("server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
	return nil
}

func (s *Server) initDatabase() error {
	// 使用SQLite作为开发数据库
	var err error
	s.db, err = gorm.Open(sqlite.Open(s.config.Database.Database), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// 自动迁移数据库表
	if err := s.db.AutoMigrate(
		&user.User{},
		&server_manager.Server{},
		&server_manager.ServerGroup{},
		&ansible.AdhocExecution{},
		&ansible.PlaybookExecution{},
		&ansible.Inventory{},
		&ansible.Playbook{},
	); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	// 创建默认管理员用户（如果不存在）
	s.createDefaultAdmin()

	log.Println("Database initialized successfully")
	return nil
}

func (s *Server) createDefaultAdmin() {
	var count int64
	s.db.Model(&user.User{}).Count(&count)
	
	// 如果没有用户，创建默认管理员
	if count == 0 {
		userService := user.NewService(s.db)
		
		// 使用和前端相同的SHA-256哈希算法
		hashedPassword := hashPasswordWithSalt("admin123")
		
		adminReq := &user.CreateUserRequest{
			Username: "admin",
			Email:    "admin@example.com",
			Password: hashedPassword, // 使用预哈希的密码
			Role:     "admin",
		}
		
		if _, err := userService.Create(adminReq); err != nil {
			log.Printf("Warning: Failed to create default admin user: %v", err)
		} else {
			log.Println("Default admin user created: admin/admin123")
		}
	}
}

// hashPasswordWithSalt 使用和前端相同的SHA-256+盐值哈希算法
func hashPasswordWithSalt(password string) string {
	const CLIENT_SALT = "server-manager-2025-secure-salt"
	
	// SHA256(password + salt)
	hasher := sha256.New()
	hasher.Write([]byte(password + CLIENT_SALT))
	hash := hasher.Sum(nil)
	
	// 转换为十六进制字符串
	return hex.EncodeToString(hash)
}

func (s *Server) setupRoutes() {
	// Health check
	s.router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"time":   time.Now(),
		})
	})

	// 初始化服务
	userService := user.NewService(s.db)
	jwtManager := auth.NewJWTManager(
		s.config.Auth.JWTSecret,
		time.Duration(s.config.Auth.TokenDuration)*time.Hour,
	)
	authHandler := auth.NewHandler(userService, jwtManager)

	// 服务器管理服务
	serverManagerService := server_manager.NewService(s.db)
	sshService := server_manager.NewSSHService()
	serverManagerHandler := server_manager.NewHandler(serverManagerService, sshService)

	// Ansible服务
	ansibleExecutor := ansible.NewCommandExecutorWithConfig(s.config)
	ansibleService := ansible.NewAnsibleService(s.db, ansibleExecutor)
	ansibleHandler := ansible.NewHandler(ansibleService)

	// API v1 routes
	v1 := s.router.Group("/api/v1")
	{
		v1.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "pong",
			})
		})

		// 认证路由（无需认证）
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
		}

		// 需要认证的路由
		authenticated := v1.Group("")
		authenticated.Use(func(c *gin.Context) {
			authHeader := c.GetHeader("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid authorization header"})
				c.Abort()
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := jwtManager.ValidateToken(token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
				c.Abort()
				return
			}

			c.Set("user", claims)
			c.Next()
		})
		{
			// 用户资料
			authenticated.GET("/profile", authHandler.GetProfile)
			authenticated.PUT("/profile", authHandler.UpdateProfile)
			authenticated.POST("/change-password", authHandler.ChangePassword)
			authenticated.POST("/refresh-token", authHandler.RefreshToken)

			// 管理员功能
			admin := authenticated.Group("/admin")
			admin.Use(func(c *gin.Context) {
				user, exists := c.Get("user")
				if !exists {
					c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
					c.Abort()
					return
				}
				
				claims := user.(*auth.Claims)
				if claims.Role != "admin" {
					c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
					c.Abort()
					return
				}
				
				c.Next()
			})
			{
				admin.GET("/users", authHandler.GetUsers)
				admin.GET("/users/:id", authHandler.GetUser)
				admin.PUT("/users/:id", authHandler.UpdateUser)
				admin.DELETE("/users/:id", authHandler.DeleteUser)
			}

			// 服务器管理路由（需要认证）
			servers := authenticated.Group("/servers")
			{
				servers.POST("", serverManagerHandler.CreateServer)
				servers.GET("", serverManagerHandler.ListServers)
				servers.GET("/:id", serverManagerHandler.GetServer)
				servers.PUT("/:id", serverManagerHandler.UpdateServer)
				servers.DELETE("/:id", serverManagerHandler.DeleteServer)
				servers.POST("/:id/test", serverManagerHandler.TestServerConnection)
			}

			// 服务器组管理路由（需要认证）
			serverGroups := authenticated.Group("/server-groups")
			{
				serverGroups.POST("", serverManagerHandler.CreateServerGroup)
				serverGroups.GET("", serverManagerHandler.ListServerGroups)
				serverGroups.GET("/:id", serverManagerHandler.GetServerGroup)
				serverGroups.PUT("/:id", serverManagerHandler.UpdateServerGroup)
				serverGroups.DELETE("/:id", serverManagerHandler.DeleteServerGroup)
			}

			// SSH连接测试（不保存服务器）
			authenticated.POST("/test-ssh", serverManagerHandler.TestSSHConnection)
			
			// 服务器统计信息
			authenticated.GET("/server-stats", serverManagerHandler.GetServerStats)

			// Ansible管理路由
			ansibleHandler.RegisterRoutes(authenticated)
		}
	}

	// Serve static files for React app
	s.router.Static("/static", "./web/dist/static")
	s.router.StaticFile("/", "./web/dist/index.html")
	s.router.NoRoute(func(c *gin.Context) {
		c.File("./web/dist/index.html")
	})
}