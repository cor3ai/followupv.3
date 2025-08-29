import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma/client.js'
import { sendEmail } from '../services/email.js'

export const router = Router()

async function consumeTokenIfRequired(tokenCode?: string) {
  if ((process.env.REQUIRE_SIGNUP_TOKEN || 'false').toLowerCase() !== 'true') return { ok: true }
  if (!tokenCode) return { ok: false, error: 'signup token required' }
  const tok = await prisma.signupToken.findUnique({ where: { code: tokenCode } })
  if (!tok || !tok.active) return { ok: false, error: 'invalid token' }
  if (tok.expiresAt && tok.expiresAt < new Date()) return { ok: false, error: 'token expired' }
  if (tok.usedCount >= tok.maxUses) return { ok: false, error: 'token max uses reached' }
  // Note: we increment upon successful user creation later; we just validate here.
  return { ok: true, token: tok }
}

router.post('/magic-link', async (req, res) => {
  const { email, vertical, token } = req.body as { email: string, vertical?: string, token?: string }
  if (!email) return res.status(400).json({ error: 'email required' })
  let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  let tok: any = null
  if (!user) {
    const check = await consumeTokenIfRequired(token)
    if (!check.ok) return res.status(403).json({ error: check.error })
    tok = check.token
    const defaultVertical = vertical || tok?.defaultVertical || null
    const org = await prisma.organization.create({ data: { name: email.split('@')[0], ownerUserId: 'temp', vertical: defaultVertical } })
    user = await prisma.user.create({ data: { email: email.toLowerCase(), organizationId: org.id, role: 'owner' } })
    await prisma.organization.update({ where: { id: org.id }, data: { ownerUserId: user.id } })
    await prisma.onboardingProgress.create({ data: { organizationId: org.id, billing: false } })
    if (tok) await prisma.signupToken.update({ where: { id: tok.id }, data: { usedCount: { increment: 1 } } })
  } else if (vertical) {
    await prisma.organization.update({ where: { id: user.organizationId }, data: { vertical } })
  }
  const tokenJwt = jwt.sign({ userId: user.id, orgId: user.organizationId }, process.env.JWT_SECRET as string, { expiresIn: '1d' })
  const url = `${process.env.APP_URL}/app/#token=${tokenJwt}`
  await sendEmail({ to: email, subject: "Your FollowUp login link", html: `<p>Click to sign in: <a href="${url}">${url}</a></p>` })
  res.json({ ok: true })
})

router.get('/me', async (_req, res) => res.json({ ok: true }))

