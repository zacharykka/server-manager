import { useState, useEffect, useCallback } from 'react'
import systemService, { type SystemStatus } from '@/services/system'

export function useSystemStatus() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkSystemStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const status = await systemService.getSystemStatus()
      setSystemStatus(status)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取系统状态失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initializeSystemStatus = async () => {
      try {
        await checkSystemStatus()
      } catch (error) {
        console.warn('Failed to initialize system status:', error)
      }
    }
    
    initializeSystemStatus()

    // 每30秒刷新一次系统状态
    const interval = setInterval(checkSystemStatus, 30000)
    
    return () => clearInterval(interval)
  }, [checkSystemStatus])

  return {
    systemStatus,
    loading,
    error,
    refreshSystemStatus: checkSystemStatus
  }
}