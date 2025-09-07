import { ReactNode, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

interface ProtectedRouteProps {
  children: ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { 
        replace: true,
        state: { from: location.pathname }
      })
      return
    }

    if (adminOnly && user?.role !== 'admin') {
      navigate('/dashboard', { replace: true })
      return
    }
  }, [isAuthenticated, user, adminOnly, navigate, location])

  if (!isAuthenticated) {
    return null
  }

  if (adminOnly && user?.role !== 'admin') {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute