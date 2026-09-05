import nodemailer, { type Transporter } from 'nodemailer'

let transporter: Transporter | null = null

// Dev mailer: an Ethereal test account. Nothing leaves the sandbox; each send
// returns a preview URL you can open to see the message. No real SMTP needed.
async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter
  const account = await nodemailer.createTestAccount()
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  })
  return transporter
}

export interface Attachment {
  filename: string
  content: Buffer
}

export async function sendMail(opts: {
  to: string
  subject: string
  text: string
  attachments?: Attachment[]
}): Promise<{ to: string; previewUrl: string | false }> {
  const tx = await getTransporter()
  const info = await tx.sendMail({
    from: 'PeoplePay360 <payroll@peoplepay360.local>',
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    attachments: opts.attachments,
  })
  return { to: opts.to, previewUrl: nodemailer.getTestMessageUrl(info) }
}
