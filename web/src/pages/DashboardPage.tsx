import * as React from "react"
import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from '@/hooks/useAuth'
import { useServerStats } from '@/hooks/useServer'
import { useAnsibleSystem } from '@/hooks/useAnsible'
import { useSystemStatus } from '@/hooks/useSystemStatus'

export function DashboardPage() {
  const { user } = useAuth()
  const { stats, loading: statsLoading } = useServerStats()
  const { systemStatus: ansibleSystemStatus, loading: ansibleLoading, error: ansibleError } = useAnsibleSystem()
  const { systemStatus, loading: systemStatusLoading, refreshSystemStatus } = useSystemStatus()

  // 获取状态显示的通用函数
  const getStatusDisplay = (status: 'online' | 'offline' | 'unknown', loading = false, message?: string) => {
    if (loading) {
      return { text: '● 检查中...', color: 'text-blue-600', title: '正在检查状态...' }
    }
    
    switch (status) {
      case 'online':
        return { text: '● 正常', color: 'text-green-600', title: message || '服务正常运行' }
      case 'offline':
        return { text: '● 异常', color: 'text-red-600', title: message || '服务不可用' }
      case 'unknown':
      default:
        return { text: '● 未知', color: 'text-gray-600', title: message || '状态未知' }
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          欢迎回来, {user?.username}!
        </h1>
        <p className="text-gray-600">
          服务器管理平台仪表板
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 服务器统计 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">服务器总数</CardTitle>
            <div className="h-4 w-4 text-gray-600">🖥️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.total_servers || 0}
            </div>
            <p className="text-xs text-gray-600">
              {stats?.total_servers > 0 ? `共 ${stats.total_servers} 台服务器` : '暂无服务器'}
            </p>
          </CardContent>
        </Card>

        {/* 在线服务器 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在线服务器</CardTitle>
            <div className="h-4 w-4 text-gray-600">✅</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.status_stats?.online || 0}
            </div>
            <p className="text-xs text-gray-600">
              {stats?.status_stats?.online > 0 ? '服务器运行正常' : '暂无在线服务器'}
            </p>
          </CardContent>
        </Card>

        {/* 最近任务 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最近任务</CardTitle>
            <div className="h-4 w-4 text-gray-600">📋</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-600">
              暂无执行任务
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* 系统状态 */}
        <Card>
          <CardHeader>
            <CardTitle>系统状态</CardTitle>
            <CardDescription>服务器管理平台运行状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">后端服务</span>
              <span 
                className={`text-sm cursor-help ${getStatusDisplay(systemStatus?.backend.status || 'unknown', systemStatusLoading, systemStatus?.backend.message).color}`}
                title={getStatusDisplay(systemStatus?.backend.status || 'unknown', systemStatusLoading, systemStatus?.backend.message).title}
              >
                {getStatusDisplay(systemStatus?.backend.status || 'unknown', systemStatusLoading, systemStatus?.backend.message).text}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">数据库连接</span>
              <span 
                className={`text-sm cursor-help ${getStatusDisplay(systemStatus?.database.status || 'unknown', systemStatusLoading, systemStatus?.database.message).color}`}
                title={getStatusDisplay(systemStatus?.database.status || 'unknown', systemStatusLoading, systemStatus?.database.message).title}
              >
                {getStatusDisplay(systemStatus?.database.status || 'unknown', systemStatusLoading, systemStatus?.database.message).text}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ansible</span>
              <span 
                className={`text-sm cursor-help ${getStatusDisplay(systemStatus?.ansible.status || 'unknown', systemStatusLoading, systemStatus?.ansible.message).color}`}
                title={getStatusDisplay(systemStatus?.ansible.status || 'unknown', systemStatusLoading, systemStatus?.ansible.message).title}
              >
                {getStatusDisplay(systemStatus?.ansible.status || 'unknown', systemStatusLoading, systemStatus?.ansible.message).text}
              </span>
            </div>
            {systemStatus && (
              <div className="pt-2 border-t">
                <button
                  onClick={refreshSystemStatus}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={systemStatusLoading}
                >
                  🔄 {systemStatusLoading ? '检查中...' : '刷新状态'}
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能快捷入口</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Link
                to="/servers"
                className="flex items-center p-3 text-sm rounded-md border hover:bg-accent transition-colors"
              >
                <span className="mr-3">🖥️</span>
                <span>管理服务器</span>
              </Link>
              <Link
                to="/ansible"
                className="flex items-center p-3 text-sm rounded-md border hover:bg-accent transition-colors"
              >
                <span className="mr-3">⚡</span>
                <span>执行Adhoc命令</span>
              </Link>
              <Link
                to="/tasks"
                className="flex items-center p-3 text-sm rounded-md border hover:bg-accent transition-colors"
              >
                <span className="mr-3">📋</span>
                <span>查看任务历史</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}