import api from '@/lib/api'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  data: {
    user: {
      id: number
      username: string
      email: string
      role: string
      created_at: string
      updated_at: string
    }
    token: string
    refresh_token: string
    expires_at: string
  }
  message: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', credentials)
    return response.data
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/register', userData)
    return response.data
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/refresh-token', {
      refresh_token: refreshToken
    })
    return response.data
  },

  getProfile: async () => {
    const response = await api.get<ApiResponse<any>>('/api/v1/profile')
    return response.data
  },

  updateProfile: async (profileData: { email?: string }) => {
    const response = await api.put<ApiResponse<any>>('/api/v1/profile', profileData)
    return response.data
  },

  changePassword: async (passwordData: { 
    current_password: string
    new_password: string 
  }) => {
    const response = await api.post<ApiResponse<any>>('/api/v1/change-password', passwordData)
    return response.data
  },

  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout')
    } catch (error) {
      console.error('Logout API call failed:', error)
    }
  }
}

export { authApi as default }