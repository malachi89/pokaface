import { Router } from 'express'
import { buildRoomState } from '../db/queries'
import { getAdminStats } from '../db/events'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

router.get('/rooms/:roomId', async (req, res) => {
  try {
    const room = await buildRoomState(req.params.roomId)
    if (!room) {
      res.status(404).json({ error: 'Room not found' })
      return
    }
    res.json({ room })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch room' })
  }
})

router.get('/admin/stats', async (_req, res) => {
  try {
    const stats = await getAdminStats()
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
