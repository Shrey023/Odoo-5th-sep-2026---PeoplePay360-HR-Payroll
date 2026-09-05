import dotenv from 'dotenv'

dotenv.config()

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback
  if (value === undefined) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET', 'dev-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 2525,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'PeoplePay360 <payroll@peoplepay360.test>',
  },
}
