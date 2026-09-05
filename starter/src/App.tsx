import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { AppLayout } from '@/components/layout/app-layout'
import { RequireAuth } from '@/lib/auth'
import { AttendancePage } from '@/pages/attendance'
import { ContractsPage } from '@/pages/contracts'
import { DashboardPage } from '@/pages/dashboard'
import { DepartmentsPage } from '@/pages/departments'
import { EmployeeDetailPage } from '@/pages/employee-detail'
import { EmployeesPage } from '@/pages/employees'
import { LoginPage } from '@/pages/login'
import { PayrunDetailPage } from '@/pages/payrun-detail'
import { PayrunsPage } from '@/pages/payruns'
import { PayslipDetailPage } from '@/pages/payslip-detail'
import { PayslipsPage } from '@/pages/payslips'
import { RegisterPage } from '@/pages/register'
import { SalaryRulesPage } from '@/pages/salary-rules'
import { SalaryStructureDetailPage } from '@/pages/salary-structure-detail'
import { SalaryStructuresPage } from '@/pages/salary-structures'
import { TimeOffAllocationsPage } from '@/pages/time-off-allocations'
import { TimeOffRequestsPage } from '@/pages/time-off-requests'
import { TimeOffTypesPage } from '@/pages/time-off-types'
import { MyDashboardPage } from '@/pages/my-dashboard'
import { MyPayslipsPage } from '@/pages/my-payslips'
import { MyProfilePage } from '@/pages/my-profile'
import { UsersPage } from '@/pages/users'
import { WorkingScheduleDetailPage } from '@/pages/working-schedule-detail'
import { WorkingSchedulesPage } from '@/pages/working-schedules'

function RootRedirect() {
  const { hasRole } = useAuth()
  const isHR = hasRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER')
  return <Navigate to={isHR ? '/dashboard' : '/my-dashboard'} replace />
}

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
        <Route path="/" element={<RootRedirect />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Employees group */}
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/working-schedules" element={<WorkingSchedulesPage />} />
        <Route path="/working-schedules/:id" element={<WorkingScheduleDetailPage />} />

        {/* Attendance */}
        <Route path="/attendance" element={<AttendancePage />} />

        {/* Time Off group */}
        <Route path="/time-off" element={<Navigate to="/time-off/requests" replace />} />
        <Route path="/time-off/requests" element={<TimeOffRequestsPage />} />
        <Route path="/time-off/allocations" element={<TimeOffAllocationsPage />} />
        <Route path="/time-off/types" element={<TimeOffTypesPage />} />

        {/* Payroll group */}
        <Route path="/payruns" element={<PayrunsPage />} />
        <Route path="/payruns/:id" element={<PayrunDetailPage />} />
        <Route path="/payslips" element={<PayslipsPage />} />
        <Route path="/payslips/:id" element={<PayslipDetailPage />} />
        <Route path="/salary-structures" element={<SalaryStructuresPage />} />
        <Route path="/salary-structures/:id" element={<SalaryStructureDetailPage />} />
        <Route path="/salary-rules" element={<SalaryRulesPage />} />

        {/* Employee self-service */}
        <Route path="/my-dashboard" element={<MyDashboardPage />} />
        <Route path="/my-payslips" element={<MyPayslipsPage />} />
        <Route path="/my-profile" element={<MyProfilePage />} />

        {/* Admin */}
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
