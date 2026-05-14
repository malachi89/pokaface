import http from 'http'
import express from 'express'
import cors from 'cors'
import { config } from './config'
import { runMigrations, resetConnections } from './db/schema'
import { cleanupOldRooms } from './db/queries'
import { createSocketServer } from './socket'
import router from './http/router'

runMigrations()
resetConnections()
cleanupOldRooms(config.roomTtlDays)

const app = express()

app.use(cors({ origin: config.frontendOrigin, credentials: true }))
app.use(express.json())
app.use('/api', router)

const httpServer = http.createServer(app)
createSocketServer(httpServer)

httpServer.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`)
})

setInterval(() => {
  cleanupOldRooms(config.roomTtlDays)
}, 1000 * 60 * 60 * 24)
