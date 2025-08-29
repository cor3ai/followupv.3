import { Router } from 'express'
import { prisma } from '../prisma/client.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'

export const router = Router()
router.use(requireAuth)

// Sends usage for current month + cap
router.get('/usage', async (req: AuthRequest, res) => {
  const orgId = req!.user!.orgId
  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  const cap = org?.sendCap || 5000

  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0,0,0))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()+1, 1, 0,0,0))

  const sent = await prisma.message.count({
    where: { organizationId: orgId, status: 'sent', sentAt: { gte: start, lt: end } }
  })
  res.json({ monthSent: sent, monthCap: cap })
})

// Recent Email Events (last 50)
router.get('/events/recent', async (req: AuthRequest, res) => {
  const orgId = req!.user!.orgId
  const items = await prisma.emailEvent.findMany({
    where: { organizationId: orgId },
    orderBy: { occurredAt: 'desc' },
    take: 50
  })
  res.json(items)
})

