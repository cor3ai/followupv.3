const prov=(process.env.EMAIL_PROVIDER||'sendgrid').toLowerCase();
type CommonOpts = {to:string,subject:string,html:string,fromEmail?:string,fromName?:string,customArgs?:Record<string,any>}
export async function sendEmail(o: CommonOpts){
  if(prov==='gmail'){ const {sendWithGmail}=await import('./providers/gmail.js'); return sendWithGmail(o) }
  if(prov==='outlook'){ const {sendWithOutlook}=await import('./providers/outlook.js'); return sendWithOutlook(o) }
  const {sendWithSendgrid}=await import('./providers/sendgrid.js'); return sendWithSendgrid(o)
}

