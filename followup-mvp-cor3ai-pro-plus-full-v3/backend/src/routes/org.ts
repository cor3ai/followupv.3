import { Router } from 'express'
import { prisma } from '../prisma/client.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'

export const router = Router()
router.use(requireAuth)

router.get('/settings', async (req: AuthRequest, res) => {
  const org = await prisma.organization.findUnique({ where: { id: req!.user!.orgId } })
  res.json({ name: org?.name, vertical: org?.vertical, settings: org?.settings || {} })
})

router.post('/settings', async (req: AuthRequest, res) => {
  const { name, settings } = req.body || {}
  const org = await prisma.organization.update({
    where: { id: req!.user!.orgId },
    data: {
      name: name || undefined,
      settings: settings || undefined
    }
  })
  res.json({ name: org.name, vertical: org.vertical, settings: org.settings || {} })
})

