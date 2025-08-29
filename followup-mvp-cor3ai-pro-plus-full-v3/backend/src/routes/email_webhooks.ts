import { Router } from 'express'
import crypto from 'crypto'
import { prisma } from '../prisma/client.js'

export const router = Router()

function verifySendgrid(req:any, rawBody: Buffer): boolean {
  const pub = (process.env.SENDGRID_WEBHOOK_PUBLIC_KEY || '').trim()
  if (!pub) return true // allow if not configured (MVP)
  const ts = String(req.headers['x-twilio-email-event-webhook-timestamp'] || '')
  const sigB64 = String(req.headers['x-twilio-email-event-webhook-signature'] || '')
  if (!ts || !sigB64) return false
  try {
    const sig = Buffer.from(sigB64, 'base64')
    const msg = Buffer.concat([Buffer.from(ts), rawBody])
    return crypto.verify(null, msg, {
      key: Buffer.from(pub, 'base64'),
      format: 'der',
      type: 'spki'
    }, sig)
  } catch { return false }
}

router.post('/sendgrid', (req, res, next) => {
  // Attach raw buffer for verification
  let data: any[] = []
  req.on('data', (chunk:any)=>data.push(chunk))
  req.on('end', ()=>{
    const raw = Buffer.concat(data)
    const ok = verifySendgrid(req, raw)
    if (!ok) { res.status(401).send('invalid signature'); return }
    try {
      const events = JSON.parse(raw.toString())
      Promise.all(events.map(async (ev:any) => {
        // SendGrid fields
        const type = ev.event // processed, delivered, open, click, bounce, spamreport, unsubscribe
        const email = (ev.email || '').toLowerCase()
        const ts = ev.timestamp ? new Date(ev.timestamp * 1000) : new Date()
        const orgId = ev?.custom_args?.organizationId as string | undefined
        const messageId = ev?.custom_args?.messageId as string | undefined
        const contactId = ev?.custom_args?.contactId as string | undefined

        if (!orgId) return

        await prisma.emailEvent.create({
          data: {
            organizationId: orgId,
            messageId: messageId || null,
            contactId: contactId || null,
            type: type || 'unknown',
            provider: 'sendgrid',
            email: email || null,
            payload: ev,
            occurredAt: ts
          }
        })

        // Side effects
        if (['bounce','spamreport','unsubscribe'].includes(type)) {
          if (email) {
            await prisma.suppression.upsert({
              where: { organizationId_email: { organizationId: orgId, email } },
              update: { reason: type },
              create: { organizationId: orgId, email, reason: type }
            })
          }
        }
        if (type === 'delivered' && messageId) {
          await prisma.message.update({ where: { id: messageId }, data: { metadata: { ...(ev || {}) } } }).catch(()=>{})
        }
        if ((type === 'open' || type === 'click') && contactId) {
          await prisma.contact.update({ where: { id: contactId }, data: { lastMessageAt: ts } }).catch(()=>{})
        }
      })).then(()=> res.json({ ok: true })).catch((e)=>{ console.error(e); res.status(500).json({error:'processing error'}) })
    } catch (e) {
      res.status(400).send('bad payload')
    }
  })
})

