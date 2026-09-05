import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { RequireAuth } from '@/lib/auth'
import { DashboardPage } from '@/pages/dashboard'
import { EmployeeDetailPage } from '@/pages/employee-detail'
import { EmployeesPage } from '@/pages/employees'
import { LoginPage } from '@/pages/login'
import { PayrunDetailPage } from '@/pages/payrun-detail'
import { PayrunsPage } from '@/pages/payruns'
import { RegisterPage } from '@/pages/register'
import { SalaryStructureDetailPage } from '@/pages/salary-structure-detail'
import { SalaryStructuresPage } from '@/pages/salary-structures'
import { TimeOffPage } from '@/pages/time-off'

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
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/salary-structures" element={<SalaryStructuresPage />} />
        <Route path="/salary-structures/:id" element={<SalaryStructureDetailPage />} />
        <Route path="/payruns" element={<PayrunsPage />} />
        <Route path="/payruns/:id" element={<PayrunDetailPage />} />
        <Route path="/time-off" element={<TimeOffPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
