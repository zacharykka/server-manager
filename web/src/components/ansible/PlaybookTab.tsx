import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { usePlaybook } from '@/hooks/useAnsible'
import { Loader2, Plus, Edit, Trash2, FileCode, AlertCircle, Play } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Playbook } from '@/services/ansible'

interface PlaybookFormData {
  name: string
  description: string
  content: string
  variables: string // JSON string
}

interface PlaybookFormProps {
  playbook?: Playbook
  onSubmit: (data: PlaybookFormData) => Promise<void>
  onCancel: () => void
  loading: boolean
}

function PlaybookForm({ playbook, onSubmit, onCancel, loading }: PlaybookFormProps) {
  const [formData, setFormData] = useState<PlaybookFormData>({
    name: playbook?.name || '',
    description: playbook?.description || '',
    content: playbook?.content || `---
- name: Example Playbook
  hosts: all
  become: yes
  tasks:
    - name: Update package cache
      apt:
        update_cache: yes
      when: ansible_os_family == "Debian"
    
    - name: Install nginx
      package:
        name: nginx
        state: present
    
    - name: Start and enable nginx
      service:
        name: nginx
        state: started
        enabled: yes`,
    variables: playbook?.variables ? JSON.stringify(playbook.variables, null, 2) : '{}'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证 variables 是否为有效 JSON
    try {
      const variables = formData.variables.trim()
      if (variables && variables !== '{}') {
        JSON.parse(variables)
      }
    } catch (error) {
      alert('Variables 字段必须是有效的 JSON 格式')
      return
    }
    
    onSubmit(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {playbook ? '编辑 Playbook' : '创建 Playbook'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称 *</Label>
              <Input
                id="name"
                placeholder="Playbook 名称"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                placeholder="Playbook 描述"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Playbook 内容 (YAML) *</Label>
            <Textarea
              id="content"
              rows={15}
              placeholder="输入 Playbook YAML 内容..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              使用标准的 Ansible Playbook YAML 格式
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variables">变量 (JSON)</Label>
            <Textarea
              id="variables"
              rows={6}
              placeholder='{"var1": "value1", "var2": "value2"}'
              value={formData.variables}
              onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              JSON 格式的变量定义，将作为额外变量传递给 Playbook
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                playbook ? '更新' : '创建'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function PlaybookTab() {
  const { playbooks, loading, error, createPlaybook, updatePlaybook, deletePlaybook } = usePlaybook()
  const [showForm, setShowForm] = useState(false)
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handleCreatePlaybook = async (data: PlaybookFormData) => {
    setActionLoading(true)
    try {
      let variables: Record<string, any> | undefined
      const varsString = data.variables.trim()
      if (varsString && varsString !== '{}') {
        try {
          variables = JSON.parse(varsString)
        } catch (error) {
          throw new Error('Variables 必须是有效的 JSON 格式')
        }
      }

      await createPlaybook({
        name: data.name,
        description: data.description,
        content: data.content,
        variables
      })
      setShowForm(false)
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdatePlaybook = async (data: PlaybookFormData) => {
    if (!editingPlaybook) return
    
    setActionLoading(true)
    try {
      let variables: Record<string, any> | undefined
      const varsString = data.variables.trim()
      if (varsString && varsString !== '{}') {
        try {
          variables = JSON.parse(varsString)
        } catch (error) {
          throw new Error('Variables 必须是有效的 JSON 格式')
        }
      }

      await updatePlaybook(editingPlaybook.id, {
        name: data.name,
        description: data.description,
        content: data.content,
        variables
      })
      setEditingPlaybook(null)
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePlaybook = async (playbook: Playbook) => {
    try {
      await deletePlaybook(playbook.id)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleEdit = (playbook: Playbook) => {
    setEditingPlaybook(playbook)
    setShowForm(false)
  }

  const handleCancelEdit = () => {
    setEditingPlaybook(null)
    setShowForm(false)
  }

  const handleExecutePlaybook = (playbook: Playbook) => {
    // TODO: 实现 Playbook 执行功能
    alert(`执行 Playbook "${playbook.name}" 功能即将到来！`)
  }

  // Show form when creating or editing
  if (showForm || editingPlaybook) {
    return (
      <PlaybookForm
        playbook={editingPlaybook || undefined}
        onSubmit={editingPlaybook ? handleUpdatePlaybook : handleCreatePlaybook}
        onCancel={handleCancelEdit}
        loading={actionLoading}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Playbook 管理</h3>
          <p className="text-sm text-muted-foreground">
            管理和执行 Ansible Playbook
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建 Playbook
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

      {/* Playbooks List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : playbooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileCode className="h-12 w-12 mb-4" />
              <p>暂无 Playbook</p>
              <p className="text-sm">点击上方按钮创建第一个 Playbook</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="w-32">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playbooks.map((playbook) => (
                  <TableRow key={playbook.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{playbook.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {playbook.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(playbook.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(playbook.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExecutePlaybook(playbook)}
                          className="text-green-600 hover:text-green-700"
                          title="执行 Playbook"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(playbook)}
                          title="编辑 Playbook"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              title="删除 Playbook"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除 Playbook "{playbook.name}" 吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePlaybook(playbook)}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}