import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/services/auth'

export function ProfilePage() {
  const { user, refreshUserProfile } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [error, setError] = React.useState('')

  // Email update form
  const [emailData, setEmailData] = React.useState({
    email: user?.email || ''
  })

  // Password change form
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [passwordErrors, setPasswordErrors] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  React.useEffect(() => {
    if (user?.email) {
      setEmailData({ email: user.email })
    }
  }, [user])

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await authApi.updateProfile({ email: emailData.email })
      if (response.success) {
        setMessage('邮箱更新成功')
        await refreshUserProfile()
      } else {
        setError(response.message || '邮箱更新失败')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '邮箱更新失败')
    } finally {
      setLoading(false)
    }
  }

  const validatePasswordForm = () => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = '请输入当前密码'
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = '请输入新密码'
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = '新密码至少6个字符'
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = '请确认新密码'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = '两次密码输入不一致'
    }

    setPasswordErrors(errors)
    return !Object.values(errors).some(error => error !== '')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) {
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await authApi.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      })
      
      if (response.success) {
        setMessage('密码修改成功')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setError(response.message || '密码修改失败')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (passwordErrors[name as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">用户资料</h1>
        <p className="text-gray-600">管理您的账号信息和安全设置</p>
      </div>

      {(message || error) && (
        <div className={`mb-6 p-4 rounded-md ${
          message ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message || error}
        </div>
      )}

      <div className="grid gap-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>查看您的账号基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>用户名</Label>
              <Input value={user?.username || ''} disabled />
            </div>
            <div className="grid gap-2">
              <Label>角色</Label>
              <Input value={user?.role || ''} disabled />
            </div>
            <div className="grid gap-2">
              <Label>注册时间</Label>
              <Input 
                value={user?.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : ''} 
                disabled 
              />
            </div>
          </CardContent>
        </Card>

        {/* 邮箱管理 */}
        <Card>
          <CardHeader>
            <CardTitle>邮箱管理</CardTitle>
            <CardDescription>更新您的邮箱地址</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ email: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? '更新中...' : '更新邮箱'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 密码管理 */}
        <Card>
          <CardHeader>
            <CardTitle>密码管理</CardTitle>
            <CardDescription>修改您的登录密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">当前密码</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  disabled={loading}
                  required
                />
                {passwordErrors.currentPassword && (
                  <span className="text-sm text-destructive">{passwordErrors.currentPassword}</span>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  disabled={loading}
                  required
                />
                {passwordErrors.newPassword && (
                  <span className="text-sm text-destructive">{passwordErrors.newPassword}</span>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  disabled={loading}
                  required
                />
                {passwordErrors.confirmPassword && (
                  <span className="text-sm text-destructive">{passwordErrors.confirmPassword}</span>
                )}
              </div>
              
              <Button type="submit" disabled={loading}>
                {loading ? '修改中...' : '修改密码'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}