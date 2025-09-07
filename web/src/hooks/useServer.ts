import { useState, useEffect } from 'react'
import { serverAPI, type Server, type ServerGroup, type CreateServerRequest, type UpdateServerRequest, type CreateServerGroupRequest, type UpdateServerGroupRequest, type SSHTestRequest, type ServerListParams } from '@/services/server'

export function useServers(params: ServerListParams = {}) {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  })

  const fetchServers = async (newParams?: ServerListParams) => {
    try {
      setLoading(true)
      setError(null)
      const finalParams = { ...params, ...newParams }
      const response = await serverAPI.getServers(finalParams)
      setServers(response.servers)
      setPagination(response.pagination)
    } catch (err: any) {
      setError(err.response?.data?.message || '获取服务器列表失败')
    } finally {
      setLoading(false)
    }
  }

  const createServer = async (data: CreateServerRequest): Promise<Server | null> => {
    try {
      const server = await serverAPI.createServer(data)
      await fetchServers() // 重新获取列表
      return server
    } catch (err: any) {
      setError(err.response?.data?.message || '创建服务器失败')
      return null
    }
  }

  const updateServer = async (id: number, data: UpdateServerRequest): Promise<Server | null> => {
    try {
      const server = await serverAPI.updateServer(id, data)
      await fetchServers() // 重新获取列表
      return server
    } catch (err: any) {
      setError(err.response?.data?.message || '更新服务器失败')
      return null
    }
  }

  const deleteServer = async (id: number): Promise<boolean> => {
    try {
      await serverAPI.deleteServer(id)
      await fetchServers() // 重新获取列表
      return true
    } catch (err: any) {
      setError(err.response?.data?.message || '删除服务器失败')
      return false
    }
  }

  const testConnection = async (id: number) => {
    try {
      const result = await serverAPI.testServerConnection(id)
      await fetchServers() // 重新获取列表以更新状态
      return result
    } catch (err: any) {
      setError(err.response?.data?.message || '测试连接失败')
      return null
    }
  }

  useEffect(() => {
    fetchServers()
  }, [])

  return {
    servers,
    loading,
    error,
    pagination,
    fetchServers,
    createServer,
    updateServer,
    deleteServer,
    testConnection,
    clearError: () => setError(null)
  }
}

export function useServerGroups() {
  const [groups, setGroups] = useState<ServerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await serverAPI.getServerGroups()
      setGroups(response)
    } catch (err: any) {
      setError(err.response?.data?.message || '获取服务器组失败')
    } finally {
      setLoading(false)
    }
  }

  const createGroup = async (data: CreateServerGroupRequest): Promise<ServerGroup | null> => {
    try {
      const group = await serverAPI.createServerGroup(data)
      await fetchGroups() // 重新获取列表
      return group
    } catch (err: any) {
      setError(err.response?.data?.message || '创建服务器组失败')
      return null
    }
  }

  const updateGroup = async (id: number, data: UpdateServerGroupRequest): Promise<ServerGroup | null> => {
    try {
      const group = await serverAPI.updateServerGroup(id, data)
      await fetchGroups() // 重新获取列表
      return group
    } catch (err: any) {
      setError(err.response?.data?.message || '更新服务器组失败')
      return null
    }
  }

  const deleteGroup = async (id: number): Promise<boolean> => {
    try {
      await serverAPI.deleteServerGroup(id)
      await fetchGroups() // 重新获取列表
      return true
    } catch (err: any) {
      setError(err.response?.data?.message || '删除服务器组失败')
      return false
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    clearError: () => setError(null)
  }
}

export function useSSHTest() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async (data: SSHTestRequest) => {
    try {
      setTesting(true)
      setError(null)
      setResult(null)
      const response = await serverAPI.testSSHConnection(data)
      setResult(response)
      return response
    } catch (err: any) {
      setError(err.response?.data?.message || 'SSH连接测试失败')
      return null
    } finally {
      setTesting(false)
    }
  }

  return {
    testing,
    result,
    error,
    testConnection,
    clearResult: () => setResult(null),
    clearError: () => setError(null)
  }
}

export function useServerStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await serverAPI.getServerStats()
      setStats(response)
    } catch (err: any) {
      setError(err.response?.data?.message || '获取服务器统计失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    fetchStats,
    clearError: () => setError(null)
  }
}