import PDFDocument from 'pdfkit'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/apiResponse.js'

const money = (n: number) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const BRAND = '#000000'
const INK = '#000000'
const MUTED = '#555555'
const LINE = '#cccccc'
const PANEL = '#f2f2f2'
const PAGE_LEFT = 50
const PAGE_RIGHT = 545

export async function getPayslipPdf(payslipId: string): Promise<{ buffer: Buffer; fileName: string }> {
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      employee: {
        select: {
          name: true,
          workEmail: true,
          jobPosition: true,
          bankAccount: true,
          department: { select: { name: true } },
          company: { select: { name: true } },
        },
      },
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

  const companyName = 'ORS'
  const period = `${payslip.periodStart.toISOString().slice(0, 10)} to ${payslip.periodEnd.toISOString().slice(0, 10)}`

  // Header band
  doc.rect(0, 0, doc.page.width, 90).fill(BRAND)
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(companyName, PAGE_LEFT, 30)
  doc.fontSize(11).font('Helvetica').text('Payslip', PAGE_LEFT, 58)
  doc
    .fontSize(10)
    .text(payslip.payrun.name, PAGE_LEFT, 30, { align: 'right', width: PAGE_RIGHT - PAGE_LEFT })
    .text(period, PAGE_LEFT, 45, { align: 'right', width: PAGE_RIGHT - PAGE_LEFT })

  // Employee info box
  let y = 120
  doc.roundedRect(PAGE_LEFT, y, PAGE_RIGHT - PAGE_LEFT, 78, 6).fill(PANEL)
  const infoPad = y + 14
  const col2 = 310
  const info = (label: string, value: string, x: number, row: number) => {
    const ry = infoPad + row * 24
    doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(label.toUpperCase(), x + 14, ry)
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(11).text(value, x + 14, ry + 10)
  }
  info('Employee', payslip.employee.name, PAGE_LEFT, 0)
  info('Position', payslip.employee.jobPosition ?? '-', PAGE_LEFT, 1)
  info('Department', payslip.employee.department?.name ?? '-', col2, 0)
  info('Bank Account', payslip.employee.bankAccount ?? 'Not set', col2, 1)

  y += 78 + 28

  // Split lines into earnings vs deductions
  const earnings = payslip.lines.filter((l) => l.category !== 'DEDUCTION' && l.category !== 'NET')
  const deductions = payslip.lines.filter((l) => l.category === 'DEDUCTION')

  const sectionHeader = (title: string, atY: number) => {
    doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(11).text(title, PAGE_LEFT, atY)
    doc.moveTo(PAGE_LEFT, atY + 16).lineTo(PAGE_RIGHT, atY + 16).strokeColor(BRAND).lineWidth(1).stroke()
  }

  const row = (label: string, amount: number, atY: number, bold = false) => {
    doc
      .fillColor(INK)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(10)
      .text(label, PAGE_LEFT + 4, atY, { width: 320 })
    doc.text(money(amount), PAGE_LEFT, atY, { align: 'right', width: PAGE_RIGHT - PAGE_LEFT - 4 })
  }

  // Earnings
  sectionHeader('Earnings', y)
  y += 26
  for (const l of earnings) {
    row(`${l.ruleName}`, Number(l.amount), y)
    y += 20
  }
  doc.moveTo(PAGE_LEFT, y).lineTo(PAGE_RIGHT, y).strokeColor(LINE).lineWidth(1).stroke()
  y += 8
  row('Gross', Number(payslip.gross), y, true)
  y += 34

  // Deductions
  sectionHeader('Deductions', y)
  y += 26
  if (deductions.length === 0) {
    doc.fillColor(MUTED).font('Helvetica').fontSize(10).text('None', PAGE_LEFT + 4, y)
    y += 20
  } else {
    for (const l of deductions) {
      row(`${l.ruleName}`, Number(l.amount), y)
      y += 20
    }
  }
  doc.moveTo(PAGE_LEFT, y).lineTo(PAGE_RIGHT, y).strokeColor(LINE).lineWidth(1).stroke()
  y += 8
  row('Total Deductions', Number(payslip.deductions), y, true)
  y += 40

  // Net pay highlight band
  doc.roundedRect(PAGE_LEFT, y, PAGE_RIGHT - PAGE_LEFT, 46, 6).fill(BRAND)
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13).text('NET PAY', PAGE_LEFT + 16, y + 15)
  doc
    .fontSize(16)
    .text(money(Number(payslip.net)), PAGE_LEFT, y + 13, {
      align: 'right',
      width: PAGE_RIGHT - PAGE_LEFT - 16,
    })

  // Footer
  doc
    .fillColor(MUTED)
    .font('Helvetica')
    .fontSize(8)
    .text(
      'This is a system-generated payslip and does not require a signature.',
      PAGE_LEFT,
      780,
      { align: 'center', width: PAGE_RIGHT - PAGE_LEFT },
    )

  doc.end()
  const buffer = await done
  const fileName = `payslip-${payslip.employee.name.replace(/\s+/g, '-')}-${payslip.periodStart.toISOString().slice(0, 7)}.pdf`
  return { buffer, fileName }
}
