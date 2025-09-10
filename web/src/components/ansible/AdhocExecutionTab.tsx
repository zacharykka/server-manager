import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdhoc, useAnsibleSystem, useInventory } from '@/hooks/useAnsible'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, AlertCircle, CheckCircle, Clock, Server } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function AdhocExecutionTab() {
  const { executeAdhoc, loading, error } = useAdhoc()
  const { modules, getModules } = useAnsibleSystem()
  const { inventories, getDefaultInventory } = useInventory()
  
  const [formData, setFormData] = useState({
    module: '',
    args: '',
    hosts: '',
    inventory: 'localhost ansible_connection=local', // Set default value directly
    extra_vars: '{}'
  })
  const [lastExecution, setLastExecution] = useState<any>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)

  useEffect(() => {
    getModules()
    // Only initialize default inventory if user is authenticated
    // This prevents 404 loops when user is not logged in
  }, [getModules])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setExecutionError(null)
    
    try {
      let extraVars: Record<string, any> = {}
      if (formData.extra_vars.trim()) {
        try {
          extraVars = JSON.parse(formData.extra_vars)
        } catch (err) {
          throw new Error('Extra Variables 必须是有效的 JSON 格式')
        }
      }

      const execution = await executeAdhoc({
        module: formData.module,
        args: formData.args || undefined,
        hosts: formData.hosts || 'all',
        inventory: formData.inventory || undefined,
        extra_vars: Object.keys(extraVars).length > 0 ? extraVars : undefined
      })

      setLastExecution(execution)
      
      // 重置表单（除了inventory）
      setFormData(prev => ({
        ...prev,
        module: '',
        args: '',
        hosts: '',
        extra_vars: '{}'
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '执行失败'
      setExecutionError(errorMessage)
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

  return (
    <div className="space-y-6">
      {/* Execution Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            执行 Adhoc 命令
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Module Selection */}
              <div className="space-y-2">
                <Label htmlFor="module">Ansible 模块 *</Label>
                <Select 
                  value={formData.module} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, module: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择模块" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.name} value={module.name}>
                        <div>
                          <div className="font-medium">{module.name}</div>
                          <div className="text-sm text-muted-foreground">{module.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hosts */}
              <div className="space-y-2">
                <Label htmlFor="hosts">目标主机</Label>
                <Input
                  id="hosts"
                  placeholder="all, localhost, group1, etc."
                  value={formData.hosts}
                  onChange={(e) => setFormData(prev => ({ ...prev, hosts: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  留空则默认为 "all"
                </p>
              </div>
            </div>

            {/* Module Arguments */}
            <div className="space-y-2">
              <Label htmlFor="args">模块参数</Label>
              <Input
                id="args"
                placeholder="例如：name=nginx state=present"
                value={formData.args}
                onChange={(e) => setFormData(prev => ({ ...prev, args: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                模块的具体参数，格式取决于所选模块
              </p>
            </div>

            {/* Inventory */}
            <div className="space-y-2">
              <Label htmlFor="inventory">Inventory</Label>
              <Textarea
                id="inventory"
                rows={4}
                placeholder="localhost ansible_connection=local"
                value={formData.inventory}
                onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                主机清单，支持 INI 格式
              </p>
            </div>

            {/* Extra Variables */}
            <div className="space-y-2">
              <Label htmlFor="extra_vars">额外变量 (JSON)</Label>
              <Textarea
                id="extra_vars"
                rows={3}
                placeholder="{}"
                value={formData.extra_vars}
                onChange={(e) => setFormData(prev => ({ ...prev, extra_vars: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                JSON 格式的额外变量，例如：{"{"}"var1": "value1", "var2": "value2"{"}"}
              </p>
            </div>

            {/* Error Display */}
            {(error || executionError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || executionError}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={loading || !formData.module} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  执行中...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  执行命令
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Last Execution Result */}
      {lastExecution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                最近执行结果
              </span>
              {getStatusBadge(lastExecution.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Execution Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">命令:</span>
                <div className="mt-1 p-2 bg-muted rounded font-mono text-xs">
                  {lastExecution.command}
                </div>
              </div>
              <div>
                <span className="font-medium">执行时间:</span>
                <div className="mt-1 text-muted-foreground">
                  {lastExecution.start_time ? new Date(lastExecution.start_time).toLocaleString() : '未开始'}
                </div>
              </div>
              <div>
                <span className="font-medium">退出码:</span>
                <div className="mt-1">
                  <Badge variant={lastExecution.exit_code === 0 ? "default" : "destructive"}>
                    {lastExecution.exit_code}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Output */}
            {lastExecution.output && (
              <div>
                <span className="font-medium text-sm">输出:</span>
                <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                  {lastExecution.output}
                </pre>
              </div>
            )}

            {/* Error Output */}
            {lastExecution.error_output && (
              <div>
                <span className="font-medium text-sm text-red-600">错误输出:</span>
                <pre className="mt-2 p-4 bg-red-50 border border-red-200 rounded text-xs overflow-x-auto font-mono whitespace-pre-wrap text-red-800">
                  {lastExecution.error_output}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}