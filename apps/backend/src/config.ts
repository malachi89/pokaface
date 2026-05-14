export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  dbPath: process.env.DB_PATH ?? './data/pokaface.db',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10),
  roomTtlDays: parseInt(process.env.ROOM_TTL_DAYS ?? '7', 10),
  isDev: process.env.NODE_ENV !== 'production',
}
