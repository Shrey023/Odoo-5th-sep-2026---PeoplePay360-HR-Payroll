import nodemailer, { type Transporter } from 'nodemailer'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) return transporter
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (user && pass) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass },
    })
  } else {
    // Ethereal fallback for local dev without credentials
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: 'dev@ethereal.email', pass: 'dev' },
    })
  }
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
  const tx = getTransporter()
  const info = await tx.sendMail({
    from: `PeoplePay360 <${process.env.SMTP_USER ?? 'payroll@peoplepay360.local'}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    attachments: opts.attachments,
  })
  const previewUrl = nodemailer.getTestMessageUrl(info)
  if (previewUrl) console.log('Mail preview:', previewUrl)
  return { to: opts.to, previewUrl }
}
