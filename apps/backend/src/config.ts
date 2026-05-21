const parseOrigins = (value?: string): string[] =>
  value
    ? value.split(',').map((origin) => origin.trim()).filter(Boolean)
    : []

const allowedOrigins = parseOrigins(process.env.ALLOWED_ORIGINS)

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
