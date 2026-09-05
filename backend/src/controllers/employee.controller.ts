import type { Request, Response } from 'express'

import * as employeeService from '../services/employee.service.js'
import { ok } from '../utils/apiResponse.js'
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validator.js'

export async function getMe(req: Request, res: Response) {
  const userId = req.user!.sub
  const { prisma } = await import('../config/prisma.js')
  const emp = await prisma.employee.findFirst({ where: { userId } })
  if (!emp) {
    ok(res, { message: 'No employee profile linked', data: null })
    return
  }
  const data = await employeeService.getById(emp.id)
  ok(res, { message: 'My profile', data })
}

export async function list(req: Request, res: Response) {
  const { departmentId, status, search } = req.query
  const data = await employeeService.list({
    departmentId: departmentId as string | undefined,
    status: status as string | undefined,
    search: search as string | undefined,
  })
  ok(res, { message: 'Employees', data })
}

export async function getOne(req: Request, res: Response) {
  const data = await employeeService.getById(req.params.id)
  ok(res, { message: 'Employee', data })
}

export async function create(req: Request, res: Response) {
  const input = createEmployeeSchema.parse(req.body)
  const data = await employeeService.create(input)
  ok(res, { statusCode: 201, message: 'Employee created', data })
}

export async function update(req: Request, res: Response) {
  const input = updateEmployeeSchema.parse(req.body)
  const data = await employeeService.update(req.params.id, input)
  ok(res, { message: 'Employee updated', data })
}

export async function remove(req: Request, res: Response) {
  await employeeService.remove(req.params.id)
  ok(res, { message: 'Employee deleted' })
}
