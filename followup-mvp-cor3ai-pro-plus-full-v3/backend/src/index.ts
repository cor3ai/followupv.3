import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { router as auth } from './routes/auth.js'
import { router as contacts } from './routes/contacts.js'
import { router as messages } from './routes/messages.js'
import { router as events } from './routes/events.js'
import { router as stripe } from './routes/stripe.js'
import { router as suppress } from './routes/suppressions.js'
import { router as onboarding } from './routes/onboarding.js'
import { router as internal } from './routes/internal.js'
import { router as admin } from './routes/admin.js'
import { router as emailHooks } from './routes/email_webhooks.js'
import { router as stripeEasy } from './routes/stripe_checkout.js'
import { router as org } from './routes/org.js'
import { router as analytics } from './routes/analytics.js'
import { router as revenue } from './routes/revenue.js'
import { publicRouter } from './routes/public.js'
import { seedRouter } from './routes/internal_seed.js'
const app = express()
app.use(cors()); app.use(bodyParser.json({limit:'5mb'}))
app.use('/api/auth', auth)
app.use('/api/contacts', contacts)
app.use('/api/messages', messages)
app.use('/api/events', events)
app.use('/api/stripe', stripe)
app.use('/api/suppressions', suppress)
app.use('/api/onboarding', onboarding)
app.use('/api/internal', internal)
app.use('/api/admin', admin)
app.use('/api/email', emailHooks)
app.use('/api/stripe', stripeEasy)
app.use('/api/org', org)
app.use('/api/analytics', analytics)
app.use('/api/internal/seed', seedRouter)
app.use('/api/revenue', revenue)
app.use('/u', publicRouter)
const __filename = fileURLToPath(import.meta.url); const __dirname = path.dirname(__filename)
app.use('/app', express.static(path.join(__dirname, '../../dashboard')))
app.get('/', (_req,res)=>res.json({ok:true, service:'followup-backend (cor3ai)'}))
const port = process.env.PORT || 10000; app.listen(port, ()=>console.log('Listening on', port))

