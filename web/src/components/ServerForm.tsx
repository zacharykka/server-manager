import * as React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useServers, useServerGroups, useSSHTest } from '@/hooks/useServer'
import type { CreateServerRequest, UpdateServerRequest } from '@/services/server'

interface ServerFormProps {
  serverId?: number
  onSave?: () => void
  onCancel?: () => void
}

export function ServerForm({ serverId, onSave, onCancel }: ServerFormProps) {
  const navigate = useNavigate()
  const [authMethod, setAuthMethod] = useState<'password' | 'key'>('password')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Hooks
  const { createServer, updateServer, servers, loading: serversLoading } = useServers()
  const { groups, loading: groupsLoading } = useServerGroups()
  const { testConnection, testing, result: testResult, error: testError } = useSSHTest()

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    private_key: '',
    description: '',
    os: '',
    group_id: undefined as number | undefined,
    tags: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 如果是编辑模式，加载服务器数据
  useEffect(() => {
    if (serverId && servers.length > 0) {
      const server = servers.find(s => s.id === serverId)
      if (server) {
        setFormData({
          name: server.name,
          host: server.host,
          port: server.port,
          username: server.username,
          password: '', // 密码不回填，保持安全
          private_key: '', // 私钥不回填，保持安全
          description: server.description,
          os: server.os,
          group_id: server.group_id,
          tags: server.tags
        })
      }
    }
  }, [serverId, servers])

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '服务器名称不能为空'
    }

    if (!formData.host.trim()) {
      newErrors.host = 'IP地址或域名不能为空'
    } else {
      // 简单的IP和域名验证
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.?[a-zA-Z0-9]*$/
      if (!ipRegex.test(formData.host) && !domainRegex.test(formData.host)) {
        newErrors.host = '请输入有效的IP地址或域名'
      }
    }

    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      newErrors.port = '端口号必须在1-65535之间'
    }

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空'
    }

    if (authMethod === 'password' && !formData.password.trim()) {
      newErrors.password = '密码不能为空'
    }

    if (authMethod === 'key' && !formData.private_key.trim()) {
      newErrors.private_key = '私钥不能为空'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理输入变化
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // 清除相关字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // 测试连接
  const handleTestConnection = async () => {
    if (!formData.host || !formData.username) {
      setErrors({ test: '请先填写主机地址和用户名' })
      return
    }

    const testData = {
      host: formData.host,
      port: formData.port,
      username: formData.username,
      ...(authMethod === 'password' ? { password: formData.password } : { private_key: formData.private_key })
    }

    await testConnection(testData)
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const requestData: CreateServerRequest | UpdateServerRequest = {
        name: formData.name.trim(),
        host: formData.host.trim(),
        port: formData.port,
        username: formData.username.trim(),
        description: formData.description.trim(),
        os: formData.os.trim(),
        tags: formData.tags.trim(),
        ...(formData.group_id && { group_id: formData.group_id }),
        ...(authMethod === 'password' ? { password: formData.password } : { private_key: formData.private_key })
      }

      let success = false
      if (serverId) {
        // 更新服务器
        const result = await updateServer(serverId, requestData)
        success = result !== null
      } else {
        // 创建服务器
        const result = await createServer(requestData as CreateServerRequest)
        success = result !== null
      }

      if (success) {
        if (onSave) {
          onSave()
        } else {
          navigate('/servers')
        }
      }
    } catch (error) {
      console.error('提交服务器表单失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 取消操作
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate('/servers')
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {serverId ? '编辑服务器' : '添加服务器'}
        </h1>
        <p className="text-gray-600">
          {serverId ? '修改服务器配置信息' : '添加新的服务器到管理平台'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>配置服务器的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">服务器名称 *</Label>
                  <Input
                    id="name"
                    placeholder="输入服务器名称"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="host">IP地址/域名 *</Label>
                  <Input
                    id="host"
                    placeholder="192.168.1.100 或 example.com"
                    value={formData.host}
                    onChange={(e) => handleInputChange('host', e.target.value)}
                    className={errors.host ? 'border-red-500' : ''}
                  />
                  {errors.host && <p className="text-sm text-red-500 mt-1">{errors.host}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="port">SSH端口 *</Label>
                  <Input
                    id="port"
                    type="number"
                    min="1"
                    max="65535"
                    value={formData.port}
                    onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                    className={errors.port ? 'border-red-500' : ''}
                  />
                  {errors.port && <p className="text-sm text-red-500 mt-1">{errors.port}</p>}
                </div>
                <div>
                  <Label htmlFor="username">用户名 *</Label>
                  <Input
                    id="username"
                    placeholder="root, ubuntu, admin等"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={errors.username ? 'border-red-500' : ''}
                  />
                  {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="description">服务器描述</Label>
                <Textarea
                  id="description"
                  placeholder="输入服务器描述信息（可选）"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 认证信息 */}
          <Card>
            <CardHeader>
              <CardTitle>认证信息</CardTitle>
              <CardDescription>配置SSH连接认证方式</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={authMethod} onValueChange={(value: 'password' | 'key') => setAuthMethod(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="password">密码认证</TabsTrigger>
                  <TabsTrigger value="key">密钥认证</TabsTrigger>
                </TabsList>
                <TabsContent value="password" className="mt-4">
                  <div>
                    <Label htmlFor="password">SSH密码 *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="输入SSH登录密码"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                  </div>
                </TabsContent>
                <TabsContent value="key" className="mt-4">
                  <div>
                    <Label htmlFor="private_key">SSH私钥 *</Label>
                    <Textarea
                      id="private_key"
                      placeholder="粘贴SSH私钥内容（-----BEGIN RSA PRIVATE KEY-----开头）"
                      value={formData.private_key}
                      onChange={(e) => handleInputChange('private_key', e.target.value)}
                      rows={6}
                      className={errors.private_key ? 'border-red-500' : ''}
                    />
                    {errors.private_key && <p className="text-sm text-red-500 mt-1">{errors.private_key}</p>}
                    <p className="text-sm text-gray-600 mt-1">
                      请确保私钥格式正确，支持RSA、DSA、ECDSA等格式
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* 连接测试 */}
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">连接测试</h4>
                    <p className="text-sm text-gray-600">测试SSH连接是否正常</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing}
                  >
                    {testing ? '测试中...' : '🔍 测试连接'}
                  </Button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>{testResult.success ? '✅' : '❌'}</span>
                      <span className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {testResult.message}
                      </span>
                    </div>
                    {testResult.success && testResult.os_info && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>系统信息:</strong> {testResult.os_info}</p>
                        {testResult.uptime && <p><strong>运行时间:</strong> {testResult.uptime}</p>}
                        {testResult.latency_ms && <p><strong>延迟:</strong> {testResult.latency_ms}ms</p>}
                      </div>
                    )}
                  </div>
                )}

                {testError && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2">
                      <span>❌</span>
                      <span className="font-medium text-red-700">{testError}</span>
                    </div>
                  </div>
                )}

                {errors.test && (
                  <p className="text-sm text-red-500 mt-2">{errors.test}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 高级设置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>高级设置</CardTitle>
                  <CardDescription>可选的高级配置选项</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? '收起' : '展开'}
                </Button>
              </div>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="os">操作系统</Label>
                    <Select value={formData.os} onValueChange={(value) => handleInputChange('os', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择操作系统" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                        <SelectItem value="CentOS">CentOS</SelectItem>
                        <SelectItem value="Debian">Debian</SelectItem>
                        <SelectItem value="RHEL">Red Hat Enterprise Linux</SelectItem>
                        <SelectItem value="Windows">Windows Server</SelectItem>
                        <SelectItem value="macOS">macOS</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="group_id">服务器组</Label>
                    <Select 
                      value={formData.group_id?.toString() || ''} 
                      onValueChange={(value) => handleInputChange('group_id', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择服务器组" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">不分组</SelectItem>
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
                </div>

                <div>
                  <Label htmlFor="tags">标签</Label>
                  <Input
                    id="tags"
                    placeholder="输入标签，多个标签用逗号分隔，如：web,production,nginx"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    标签可以帮助您更好地组织和筛选服务器
                  </p>
                  {formData.tags && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.split(',').map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || testing}
              className="min-w-24"
            >
              {isSubmitting ? '保存中...' : (serverId ? '更新服务器' : '添加服务器')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting || testing}
            >
              取消
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}