import PDFDocument from 'pdfkit'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'

const money = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 })

export async function getPayslipPdf(payslipId: string): Promise<{ buffer: Buffer; fileName: string }> {
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      employee: { select: { name: true, workEmail: true } },
      payrun: { select: { name: true } },
      lines: { orderBy: { sequence: 'asc' } },
    },
  })
  if (!payslip) throw new HttpError(404, 'Payslip not found')

  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))

  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  const period = `${payslip.periodStart.toISOString().slice(0, 10)} to ${payslip.periodEnd.toISOString().slice(0, 10)}`

  doc.fontSize(18).text('Payslip', { align: 'center' })
  doc.moveDown(0.5)
  doc.fontSize(10).fillColor('#555')
  doc.text(payslip.payrun.name, { align: 'center' })
  doc.moveDown(1)

  doc.fillColor('#000').fontSize(11)
  doc.text(`Employee: ${payslip.employee.name}`)
  doc.text(`Email: ${payslip.employee.workEmail}`)
  doc.text(`Period: ${period}`)
  doc.moveDown(1)

  const left = 50
  const right = 400
  doc.fontSize(10).fillColor('#555')
  doc.text('Rule', left, doc.y, { continued: true })
  doc.text('Amount', right, doc.y, { align: 'right' })
  doc.moveTo(left, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#ccc').stroke()
  doc.moveDown(0.5)

  doc.fillColor('#000')
  for (const line of payslip.lines) {
    const y = doc.y
    doc.text(`${line.ruleName} (${line.category})`, left, y, { continued: true })
    doc.text(money(Number(line.amount)), right, y, { align: 'right' })
    doc.moveDown(0.3)
  }

  doc.moveDown(1)
  doc.moveTo(left, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke()
  doc.moveDown(0.5)
  const summary = (label: string, value: number) => {
    const y = doc.y
    doc.text(label, left, y, { continued: true })
    doc.text(money(value), right, y, { align: 'right' })
    doc.moveDown(0.3)
  }
  summary('Gross', Number(payslip.gross))
  summary('Deductions', Number(payslip.deductions))
  doc.fontSize(12)
  summary('Net Pay', Number(payslip.net))

  doc.end()
  const buffer = await done
  const fileName = `payslip-${payslip.employee.name.replace(/\s+/g, '-')}-${payslip.periodStart.toISOString().slice(0, 7)}.pdf`
  return { buffer, fileName }
}
