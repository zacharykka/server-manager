import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/services/auth'
import type { LoginRequest, RegisterRequest } from '@/services/auth'
import { hashPassword, validatePasswordStrength } from '@/lib/crypto'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const { 
    user, 
    token, 
    isAuthenticated, 
    error, 
    login: setAuthData, 
    logout: clearAuthData, 
    setError, 
    clearError 
  } = useAuthStore()

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true)
      clearError()
      
      // 对密码进行客户端不可逆哈希
      const hashedCredentials = {
        ...credentials,
        password: hashPassword(credentials.password)
      }
      
      const response = await authApi.login(hashedCredentials)
      
      if (response.success) {
        const { user, token, refresh_token } = response.data
        setAuthData(user, token, refresh_token)
        return { success: true, data: response.data }
      } else {
        setError(response.message || '登录失败')
        return { success: false, error: response.message }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '登录失败，请稍后重试'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      setLoading(true)
      clearError()
      
      // 验证密码强度
      const passwordValidation = validatePasswordStrength(userData.password)
      if (!passwordValidation.isValid) {
        setError('密码不符合要求: ' + passwordValidation.errors.join(', '))
        return { success: false, error: '密码强度不足' }
      }
      
      // 对密码进行客户端不可逆哈希
      const hashedUserData = {
        ...userData,
        password: hashPassword(userData.password)
      }
      
      const response = await authApi.register(hashedUserData)
      
      if (response.success) {
        const { user, token, refresh_token } = response.data
        setAuthData(user, token, refresh_token)
        return { success: true, data: response.data }
      } else {
        setError(response.message || '注册失败')
        return { success: false, error: response.message }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '注册失败，请稍后重试'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      clearAuthData()
    }
  }

  const refreshUserProfile = async () => {
    try {
      const response = await authApi.getProfile()
      if (response.success) {
        useAuthStore.getState().setUser(response.data)
        return response.data
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error)
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    refreshUserProfile,
    clearError,
  }
}