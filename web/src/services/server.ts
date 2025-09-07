import { api } from '@/lib/api'

// 类型定义
export interface Server {
  id: number
  name: string
  host: string
  port: number
  username: string
  description: string
  os: string
  status: 'online' | 'offline' | 'unknown'
  group_id?: number
  group?: ServerGroup
  tags: string
  created_at: string
  updated_at: string
}

export interface ServerGroup {
  id: number
  name: string
  description: string
  color: string
  server_count?: number
  servers?: Server[]
  created_at: string
  updated_at: string
}

export interface CreateServerRequest {
  name: string
  host: string
  port: number
  username: string
  password?: string
  private_key?: string
  description: string
  os: string
  group_id?: number
  tags: string
}

export interface UpdateServerRequest {
  name?: string
  host?: string
  port?: number
  username?: string
  password?: string
  private_key?: string
  description?: string
  os?: string
  group_id?: number
  tags?: string
}

export interface CreateServerGroupRequest {
  name: string
  description: string
  color?: string
}

export interface UpdateServerGroupRequest {
  name?: string
  description?: string
  color?: string
}

export interface SSHTestRequest {
  host: string
  port: number
  username: string
  password?: string
  private_key?: string
}

export interface SSHTestResponse {
  success: boolean
  message: string
  os_info?: string
  uptime?: string
  latency_ms?: number
}

export interface ServerListParams {
  page?: number
  limit?: number
  search?: string
  group_id?: number
}

export interface ServerListResponse {
  servers: Server[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface ServerStats {
  total_servers: number
  total_groups: number
  status_stats: Record<string, number>
}

// API 函数
class ServerAPI {
  // 服务器管理
  async getServers(params: ServerListParams = {}): Promise<ServerListResponse> {
    const response = await api.get('/api/v1/servers', { params })
    return response.data.data
  }

  async getServer(id: number): Promise<Server> {
    const response = await api.get(`/api/v1/servers/${id}`)
    return response.data.data
  }

  async createServer(data: CreateServerRequest): Promise<Server> {
    const response = await api.post('/api/v1/servers', data)
    return response.data.data
  }

  async updateServer(id: number, data: UpdateServerRequest): Promise<Server> {
    const response = await api.put(`/api/v1/servers/${id}`, data)
    return response.data.data
  }

  async deleteServer(id: number): Promise<void> {
    await api.delete(`/api/v1/servers/${id}`)
  }

  async testServerConnection(id: number): Promise<SSHTestResponse> {
    const response = await api.post(`/api/v1/servers/${id}/test`)
    return response.data.data
  }

  // 服务器组管理
  async getServerGroups(): Promise<ServerGroup[]> {
    const response = await api.get('/api/v1/server-groups')
    return response.data.data
  }

  async getServerGroup(id: number): Promise<ServerGroup> {
    const response = await api.get(`/api/v1/server-groups/${id}`)
    return response.data.data
  }

  async createServerGroup(data: CreateServerGroupRequest): Promise<ServerGroup> {
    const response = await api.post('/api/v1/server-groups', data)
    return response.data.data
  }

  async updateServerGroup(id: number, data: UpdateServerGroupRequest): Promise<ServerGroup> {
    const response = await api.put(`/api/v1/server-groups/${id}`, data)
    return response.data.data
  }

  async deleteServerGroup(id: number): Promise<void> {
    await api.delete(`/api/v1/server-groups/${id}`)
  }

  // SSH 连接测试
  async testSSHConnection(data: SSHTestRequest): Promise<SSHTestResponse> {
    const response = await api.post('/api/v1/test-ssh', data)
    return response.data.data
  }

  // 服务器统计
  async getServerStats(): Promise<ServerStats> {
    const response = await api.get('/api/v1/server-stats')
    return response.data.data
  }
}

export const serverAPI = new ServerAPI()