import type { Request, Response } from 'express'

import * as scheduleService from '../services/schedule.service.js'
import { ok } from '../utils/apiResponse.js'
import { upsertScheduleSchema } from '../validators/schedule.validator.js'

export async function list(_req: Request, res: Response) {
  const data = await scheduleService.list()
  ok(res, { message: 'Working schedules', data })
}

export async function create(req: Request, res: Response) {
  const { name, calendarType } = req.body as { name?: string; calendarType?: string }
  if (!name?.trim()) {
    res.status(400).json({ success: false, message: 'Name is required' })
    return
  }
  const data = await scheduleService.createSchedule(name.trim(), calendarType ?? 'Standard')
  ok(res, { statusCode: 201, message: 'Working schedule created', data })
}

export async function getOne(req: Request, res: Response) {
  const data = await scheduleService.getById(req.params.id)
  ok(res, { message: 'Working schedule', data })
}

export async function upsertLines(req: Request, res: Response) {
  const input = upsertScheduleSchema.parse(req.body)
  const data = await scheduleService.upsertLines(req.params.id, input)
  ok(res, { message: 'Working schedule updated', data })
}
