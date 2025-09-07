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

interface RegisterFormProps {
  onRegister?: (userData: { 
    username: string
    email: string 
    password: string 
  }) => void
  loading?: boolean
}

export function RegisterForm({ onRegister, loading = false }: RegisterFormProps) {
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = React.useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const validateForm = () => {
    const newErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    }

    if (!formData.username.trim()) {
      newErrors.username = "用户名不能为空"
    } else if (formData.username.length < 3) {
      newErrors.username = "用户名至少3个字符"
    }

    if (!formData.email.trim()) {
      newErrors.email = "邮箱不能为空"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "邮箱格式不正确"
    }

    if (!formData.password.trim()) {
      newErrors.password = "密码不能为空"
    } else if (formData.password.length < 6) {
      newErrors.password = "密码至少6个字符"
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "请确认密码"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次密码输入不一致"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onRegister?.({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">注册账号</CardTitle>
        <CardDescription>
          创建一个新账号来使用Server Manager
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.username && (
              <span className="text-sm text-red-600">{errors.username}</span>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="请输入邮箱地址"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.email && (
              <span className="text-sm text-red-600">{errors.email}</span>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="请输入密码 (至少6位)"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.password && (
              <span className="text-sm text-red-600">{errors.password}</span>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.confirmPassword && (
              <span className="text-sm text-red-600">{errors.confirmPassword}</span>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "注册中..." : "注册"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}