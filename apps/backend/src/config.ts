const parseOrigins = (value?: string): string[] =>
  value
    ? value.split(',').map((origin) => origin.trim()).filter(Boolean)
    : []

const allowedOrigins = parseOrigins(process.env.ALLOWED_ORIGINS)

const ipOriginRegex = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/

export function corsOriginCheck(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  if (!origin) return callback(null, true)
  if (config.allowedOrigins.includes(origin)) return callback(null, true)
  if (ipOriginRegex.test(origin)) return callback(null, true)
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return callback(null, true)
  callback(null, false)
}

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  dbPath: process.env.DB_PATH ?? './data/pokaface.db',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  allowedOrigins: allowedOrigins.length > 0
    ? allowedOrigins
    : [process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'],
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10),
  roomTtlDays: parseInt(process.env.ROOM_TTL_DAYS ?? '7', 10),
  isDev: process.env.NODE_ENV !== 'production',
}
