import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { RequireAuth } from '@/lib/auth'
import { DashboardPage } from '@/pages/dashboard'
import { ItemsPage } from '@/pages/items'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/items" element={<ItemsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
