import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useAuth } from '@/hooks/useAuth'

export function RegisterPage() {
  const { register, loading, error, clearError, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleRegister = async (userData: { 
    username: string
    email: string 
    password: string 
  }) => {
    const result = await register(userData)
    if (result.success) {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Server Manager
          </h1>
          <p className="text-gray-600">
            创建账号开始管理您的服务器
          </p>
        </div>

        <RegisterForm 
          onRegister={handleRegister}
          loading={loading}
        />

        {error && (
          <div className="text-center">
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
              <button 
                onClick={clearError}
                className="ml-2 underline hover:no-underline"
              >
                清除
              </button>
            </p>
          </div>
        )}

        <div className="text-center text-sm">
          <span className="text-gray-600">已经有账号了？</span>
          <Link 
            to="/login" 
            className="ml-2 text-blue-600 hover:underline"
          >
            立即登录
          </Link>
        </div>
      </div>
    </div>
  )
}