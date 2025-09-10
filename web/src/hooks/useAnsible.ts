import { useState, useEffect, useCallback } from 'react'
import { ansibleService, type AdhocExecution, type Inventory, type Playbook, type AnsibleModule } from '@/services/ansible'

// Adhoc执行钩子
export function useAdhoc() {
  const [executions, setExecutions] = useState<AdhocExecution[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeAdhoc = async (request: Parameters<typeof ansibleService.executeAdhoc>[0]) => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.executeAdhoc(request)
      if (response.success) {
        // 添加到执行列表开头
        setExecutions(prev => [response.data, ...prev])
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '执行失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshExecutions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.getAdhocExecutions()
      if (response.success) {
        setExecutions(response.data.items)
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取执行历史失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getExecution = async (id: number) => {
    try {
      const response = await ansibleService.getAdhocExecution(id)
      if (response.success) {
        // 更新列表中的执行记录
        setExecutions(prev => 
          prev.map(exec => exec.id === id ? response.data : exec)
        )
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取执行详情失败'
      setError(errorMessage)
      throw err
    }
  }

  return {
    executions,
    loading,
    error,
    executeAdhoc,
    refreshExecutions,
    getExecution
  }
}

// Inventory管理钩子
export function useInventory() {
  const [inventories, setInventories] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshInventories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.getInventories()
      if (response.success) {
        setInventories(response.data)
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取Inventory失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const createInventory = useCallback(async (inventory: Parameters<typeof ansibleService.createInventory>[0]) => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.createInventory(inventory)
      if (response.success) {
        setInventories(prev => [...prev, response.data])
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建Inventory失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateInventory = useCallback(async (id: number, inventory: Parameters<typeof ansibleService.updateInventory>[1]) => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.updateInventory(id, inventory)
      if (response.success) {
        setInventories(prev => 
          prev.map(inv => inv.id === id ? response.data : inv)
        )
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新Inventory失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteInventory = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.deleteInventory(id)
      if (response.success) {
        setInventories(prev => prev.filter(inv => inv.id !== id))
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除Inventory失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getDefaultInventory = useCallback(async () => {
    try {
      const response = await ansibleService.getDefaultInventory()
      if (response.success) {
        return response.data
      } else {
        // 如果没有默认inventory，返回null而不是抛出错误
        return null
      }
    } catch (err) {
      // 404错误是正常的，说明没有默认inventory
      if (err instanceof Error && err.message.includes('404')) {
        console.debug('No default inventory found')
        return null
      }
      const errorMessage = err instanceof Error ? err.message : '获取默认Inventory失败'
      setError(errorMessage)
      throw err
    }
  }, [])

  // Remove the automatic initialization
  // useEffect will be handled by components when authenticated

  return {
    inventories,
    loading,
    error,
    refreshInventories,
    createInventory,
    updateInventory,
    deleteInventory,
    getDefaultInventory
  }
}

// Playbook管理钩子
export function usePlaybook() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshPlaybooks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.getPlaybooks()
      if (response.success) {
        setPlaybooks(response.data)
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取Playbook失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const createPlaybook = useCallback(async (playbook: Parameters<typeof ansibleService.createPlaybook>[0]) => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.createPlaybook(playbook)
      if (response.success) {
        setPlaybooks(prev => [...prev, response.data])
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建Playbook失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePlaybook = useCallback(async (id: number, playbook: Parameters<typeof ansibleService.updatePlaybook>[1]) => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.updatePlaybook(id, playbook)
      if (response.success) {
        setPlaybooks(prev => 
          prev.map(pb => pb.id === id ? response.data : pb)
        )
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新Playbook失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePlaybook = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.deletePlaybook(id)
      if (response.success) {
        setPlaybooks(prev => prev.filter(pb => pb.id !== id))
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除Playbook失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Remove the automatic initialization
  // useEffect will be handled by components when authenticated

  return {
    playbooks,
    loading,
    error,
    refreshPlaybooks,
    createPlaybook,
    updatePlaybook,
    deletePlaybook
  }
}

// Ansible系统钩子
export function useAnsibleSystem() {
  const [modules, setModules] = useState<AnsibleModule[]>([])
  const [systemStatus, setSystemStatus] = useState<{ available: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSystem = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.checkSystem()
      if (response.success) {
        // 将 ansible_available 映射为 available
        const mappedStatus = {
          available: response.data.ansible_available,
          message: response.data.message
        }
        setSystemStatus(mappedStatus)
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查系统状态失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getModules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ansibleService.getModules()
      if (response.success) {
        setModules(response.data)
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取模块列表失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        await checkSystem()
        await getModules()
      } catch (error) {
        // Errors are already handled in the individual functions
        console.warn('Failed to initialize Ansible system:', error)
      }
    }
    
    initializeSystem()
  }, [checkSystem, getModules])

  return {
    modules,
    systemStatus,
    loading,
    error,
    checkSystem,
    getModules
  }
}