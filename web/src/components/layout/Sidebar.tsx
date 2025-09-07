import * as React from "react"
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

interface NavItem {
  title: string
  href: string
  icon?: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    title: '仪表板',
    href: '/dashboard',
  },
  {
    title: '服务器管理',
    href: '/servers',
  },
  {
    title: 'Ansible',
    href: '/ansible',
  },
  {
    title: '任务历史',
    href: '/tasks',
  },
  {
    title: '用户管理',
    href: '/admin/users',
    adminOnly: true,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  )

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-gray-200", className)}>
      {/* Logo */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">
          Server Manager
        </h2>
        <p className="text-sm text-gray-600">
          服务器管理平台
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                {item.icon && (
                  <span className="mr-3 flex-shrink-0">
                    {item.icon}
                  </span>
                )}
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.username}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {user?.role === 'admin' ? '管理员' : '用户'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-1"
          >
            <Link to="/profile">
              资料
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex-1"
          >
            退出
          </Button>
        </div>
      </div>
    </div>
  )
}