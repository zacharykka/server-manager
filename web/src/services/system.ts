import api from '@/lib/api'

export interface SystemStatus {
  backend: {
    status: 'online' | 'offline' | 'unknown'
    message: string
  }
  database: {
    status: 'online' | 'offline' | 'unknown'
    message: string
  }
  ansible: {
    status: 'online' | 'offline' | 'unknown'
    message: string
    available?: boolean
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
}

export const systemService = {
  // 检查后端健康状态
  checkBackendHealth: async (): Promise<{ status: 'online' | 'offline' | 'unknown'; message: string }> => {
    try {
      const response = await api.get('/health', { timeout: 5000 })
      if (response.status === 200 && response.data?.status === 'ok') {
        return { status: 'online', message: '后端服务正常运行' }
      }
      return { status: 'offline', message: '后端服务响应异常' }
    } catch (error) {
      return { status: 'unknown', message: '无法连接到后端服务' }
    }
  },

  // 检查数据库连接状态（通过后端API）
  checkDatabaseStatus: async (): Promise<{ status: 'online' | 'offline' | 'unknown'; message: string }> => {
    try {
      // 使用ping接口来测试数据库连接
      const response = await api.get('/api/v1/ping', { timeout: 5000 })
      if (response.status === 200 && response.data?.message === 'pong') {
        return { status: 'online', message: '数据库连接正常' }
      }
      return { status: 'offline', message: '数据库连接异常' }
    } catch (error) {
      return { status: 'unknown', message: '数据库连接失败' }
    }
  },

  // 检查Ansible状态（通过健康端点判断是否已配置）
  checkAnsibleStatusPublic: async (): Promise<{ status: 'online' | 'offline' | 'unknown'; message: string; available?: boolean }> => {
    try {
      // 尝试通过健康检查来判断Ansible是否配置
      const healthResponse = await api.get('/health', { timeout: 5000 })
      
      if (healthResponse.status === 200 && healthResponse.data?.status === 'ok') {
        // 如果健康检查正常，尝试访问Ansible端点来判断配置状态
        try {
          const response = await api.get('/api/v1/ansible/system/check', { timeout: 3000 })
          
          if (response.status === 200 && response.data?.success) {
            const available = response.data.data?.ansible_available
            return {
              status: available ? 'online' : 'offline',
              message: available ? 'Ansible可用' : 'Ansible不可用',
              available
            }
          }
          
          return { status: 'offline', message: 'Ansible检查失败' }
        } catch (error: any) {
          // 如果是401错误，说明需要认证才能查看详细状态
          if (error.response?.status === 401) {
            return { 
              status: 'unknown', 
              message: '需要登录后查看Ansible状态' 
            }
          }
          
          // 其他错误可能表示Ansible未配置或不可用
          return { 
            status: 'offline', 
            message: 'Ansible服务未配置或不可用' 
          }
        }
      }
      
      return { status: 'offline', message: '后端服务异常，无法检查Ansible状态' }
    } catch (error) {
      return { status: 'unknown', message: '无法检查Ansible状态' }
    }
  },

  // 获取完整系统状态
  getSystemStatus: async (): Promise<SystemStatus> => {
    const [backend, database, ansible] = await Promise.allSettled([
      systemService.checkBackendHealth(),
      systemService.checkDatabaseStatus(),
      systemService.checkAnsibleStatusPublic()
    ])

    return {
      backend: backend.status === 'fulfilled' ? backend.value : { status: 'unknown', message: '检查失败' },
      database: database.status === 'fulfilled' ? database.value : { status: 'unknown', message: '检查失败' },
      ansible: ansible.status === 'fulfilled' ? ansible.value : { status: 'unknown', message: '检查失败' }
    }
  }
}

export default systemService