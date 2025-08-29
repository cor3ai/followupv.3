(function(){
const api=(p,o={})=>fetch('/api'+p,{...o,headers:{'Content-Type':'application/json',...(o.headers||{}),'Authorization':localStorage.token?`Bearer ${localStorage.token}`:''}}).then(async r=>{const t=await r.text(); try{return JSON.parse(t)}catch{return t}});
function parseToken(){const h=location.hash||''; if(h.startsWith('#token=')){localStorage.token=h.replace('#token=',''); history.replaceState(null,'',location.pathname)}}
const fmtUSD=c=>`$${(Number(c||0)/100).toFixed(2)}`;
async function loadOnboarding(){const ul=document.getElementById('obList'); if(!ul) return; const ob=await api('/onboarding'); const steps=[{k:'billing',t:'Connected billing'},{k:'domainAuth',t:'Authenticated domain (SPF/DKIM)'},{k:'importContacts',t:'Imported contacts'},{k:'firstSend',t:'Sent first email'},{k:'scheduleReeng',t:'Scheduled re-engagement'}]; ul.innerHTML=''; steps.forEach(s=>{const li=document.createElement('li'); const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!ob?.[s.k]; cb.onchange=async()=>{const b={}; b[s.k]=cb.checked; await api('/onboarding',{method:'POST',body:JSON.stringify(b)})}; li.appendChild(cb); li.appendChild(document.createTextNode(' '+s.t)); ul.appendChild(li)})}
async function loadRevenue(){const s=await api('/revenue/summary'); if(!s||typeof s!=='object') return; ['rev30','revMTD','revAll'].forEach(id=>{const el=document.getElementById(id)}); const r30=document.getElementById('rev30'); if(r30) r30.textContent=fmtUSD(s.last30Cents); const rM=document.getElementById('revMTD'); if(rM) rM.textContent=fmtUSD(s.mtdCents); const rA=document.getElementById('revAll'); if(rA) rA.textContent=fmtUSD(s.allTimeCents); const rc=document.getElementById('revCoupons'); if(rc) rc.innerHTML='<strong>Top coupons:</strong> '+(s.byCoupon?.slice(0,5).map(x=>`${x.couponCode||'—'}: ${fmtUSD(x.amountCents)}`).join(' • ')||'—')}
function wireRevenueForm(){const f=document.getElementById('revForm'); if(!f) return; f.onsubmit=async(e)=>{e.preventDefault(); const d=Object.fromEntries(new FormData(f).entries()); d.amountCents=Number(d.amountCents||0); if(!d.amountCents){alert('Enter amount in cents'); return} const r=await api('/revenue',{method:'POST',body:JSON.stringify(d)}); if(r.error){alert(r.error);return} f.reset(); loadRevenue() }}
async function loadToday(){const list=document.getElementById('list'); if(!list) return; list.innerHTML='Loading...'; const items=await api('/messages/today'); list.innerHTML=''; items.forEach(m=>{const el=document.createElement('div'); el.className='card'; el.innerHTML=`<div><strong>${m.kind.toUpperCase()}</strong> — <small>${m.contact?.name||m.contact?.email||'Unknown'}</small></div><small>Status: ${m.status}</small><textarea>${m.body}</textarea><div><button class="send">Approve & Send Email</button></div>`; el.querySelector('.send').onclick=async()=>{const r=await api(`/messages/${m.id}/approve-send`,{method:'POST',body:JSON.stringify({})}); if(r.error) alert(r.error); loadToday(); loadOnboarding()}; list.appendChild(el)})}
function handleCompose(){const f=document.getElementById('composeForm'); if(!f) return; f.onsubmit=async(e)=>{e.preventDefault(); const d=Object.fromEntries(new FormData(f).entries()); if(d.context){try{d.context=JSON.parse(d.context)}catch{alert('Context must be JSON'); return}} const msg=await api('/messages/generate',{method:'POST',body:JSON.stringify(d)}); const wrap=document.getElementById('drafts'); const el=document.createElement('div'); el.className='card'; el.innerHTML=`<div><strong>${msg.kind.toUpperCase()}</strong></div><textarea>${msg.body}</textarea><div><button class="send">Approve & Send Email</button></div>`; el.querySelector('.send').onclick=async()=>{const r=await api(`/messages/${msg.id}/approve-send`,{method:'POST',body:JSON.stringify({})}); if(r.error) alert(r.error); el.remove(); loadToday(); loadOnboarding()}; wrap.prepend(el); f.reset() }}
const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function previewCSV(rows,headers){const wrap=document.getElementById('csvPreview'); const table=document.createElement('table'); const thead=document.createElement('thead'); const trh=document.createElement('tr'); headers.forEach(h=>{const th=document.createElement('th'); th.textContent=h; trh.appendChild(th)}); thead.appendChild(trh); table.appendChild(thead); const tb=document.createElement('tbody'); rows.forEach(r=>{const tr=document.createElement('tr'); let ok=true; headers.forEach((h,i)=>{const td=document.createElement('td'); const v=r[i]||''; td.textContent=v; tr.appendChild(td); if(h==='email'&&!emailRe.test(String(v).toLowerCase())) ok=false}); tr.className=ok?'':'row-bad'; tb.appendChild(tr)}); table.appendChild(tb); wrap.innerHTML=''; wrap.appendChild(table)}
function wireCSV(){const f=document.getElementById('csvFile'); const btn=document.getElementById('btnImport'); const status=document.getElementById('importStatus'); let parsed=[]; f.onchange=()=>{const file=f.files[0]; if(!file){btn.disabled=true; return} const reader=new FileReader(); reader.onload=()=>{const text=String(reader.result||'').replace(/\r/g,''); const lines=text.split('\n').filter(x=>x.trim().length>0); if(!lines.length){btn.disabled=true;return} const headers=lines[0].split(',').map(h=>h.trim().toLowerCase()); const rows=lines.slice(1).map(l=>l.split(',').map(c=>c.trim())).filter(r=>r.length>=1); previewCSV(rows,headers); parsed=rows.map(r=>({email:r[0],name:r[1]||''})).filter(x=>emailRe.test((x.email||'').toLowerCase())); status.textContent=`${parsed.length} valid rows`; btn.disabled=parsed.length===0 }; reader.readAsText(file)}; btn.onclick=async()=>{if(!parsed.length){alert('No valid rows'); return} const r=await api('/contacts/import',{method:'POST',body:JSON.stringify({contacts:parsed})}); status.textContent=r.ok?`Imported: ${r.created}, skipped: ${r.skipped}`: (r.error||'Import error'); loadOnboarding() } }
function wireSeed(){const b=document.getElementById('btnSeed'); if(!b) return; b.onclick=async()=>{const r=await api('/internal/seed',{method:'POST',body:JSON.stringify({})}); alert(r.ok?`Loaded ${r.created} contacts and ${r.drafts} drafts.`:'Error loading sample data'); loadToday(); loadOnboarding() }}
async function loadSuppressions(){const l=document.getElementById('supList'); if(!l) return; const rows=await api('/suppressions'); l.innerHTML=''; rows.forEach(x=>{const div=document.createElement('div'); div.textContent=`${x.email} — ${x.reason||''}`; l.appendChild(div)})}
function wireSuppForm(){const f=document.getElementById('supForm'); if(!f) return; f.onsubmit=async(e)=>{e.preventDefault(); const d=Object.fromEntries(new FormData(f).entries()); const r=await api('/suppressions',{method:'POST',body:JSON.stringify(d)}); if(r.error) alert(r.error); f.reset(); loadSuppressions() }}
function init(){parseToken(); loadOnboarding(); loadRevenue(); wireRevenueForm(); loadToday(); handleCompose(); wireCSV(); wireSeed(); loadSuppressions(); wireSuppForm() }
init();
})();

