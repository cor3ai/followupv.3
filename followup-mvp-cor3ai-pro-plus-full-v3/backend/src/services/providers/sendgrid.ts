import sg from '@sendgrid/mail'
sg.setApiKey(process.env.SENDGRID_API_KEY as string)

type SendgridOpts = { to: string, subject: string, html: string, fromEmail?: string, fromName?: string, customArgs?: Record<string, any> }

export async function sendWithSendgrid(opts: SendgridOpts) {
  const msg: any = {
    to: opts.to,
    from: { email: opts.fromEmail || (process.env.SENDGRID_FROM_EMAIL as string), name: opts.fromName || (process.env.SENDGRID_FROM_NAME as string) },
    subject: opts.subject,
    html: opts.html
  }
  if (opts.customArgs) msg.customArgs = opts.customArgs
  await sg.send(msg)
}

