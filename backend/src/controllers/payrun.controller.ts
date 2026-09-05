import type { Request, Response } from 'express'

import * as payrunService from '../services/payrun.service.js'
import { getPayslipPdf } from '../services/payslip.pdf.js'
import { prisma } from '../config/prisma.js'
import { ok } from '../utils/apiResponse.js'
import { createPayrunSchema, updatePayrunSchema } from '../validators/payrun.validator.js'

export async function list(_req: Request, res: Response) {
  const data = await payrunService.list()
  ok(res, { message: 'Payruns', data })
}

export async function getOne(req: Request, res: Response) {
  const payrun = await payrunService.getById(req.params.id)
  ok(res, { message: 'Payrun', data: { ...payrun, warnings: payrunService.buildWarnings(payrun) } })
}

export async function create(req: Request, res: Response) {
  const input = createPayrunSchema.parse(req.body)
  const data = await payrunService.create(input)
  ok(res, { statusCode: 201, message: 'Payrun created', data })
}

export async function update(req: Request, res: Response) {
  const input = updatePayrunSchema.parse(req.body)
  const data = await payrunService.update(req.params.id, input)
  ok(res, { message: 'Payrun updated', data })
}

export async function remove(req: Request, res: Response) {
  await payrunService.remove(req.params.id)
  ok(res, { message: 'Payrun deleted' })
}

export async function compute(req: Request, res: Response) {
  const data = await payrunService.compute(req.params.id)
  ok(res, { message: 'Payrun computed', data })
}

export async function validate(req: Request, res: Response) {
  const data = await payrunService.validate(req.params.id)
  ok(res, { message: 'Payrun validated', data })
}

export async function markPaid(req: Request, res: Response) {
  const data = await payrunService.markPaid(req.params.id)
  ok(res, { message: 'Payrun marked paid', data })
}

export async function sendPayslips(req: Request, res: Response) {
  const data = await payrunService.sendPayslips(req.params.id)
  ok(res, { message: 'Payslips sent', data })
}

export async function downloadPayslip(req: Request, res: Response) {
  const { buffer, fileName } = await getPayslipPdf(req.params.payslipId)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  res.send(buffer)
}

export async function listAllPayslips(_req: Request, res: Response) {
  const data = await prisma.payslip.findMany({
    include: {
      employee: { select: { id: true, name: true } },
      payrun: { select: { id: true, name: true, periodStart: true, periodEnd: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  ok(res, { message: 'Payslips', data })
}
