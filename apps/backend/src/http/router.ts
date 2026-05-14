import { Router } from 'express'
import { buildRoomState } from '../db/queries'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.get('/rooms/:roomId', (req, res) => {
  const room = buildRoomState(req.params.roomId)
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  res.json({ room })
})

export default router
