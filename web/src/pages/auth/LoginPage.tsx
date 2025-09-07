import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const { login, loading, error, clearError, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/dashboard'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleLogin = async (credentials: { username: string; password: string }) => {
    const result = await login(credentials)
    if (result.success) {
      navigate(from, { replace: true })
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
            Ansible驱动的服务器管理平台
          </p>
        </div>

        <LoginForm 
          onLogin={handleLogin}
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
          <span className="text-gray-600">还没有账号？</span>
          <Link 
            to="/register" 
            className="ml-2 text-blue-600 hover:underline"
          >
            立即注册
          </Link>
        </div>
      </div>
    </div>
  )
}