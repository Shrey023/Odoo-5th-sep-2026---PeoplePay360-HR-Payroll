import { Router } from 'express'

import { attendanceRouter } from './attendance.routes.js'
import { authRouter } from './auth.routes.js'
import { contractRouter } from './contract.routes.js'
import { dashboardRouter } from './dashboard.routes.js'
import { departmentRouter } from './department.routes.js'
import { employeeRouter } from './employee.routes.js'
import { healthRouter } from './health.routes.js'
import { leaveRouter } from './leave.routes.js'
import { payrunRouter } from './payrun.routes.js'
import { salaryStructureRouter } from './salaryStructure.routes.js'
import { scheduleRouter } from './schedule.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/employees', employeeRouter)
apiRouter.use('/contracts', contractRouter)
apiRouter.use('/salary-structures', salaryStructureRouter)
apiRouter.use('/payruns', payrunRouter)
apiRouter.use('/attendance', attendanceRouter)
apiRouter.use('/time-off', leaveRouter)
apiRouter.use('/schedules', scheduleRouter)
apiRouter.use('/departments', departmentRouter)
apiRouter.use('/dashboard', dashboardRouter)
