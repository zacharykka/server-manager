import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ServersPage } from '@/pages/ServersPage'
import { AddServerPage } from '@/pages/AddServerPage'
import { EditServerPage } from '@/pages/EditServerPage'
import { AnsiblePage } from '@/pages/AnsiblePage'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <RegisterPage />
            )
          } 
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* Server management routes */}
          <Route path="servers" element={<ServersPage />} />
          <Route path="servers/add" element={<AddServerPage />} />
          <Route path="servers/:id/edit" element={<EditServerPage />} />
          
          {/* Ansible management routes */}
          <Route path="ansible" element={<AnsiblePage />} />
          
          {/* Other feature routes */}
          <Route path="tasks" element={<div className="p-8">任务历史页面 - 开发中</div>} />
          
          {/* Admin only routes */}
          <Route 
            path="admin/users" 
            element={
              <ProtectedRoute adminOnly>
                <div className="p-8">用户管理页面 - 开发中</div>
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App