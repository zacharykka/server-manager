import * as React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useServers, useServerGroups } from '@/hooks/useServer'
import type { Server, ServerGroup } from '@/services/server'

export function ServersPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 构建查询参数
  const queryParams = {
    page: currentPage,
    limit: pageSize,
    ...(searchTerm && { search: searchTerm }),
    ...(selectedGroup && selectedGroup !== "all" && { group_id: parseInt(selectedGroup) })
  }

  const {
    servers,
    loading: serversLoading,
    error: serversError,
    pagination,
    fetchServers,
    deleteServer,
    testConnection,
    clearError: clearServersError
  } = useServers(queryParams)

  const {
    groups,
    loading: groupsLoading,
    error: groupsError
  } = useServerGroups()

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // 重置到第一页
  }

  // 处理分组筛选
  const handleGroupFilter = (value: string) => {
    setSelectedGroup(value)
    setCurrentPage(1) // 重置到第一页
  }

  // 处理删除服务器
  const handleDeleteServer = async (id: number, name: string) => {
    const success = await deleteServer(id)
    if (success) {
      // 删除成功，列表会自动刷新
    }
  }

  // 处理测试连接
  const handleTestConnection = async (id: number) => {
    await testConnection(id)
    // 连接测试完成，列表会自动刷新以更新状态
  }

  // 获取状态显示
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-500">在线</Badge>
      case 'offline':
        return <Badge variant="destructive">离线</Badge>
      case 'unknown':
      default:
        return <Badge variant="secondary">未知</Badge>
    }
  }

  // 获取操作系统图标
  const getOSIcon = (os: string) => {
    const osLower = os.toLowerCase()
    if (osLower.includes('ubuntu') || osLower.includes('debian')) return '🐧'
    if (osLower.includes('centos') || osLower.includes('redhat') || osLower.includes('rhel')) return '🔴'
    if (osLower.includes('windows')) return '🪟'
    if (osLower.includes('macos') || osLower.includes('darwin')) return '🍎'
    return '💻'
  }

  // 计算分页信息
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const startItem = (pagination.page - 1) * pagination.limit + 1
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="container mx-auto py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">服务器管理</h1>
          <p className="text-gray-600">管理您的服务器资源</p>
        </div>
        <Button asChild>
          <Link to="/servers/add">
            ➕ 添加服务器
          </Link>
        </Button>
      </div>

      {/* 筛选和搜索 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>筛选和搜索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">搜索服务器</label>
              <Input
                placeholder="搜索服务器名称、IP地址..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">服务器组</label>
              <Select value={selectedGroup} onValueChange={handleGroupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择服务器组" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部服务器组</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSelectedGroup("")
                setCurrentPage(1)
              }}
            >
              🔄 重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {(serversError || groupsError) && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <span>⚠️</span>
                <span>{serversError || groupsError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearServersError()
                  fetchServers()
                }}
              >
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 服务器列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>服务器列表</CardTitle>
              <CardDescription>
                {serversLoading ? "加载中..." : `显示 ${startItem}-${endItem} 项，共 ${pagination.total} 项`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">每页</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {serversLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">加载服务器列表中...</p>
              </div>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🖥️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无服务器</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedGroup ? "没有找到符合条件的服务器" : "您还没有添加任何服务器"}
              </p>
              <Button asChild>
                <Link to="/servers/add">
                  ➕ 添加第一台服务器
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>服务器信息</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead>操作系统</TableHead>
                    <TableHead>服务器组</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>标签</TableHead>
                    <TableHead>最后更新</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servers.map((server) => (
                    <TableRow key={server.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{server.name}</div>
                          {server.description && (
                            <div className="text-sm text-gray-600 mt-1">{server.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {server.host}:{server.port}
                        </div>
                        <div className="text-xs text-gray-600">{server.username}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getOSIcon(server.os)}</span>
                          <span className="text-sm">{server.os}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {server.group ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: server.group.color }}
                            />
                            <span className="text-sm">{server.group.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">未分组</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(server.status)}
                      </TableCell>
                      <TableCell>
                        {server.tags ? (
                          <div className="flex flex-wrap gap-1">
                            {server.tags.split(',').map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">无标签</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(server.updated_at).toLocaleString('zh-CN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(server.id)}
                          >
                            🔍 测试
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/servers/${server.id}/edit`}>
                              ✏️ 编辑
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                🗑️ 删除
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>确认删除服务器</AlertDialogTitle>
                                <AlertDialogDescription>
                                  您确定要删除服务器 "{server.name}" 吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteServer(server.id, server.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 分页控件 */}
          {servers.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                显示第 {startItem} 到 {endItem} 项，共 {pagination.total} 项
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ← 上一页
                </Button>
                
                {/* 页码按钮 */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber: number
                    if (totalPages <= 5) {
                      pageNumber = i + 1
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="w-8"
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  下一页 →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}