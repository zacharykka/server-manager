import { api } from '@/lib/api'

// Ansible API 类型定义
export interface AdhocExecutionRequest {
  module: string
  args?: string
  hosts: string
  inventory?: string
  extra_vars?: Record<string, any>
}

export interface AdhocExecution {
  id: number
  command: string
  module: string
  args: string
  inventory: string
  hosts: string
  extra_vars: string
  status: 'pending' | 'running' | 'success' | 'failed'
  output: string
  error_output: string
  exit_code: number
  start_time: string | null
  end_time: string | null
  duration: number
  user_id: number
  created_at: string
  updated_at: string
}

export interface Inventory {
  id: number
  name: string
  description?: string
  content: string
  is_default: boolean
  user_id: number
  created_at: string
  updated_at: string
}

export interface Playbook {
  id: number
  name: string
  description?: string
  content: string
  variables?: Record<string, any>
  user_id: number
  created_at: string
  updated_at: string
}

export interface SystemStats {
  total_executions: number
  successful_executions: number
  failed_executions: number
  average_duration: number
}

export interface AnsibleModule {
  name: string
  description: string
}

export interface APIResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

// Ansible API 服务类
class AnsibleService {
  // System API
  async checkSystem(): Promise<APIResponse<{ ansible_available: boolean; message: string }>> {
    const response = await api.get('/api/v1/ansible/system/check')
    return response.data
  }

  async getSystemStats(): Promise<APIResponse<SystemStats>> {
    const response = await api.get('/api/v1/ansible/system/stats')
    return response.data
  }

  async getModules(): Promise<APIResponse<AnsibleModule[]>> {
    const response = await api.get('/api/v1/ansible/system/modules')
    return response.data
  }

  // Adhoc Execution API
  async executeAdhoc(request: AdhocExecutionRequest): Promise<APIResponse<AdhocExecution>> {
    const response = await api.post('/api/v1/ansible/adhoc/execute', request)
    return response.data
  }

  async getAdhocExecutions(page = 1, limit = 10): Promise<APIResponse<ListResponse<AdhocExecution>>> {
    const response = await api.get(`/api/v1/ansible/adhoc/executions?page=${page}&limit=${limit}`)
    return response.data
  }

  async getAdhocExecution(id: number): Promise<APIResponse<AdhocExecution>> {
    const response = await api.get(`/api/v1/ansible/adhoc/executions/${id}`)
    return response.data
  }

  // Inventory API
  async createInventory(inventory: Omit<Inventory, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<APIResponse<Inventory>> {
    const response = await api.post('/api/v1/ansible/inventories', inventory)
    return response.data
  }

  async getInventories(): Promise<APIResponse<Inventory[]>> {
    const response = await api.get('/api/v1/ansible/inventories')
    return response.data
  }

  async getInventory(id: number): Promise<APIResponse<Inventory>> {
    const response = await api.get(`/api/v1/ansible/inventories/${id}`)
    return response.data
  }

  async updateInventory(id: number, inventory: Partial<Omit<Inventory, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<APIResponse<Inventory>> {
    const response = await api.put(`/api/v1/ansible/inventories/${id}`, inventory)
    return response.data
  }

  async deleteInventory(id: number): Promise<APIResponse<null>> {
    const response = await api.delete(`/api/v1/ansible/inventories/${id}`)
    return response.data
  }

  async getDefaultInventory(): Promise<APIResponse<Inventory>> {
    const response = await api.get('/api/v1/ansible/inventories/default')
    return response.data
  }

  // Playbook API
  async createPlaybook(playbook: Omit<Playbook, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<APIResponse<Playbook>> {
    const response = await api.post('/api/v1/ansible/playbooks', playbook)
    return response.data
  }

  async getPlaybooks(): Promise<APIResponse<Playbook[]>> {
    const response = await api.get('/api/v1/ansible/playbooks')
    return response.data
  }

  async getPlaybook(id: number): Promise<APIResponse<Playbook>> {
    const response = await api.get(`/api/v1/ansible/playbooks/${id}`)
    return response.data
  }

  async updatePlaybook(id: number, playbook: Partial<Omit<Playbook, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<APIResponse<Playbook>> {
    const response = await api.put(`/api/v1/ansible/playbooks/${id}`, playbook)
    return response.data
  }

  async deletePlaybook(id: number): Promise<APIResponse<null>> {
    const response = await api.delete(`/api/v1/ansible/playbooks/${id}`)
    return response.data
  }
}

export const ansibleService = new AnsibleService()