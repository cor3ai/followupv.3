import { Router } from 'express'
import { prisma } from '../prisma/client.js'

export const router = Router()

function requireAdmin(req:any,res:any,next:any){
  if(!process.env.ADMIN_API_KEY) return res.status(500).json({error:'ADMIN_API_KEY not set'})
  if(req.headers['x-api-key'] !== process.env.ADMIN_API_KEY) return res.status(401).json({error:'unauthorized'})
  next()
}

router.use(requireAdmin)

router.post('/tokens', async (req, res) => {
  const { code, label, defaultVertical, maxUses, expiresAt } = req.body || {}
  if (!code) return res.status(400).json({ error: 'code required' })
  const tok = await prisma.signupToken.create({
    data: { code, label: label || null, defaultVertical: defaultVertical || null, maxUses: maxUses || 1, expiresAt: expiresAt ? new Date(expiresAt) : null }
  })
  res.json(tok)
})

router.get('/tokens', async (_req, res) => {
  const rows = await prisma.signupToken.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(rows)
})

router.post('/tokens/:code/disable', async (req, res) => {
  const tok = await prisma.signupToken.update({ where: { code: req.params.code }, data: { active: false } })
  res.json(tok)
})



router.get('/tokens/usage', async (_req, res) => {
  const rows = await prisma.signupToken.findMany({ orderBy: { createdAt: 'desc' } })
  const usage = rows.map(r => ({
    code: r.code, label: r.label, active: r.active, maxUses: r.maxUses, usedCount: r.usedCount, expiresAt: r.expiresAt
  }))
  res.json({ tokens: usage })
})
