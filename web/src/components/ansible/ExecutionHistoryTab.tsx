import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdhoc } from '@/hooks/useAnsible'
import { Loader2, RefreshCw, Eye, CheckCircle, AlertCircle, Clock, Terminal } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { AdhocExecution } from '@/services/ansible'

interface ExecutionDetailProps {
  execution: AdhocExecution
  onClose: () => void
}

function ExecutionDetail({ execution, onClose }: ExecutionDetailProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />成功</Badge>
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />失败</Badge>
      case 'running':
        return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />运行中</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />等待中</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          执行详情 #{execution.id}
        </CardTitle>
        <div className="flex items-center gap-2">
          {getStatusBadge(execution.status)}
          <Button variant="outline" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">模块:</span>
            <div className="mt-1 text-muted-foreground">{execution.module}</div>
          </div>
          <div>
            <span className="font-medium">目标主机:</span>
            <div className="mt-1 text-muted-foreground">{execution.hosts}</div>
          </div>
          <div>
            <span className="font-medium">退出码:</span>
            <div className="mt-1">
              <Badge variant={execution.exit_code === 0 ? "default" : "destructive"}>
                {execution.exit_code}
              </Badge>
            </div>
          </div>
          <div>
            <span className="font-medium">持续时间:</span>
            <div className="mt-1 text-muted-foreground">
              {execution.duration ? `${execution.duration}s` : '-'}
            </div>
          </div>
        </div>

        {/* Command */}
        <div>
          <span className="font-medium text-sm">执行命令:</span>
          <pre className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
            {execution.command}
          </pre>
        </div>

        {/* Module Args */}
        {execution.args && (
          <div>
            <span className="font-medium text-sm">模块参数:</span>
            <pre className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
              {execution.args}
            </pre>
          </div>
        )}

        {/* Timing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">开始时间:</span>
            <div className="mt-1 text-muted-foreground">
              {execution.start_time ? new Date(execution.start_time).toLocaleString() : '未开始'}
            </div>
          </div>
          <div>
            <span className="font-medium">结束时间:</span>
            <div className="mt-1 text-muted-foreground">
              {execution.end_time ? new Date(execution.end_time).toLocaleString() : '未结束'}
            </div>
          </div>
        </div>

        {/* Output */}
        {execution.output && (
          <div>
            <span className="font-medium text-sm">标准输出:</span>
            <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
              {execution.output}
            </pre>
          </div>
        )}

        {/* Error Output */}
        {execution.error_output && (
          <div>
            <span className="font-medium text-sm text-red-600">错误输出:</span>
            <pre className="mt-2 p-4 bg-red-50 border border-red-200 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap max-h-64 overflow-y-auto text-red-800">
              {execution.error_output}
            </pre>
          </div>
        )}

        {/* Inventory */}
        {execution.inventory && (
          <div>
            <span className="font-medium text-sm">Inventory:</span>
            <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
              {execution.inventory}
            </pre>
          </div>
        )}

        {/* Extra Variables */}
        {execution.extra_vars && execution.extra_vars !== '{}' && execution.extra_vars !== '' && (
          <div>
            <span className="font-medium text-sm">额外变量:</span>
            <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap">
              {execution.extra_vars}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ExecutionHistoryTab() {
  const { executions, loading, error, refreshExecutions, getExecution } = useAdhoc()
  const [selectedExecution, setSelectedExecution] = useState<AdhocExecution | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    refreshExecutions()
  }, [refreshExecutions])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshExecutions()
    setRefreshing(false)
  }

  const handleViewDetail = async (execution: AdhocExecution) => {
    try {
      // 获取最新的执行详情
      const updated = await getExecution(execution.id)
      setSelectedExecution(updated)
    } catch {
      // 如果获取失败，使用当前的数据
      setSelectedExecution(execution)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />成功</Badge>
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />失败</Badge>
      case 'running':
        return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />运行中</Badge>
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />等待中</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 如果选择了具体执行记录，显示详情
  if (selectedExecution) {
    return (
      <ExecutionDetail 
        execution={selectedExecution} 
        onClose={() => setSelectedExecution(null)} 
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">执行历史</h3>
          <p className="text-sm text-muted-foreground">
            查看所有 Adhoc 命令的执行记录
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          刷新
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Executions Table */}
      <Card>
        <CardContent className="p-0">
          {loading && (!executions || executions.length === 0) ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : (!executions || executions.length === 0) ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              暂无执行记录
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>命令</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>开始时间</TableHead>
                  <TableHead>持续时间</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-mono text-sm">
                      {execution.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {execution.module}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {execution.command}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(execution.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {execution.start_time 
                        ? new Date(execution.start_time).toLocaleString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-sm">
                      {execution.duration ? `${execution.duration}s` : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(execution)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}