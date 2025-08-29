# Deploy Guide — Render + Squarespace + Stripe + n8n (+ SendGrid Events)

1) **Render**: create Web Service from `backend/` with:
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm start`
   - Add Postgres; run `npx prisma db push`.
2) **Env**: copy from `backend/.env.example`. Optional gates:
   - `EMAIL_PROVIDER=sendgrid` recommended for event tracking
   - `REQUIRE_SIGNUP_TOKEN=true` + set `ADMIN_API_KEY`
3) **SendGrid**
   - Authenticate domain.
   - Enable **Event Webhook** → POST to: `/api/email/sendgrid`
   - (Optional) add `SENDGRID_WEBHOOK_PUBLIC_KEY` for signature verify.
4) **Stripe**
   - `STRIPE_PRICE_ID` (subscription).
   - Webhook: `/api/stripe/webhook`.
5) **Squarespace**
   - Use `frontend/squarespace/signup_widget.html` or `checkout_button.html`.
6) **n8n**
   - Import workflows in `n8n/workflows/`, set env from `n8n/.env.example`.
7) **Tokens**
   - Create tokens via: `POST /api/admin/tokens` with header `x-api-key: ADMIN_API_KEY`.
   - Example body: `{ "code":"BETA-ABC123", "label":"beta", "maxUses":100, "defaultVertical":"salon" }`.