async function loadOrgSettings(){
  const data = await api('/org/settings')
  const s = (data && data.settings) || {}
  const form = document.getElementById('setupForm')
  if (form){
    form.name.value = data?.name || ''
    form.fromName.value = s.fromName || ''
    form.fromEmail.value = s.fromEmail || ''
    // Hide if already set
    if (form.name.value && form.fromName.value && form.fromEmail.value) form.parentElement.style.display='none'
    form.onsubmit = async (e)=>{
      e.preventDefault()
      const body = { name: form.name.value, settings: { ...(s||{}), fromName: form.fromName.value, fromEmail: form.fromEmail.value } }
      const r = await api('/org/settings', { method: 'POST', body: JSON.stringify(body) })
      if (r?.settings?.fromEmail) { form.parentElement.style.display='none' }
    }
  }
}
(function(){ const _init = window.init; window.init = async function(){ if(_init) _init(); await loadOrgSettings(); } })();

async function loadUsage(){
  const u = await api('/analytics/usage')
  const t = document.getElementById('usageText')
  const bar = document.getElementById('usageBar')
  if(!u || !t || !bar) return
  const sent = Number(u.monthSent||0), cap = Math.max(1, Number(u.monthCap||0))
  const pct = Math.min(100, Math.round(sent*100/cap))
  t.textContent = `This month: ${sent} / ${cap}`
  bar.style.width = pct + '%'
}

function fmtDate(s){
  try{ return new Date(s).toLocaleString() } catch { return s }
}
async function loadEvents(){
  const el = document.getElementById('eventsList'); if(!el) return
  el.textContent = 'Loading…'
  const items = await api('/analytics/events/recent')
  if(!Array.isArray(items) || items.length===0){ el.textContent = 'No events yet.'; return }
  const container = document.createElement('div')
  items.forEach(ev => {
    const row = document.createElement('div')
    row.className = 'card'
    const type = String(ev.type||'').toUpperCase()
    const email = ev.email || '—'
    const when = fmtDate(ev.occurredAt || ev.createdAt)
    row.innerHTML = `<strong>${type}</strong> — <small>${email}</small><div class="muted">${when}</div>`
    container.appendChild(row)
  })
  el.innerHTML = ''
  el.appendChild(container)
}

;(function(){ const _init = window.init; window.init = async function(){ if(_init) _init(); await loadUsage(); await loadEvents(); } })();
