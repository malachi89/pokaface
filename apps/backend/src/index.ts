import http from 'http'
import express from 'express'
import cors from 'cors'
import { config } from './config'
import { runMigrations, resetConnections } from './db/schema'
import { cleanupOldRooms } from './db/queries'
import { cleanupOldEvents } from './db/events'
import { cleanupOldRetrospectives } from './db/retrospectives'
import { createSocketServer } from './socket'
import router from './http/router'

async function start() {
  try {
    await runMigrations()
    await resetConnections()
    await cleanupOldRooms(config.roomTtlDays)
    await cleanupOldRetrospectives(config.roomTtlDays)

    const app = express()

    app.use(cors({ origin: config.allowedOrigins, credentials: true }))
    app.use(express.json())
    app.use('/api', router)

    const httpServer = http.createServer(app)
    createSocketServer(httpServer)

    httpServer.listen(config.port, () => {
      console.log(`Backend running on port ${config.port}`)
    })

    setInterval(async () => {
      await cleanupOldRooms(config.roomTtlDays)
      await cleanupOldRetrospectives(config.roomTtlDays)
      await cleanupOldEvents()
    }, 1000 * 60 * 60 * 24)
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
