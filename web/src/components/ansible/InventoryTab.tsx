import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useInventory } from '@/hooks/useAnsible'
import { Loader2, Plus, Edit, Trash2, Star, FileText, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Inventory } from '@/services/ansible'

interface InventoryFormData {
  name: string
  description: string
  content: string
  is_default: boolean
}

interface InventoryFormProps {
  inventory?: Inventory
  onSubmit: (data: InventoryFormData) => Promise<void>
  onCancel: () => void
  loading: boolean
}

function InventoryForm({ inventory, onSubmit, onCancel, loading }: InventoryFormProps) {
  const [formData, setFormData] = useState<InventoryFormData>({
    name: inventory?.name || '',
    description: inventory?.description || '',
    content: inventory?.content || 'localhost ansible_connection=local',
    is_default: inventory?.is_default || false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {inventory ? '编辑 Inventory' : '创建 Inventory'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名称 *</Label>
            <Input
              id="name"
              placeholder="Inventory 名称"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Input
              id="description"
              placeholder="Inventory 描述"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">内容 *</Label>
            <Textarea
              id="content"
              rows={10}
              placeholder={`# Inventory 内容 (INI 格式)
localhost ansible_connection=local

[webservers]
web1 ansible_host=192.168.1.10
web2 ansible_host=192.168.1.11

[dbservers]
db1 ansible_host=192.168.1.20`}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              使用 Ansible INI 格式定义主机清单
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="is_default" className="text-sm">
              设为默认 Inventory
            </Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                inventory ? '更新' : '创建'
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

export function InventoryTab() {
  const { inventories, loading, error, createInventory, updateInventory, deleteInventory } = useInventory()
  const [showForm, setShowForm] = useState(false)
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handleCreateInventory = async (data: InventoryFormData) => {
    setActionLoading(true)
    try {
      await createInventory(data)
      setShowForm(false)
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateInventory = async (data: InventoryFormData) => {
    if (!editingInventory) return
    
    setActionLoading(true)
    try {
      await updateInventory(editingInventory.id, data)
      setEditingInventory(null)
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteInventory = async (inventory: Inventory) => {
    try {
      await deleteInventory(inventory.id)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleEdit = (inventory: Inventory) => {
    setEditingInventory(inventory)
    setShowForm(false)
  }

  const handleCancelEdit = () => {
    setEditingInventory(null)
    setShowForm(false)
  }

  // Show form when creating or editing
  if (showForm || editingInventory) {
    return (
      <InventoryForm
        inventory={editingInventory || undefined}
        onSubmit={editingInventory ? handleUpdateInventory : handleCreateInventory}
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
          <h3 className="text-lg font-medium">Inventory 管理</h3>
          <p className="text-sm text-muted-foreground">
            管理主机清单，定义目标主机和组
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建 Inventory
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

      {/* Inventories List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : inventories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <p>暂无 Inventory</p>
              <p className="text-sm">点击上方按钮创建第一个 Inventory</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>默认</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventories.map((inventory) => (
                  <TableRow key={inventory.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{inventory.name}</span>
                        {inventory.is_default && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            默认
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {inventory.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {inventory.is_default ? (
                        <Badge variant="default" className="bg-green-600">是</Badge>
                      ) : (
                        <Badge variant="outline">否</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(inventory.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(inventory)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除 Inventory "{inventory.name}" 吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteInventory(inventory)}
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