import type { Request, Response } from 'express'

import * as attendanceService from '../services/attendance.service.js'
import { ok } from '../utils/apiResponse.js'
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from '../validators/attendance.validator.js'

export async function list(req: Request, res: Response) {
  const data = await attendanceService.list({ employeeId: req.query.employeeId as string | undefined })
  ok(res, { message: 'Attendance', data })
}

export async function create(req: Request, res: Response) {
  const input = createAttendanceSchema.parse(req.body)
  const data = await attendanceService.create(input)
  ok(res, { statusCode: 201, message: 'Attendance created', data })
}

export async function update(req: Request, res: Response) {
  const input = updateAttendanceSchema.parse(req.body)
  const data = await attendanceService.update(req.params.id, input)
  ok(res, { message: 'Attendance updated', data })
}

export async function remove(req: Request, res: Response) {
  await attendanceService.remove(req.params.id)
  ok(res, { message: 'Attendance deleted' })
}

export async function getActive(req: Request, res: Response) {
  const data = await attendanceService.getActiveSession(req.user!.id)
  ok(res, { message: 'Active session', data })
}

export async function checkIn(req: Request, res: Response) {
  const data = await attendanceService.checkIn(req.user!.id)
  ok(res, { statusCode: 201, message: 'Checked in', data })
}

export async function checkOut(req: Request, res: Response) {
  const data = await attendanceService.checkOut(req.user!.id)
  ok(res, { message: 'Checked out', data })
}
