import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { AdhocExecutionTab } from '@/components/ansible/AdhocExecutionTab'
import { ExecutionHistoryTab } from '@/components/ansible/ExecutionHistoryTab'
import { InventoryTabWrapper } from '@/components/ansible/InventoryTabWrapper'
import { PlaybookTabWrapper } from '@/components/ansible/PlaybookTabWrapper'
import { useAnsibleSystem } from '@/hooks/useAnsible'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Terminal, LogIn } from 'lucide-react'

export function AnsiblePage() {
  const { systemStatus, loading, error } = useAnsibleSystem()
  const { isAuthenticated } = useAuth()

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Terminal className="h-6 w-6" />
              Ansible 管理
            </h2>
            <p className="text-sm text-muted-foreground">
              执行 Adhoc 命令、管理 Inventory 和 Playbook
            </p>
          </div>
          
          {/* System Status */}
          <div className="flex items-center gap-2">
            {loading ? (
              <Badge variant="outline">检查中...</Badge>
            ) : error ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                检查失败
              </Badge>
            ) : systemStatus?.available ? (
              <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                <CheckCircle className="h-3 w-3" />
                Ansible 可用
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Ansible 不可用
              </Badge>
            )}
          </div>
        </div>

        {/* Login Required Message */}
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <LogIn className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">需要登录</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ansible 功能需要用户认证。请先登录以使用 Adhoc 命令、查看执行历史、管理 Inventory 和 Playbook。
              </p>
            </div>
            <div className="pt-4">
              <Button asChild>
                <Link to="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  前往登录
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            Ansible 管理
          </h2>
          <p className="text-sm text-muted-foreground">
            执行 Adhoc 命令、管理 Inventory 和 Playbook
          </p>
        </div>
        
        {/* System Status */}
        <div className="flex items-center gap-2">
          {loading ? (
            <Badge variant="outline">检查中...</Badge>
          ) : error ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              检查失败
            </Badge>
          ) : systemStatus?.available ? (
            <Badge variant="default" className="flex items-center gap-1 bg-green-600">
              <CheckCircle className="h-3 w-3" />
              Ansible 可用
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Ansible 不可用
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <Tabs defaultValue="adhoc" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="adhoc">Adhoc 命令</TabsTrigger>
            <TabsTrigger value="history">执行历史</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="playbook">Playbook</TabsTrigger>
          </TabsList>
          
          <TabsContent value="adhoc" className="space-y-4 mt-0 p-6">
            <AdhocExecutionTab />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-0 p-6">
            <ExecutionHistoryTab />
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-4 mt-0 p-6">
            <InventoryTabWrapper />
          </TabsContent>
          
          <TabsContent value="playbook" className="space-y-4 mt-0 p-6">
            <PlaybookTabWrapper />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}