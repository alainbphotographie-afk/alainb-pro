(function(){
const R=document.getElementById('root');
const st=document.createElement('style');
st.textContent='.cawrap{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:24px;align-items:start}.cawrap table{min-width:0;width:auto}.cachart h3{margin:0 0 8px;font-size:14px;color:#17324c}@media(max-width:900px){.cawrap{grid-template-columns:1fr}}';
document.head.appendChild(st);
const I={
eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
money:'<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 10v.01M18 14v.01"/></svg>',
print:'<svg viewBox="0 0 24 24"><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>',
edit:'<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'};
const MAP=[['data-i','eye','Consulter'],['data-quoteview','eye','Consulter'],['data-pay','money','Règlement'],['data-print','print','Imprimer'],['data-quoteprint','print','Imprimer'],['data-quoteedit','edit','Modifier'],['data-editinvoice','edit','Modifier la facture']];

function enhanceButtons(){
if(S.p==='devis'){
R.querySelectorAll('tr').forEach(tr=>{
const act=tr.querySelector('.rowact');
if(act&&!act.querySelector('[data-quoteprint]')){
const bEdit=act.querySelector('[data-a="edit"]');
const id=bEdit?bEdit.dataset.id:'';
if(id){
const p=document.createElement('button');
p.className='btn ico warn';
p.setAttribute('data-quoteprint',id);
p.setAttribute('title','Imprimer le devis');
p.setAttribute('aria-label','Imprimer le devis');
p.innerHTML=I.print;
p.onclick=()=>printQuote(id);
const del=act.querySelector('.red');
if(del)act.insertBefore(p,del);else act.appendChild(p);
const bDet=act.querySelector('[data-a="detail"]');
if(bDet){bDet.onclick=()=>quoteView(id);bDet.setAttribute('title','Consulter le devis')}
}
}
});
}
if(S.p!=='factures'&&S.p!=='documents')return;
MAP.forEach(([a,ico,tip])=>R.querySelectorAll('button['+a+']').forEach(b=>{
if(b.classList.contains('ico'))return;
b.classList.add('ico');b.removeAttribute('style');b.innerHTML=I[ico];b.title=tip;b.setAttribute('aria-label',tip);
}));
R.querySelectorAll('td').forEach(td=>{
const bs=[...td.children].filter(c=>c.tagName==='BUTTON'&&c.classList.contains('ico'));
if(bs.length&&!td.querySelector('.rowact')){const sp=document.createElement('span');sp.className='rowact';td.textContent='';bs.forEach(b=>sp.appendChild(b));td.appendChild(sp)}
});
}

const TITLE_PAGES=['clients','chantiers','devis','interventions','ca','factures','documents','backup','settings'];
function enhanceTitle(){
if(!TITLE_PAGES.includes(S.p))return;
const nb=document.querySelector('.nav button[data-p="'+S.p+'"] img');if(!nb)return;
const h=[...R.querySelectorAll('h1')].filter(x=>!x.closest('.hero'))[0];
if(!h||h.querySelector('[data-tico]'))return;
const im=document.createElement('img');im.src=nb.src;im.alt='';im.setAttribute('data-tico','1');
im.style.cssText='width:30px;height:30px;vertical-align:middle;margin-left:10px';
h.appendChild(im);
}

function enhanceCA(){
if(S.p!=='ca')return;
const tb=[...R.querySelectorAll('table')].find(t=>/CA encaiss/i.test(t.textContent));
if(!tb||tb.closest('.cawrap'))return;
const hr=tb.querySelector('thead tr');if(!hr)return;
const ths=[...hr.children],f=n=>ths.findIndex(h=>h.textContent.toLowerCase().includes(n));
const iM=f('mois'),iC=f('ca encaiss'),iI=f('intervention');
if(iM<0||iC<0)return;
const order=[iM,iC,iI].filter(i=>i>=0);ths.forEach((_,i)=>{if(!order.includes(i))order.push(i)});
tb.querySelectorAll('tr').forEach(tr=>{const c=[...tr.children];order.forEach(i=>{if(c[i])tr.appendChild(c[i])})});
const data=[...tb.querySelectorAll('tbody tr')].map(tr=>{const c=tr.children;return{m:c[0].textContent.trim(),v:parseFloat(String(c[1].textContent).replace(/[^\d,.-]/g,'').replace(',','.'))||0}});
const mx=Math.max(0,...data.map(d=>d.v)),m=Math.max(1000,mx),step=100*Math.ceil(m/1000),ymax=Math.ceil(m/step)*step;
const W=640,H=360,L=58,RR=14,T=30,B=52,pw=W-L-RR,ph=H-T-B,n=Math.max(data.length,1),slot=pw/n,bw=Math.min(48,slot*.62);
let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="CA encaissé par mois" style="max-width:760px;font-family:Arial,sans-serif">';
for(let v=0;v<=ymax;v+=step){const y=T+ph-v/ymax*ph;s+='<line x1="'+L+'" x2="'+(W-RR)+'" y1="'+y+'" y2="'+y+'" stroke="'+(v?'#e3eaf1':'#9fb0c1')+'"/><text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="#6b7e91">'+v+'</text>'}
s+='<text x="'+L+'" y="16" font-size="12" font-weight="bold" fill="#17324c">CA encaissé (€)</text>';
data.forEach((d,i)=>{
const h=d.v/ymax*ph,x=L+slot*i+(slot-bw)/2,y=T+ph-h,cx=x+bw/2,w=d.m.split(/\s+/),mo=w[0]||'',yr=(w[1]||'').slice(-2),lab=mo.length>4?mo.slice(0,4)+'.':mo;
s+='<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+h+'" rx="4" fill="#2cbfad"><title>'+esc(d.m)+' : '+eur(d.v)+'</title></rect>';
if(d.v>0)s+='<text x="'+cx+'" y="'+(y-5)+'" text-anchor="middle" font-size="11" font-weight="bold" fill="#17324c">'+Math.round(d.v)+' €</text>';
s+='<text x="'+cx+'" y="'+(T+ph+17)+'" text-anchor="middle" font-size="11" fill="#17324c">'+esc(lab)+'</text><text x="'+cx+'" y="'+(T+ph+31)+'" text-anchor="middle" font-size="10" fill="#6b7e91">'+esc(yr)+'</text>';
});
s+='</svg>';
const box=tb.closest('.tablebox')||tb,wrap=document.createElement('div');wrap.className='cawrap';
box.parentNode.insertBefore(wrap,box);wrap.appendChild(box);
const ch=document.createElement('div');ch.className='cachart';ch.innerHTML='<h3>Évolution mensuelle du CA encaissé</h3>'+s;wrap.appendChild(ch);
}

function enhanceBackup(){
if(S.p!=='backup')return;
const tbar=R.querySelector('.toolbar');if(!tbar||R.querySelector('#forcesync'))return;
const lbl='Forcer synchro Google Sheets',bt=document.createElement('button');
bt.id='forcesync';bt.className='btn';bt.textContent=lbl;
bt.onclick=async()=>{
if(!window.abpForcePush)return;
bt.disabled=true;bt.textContent='Synchronisation…';
let ok=false;try{ok=await window.abpForcePush()}catch(e){console.error(e)}
const s=(document.getElementById('status')||{}).textContent||'';
bt.disabled=false;bt.textContent=!ok?'Cloud non chargé':/Sauvegard/.test(s)?'✓ Synchronisé':'Échec : voir le statut';
setTimeout(()=>{bt.textContent=lbl},3500);
};
tbar.appendChild(bt);
}

const isPro=x=>String(x.status||'').toLowerCase().includes('prospect');
const origClients=clients;
clients=function(){
const f=localStorage.getItem('abp_clients_filter')||'all',all=S.d.clients;let h;
if(f==='all'){h=origClients()}else{S.d.clients=all.filter(x=>isPro(x)===(f==='prospect'));try{h=origClients()}finally{S.d.clients=all}}
const b=(k,l)=>'<button class="btn alt '+(f===k?'activeview':'')+'" data-cfilter="'+k+'">'+l+'</button>';
return h.replace('<div class="viewtoggle">','<div class="viewtoggle">'+b('prospect','Prospect')+b('client','Client')+b('all','TOUS')+'</div><div class="viewtoggle">');
};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-cfilter]');if(b){localStorage.setItem('abp_clients_filter',b.dataset.cfilter);render()}});

/* Surcharge v() pour supporter id automatique et frais de déplacement */
const origV=v;
v=function(k){
const r=origV(k);
if(k==='id'&&!r&&!document.getElementById('f_id')&&document.getElementById('f_visitDate')){
let n=0;S.d.devis.forEach(x=>{const m=String(x.id||'').match(/(\d+)\s*$/);if(m)n=Math.max(n,Number(m[1]))});
return 'DEV-'+(n+1);
}
return r;
};

/* Surcharge impression devis : sans mention HT + ligne déplacement */
printQuote=function(id){
let d=S.d.devis.find(x=>cid(x.id)===cid(id));if(!d)return;
let cl=client(d.client),works=quoteWorks(d),e=S.d.settings||{},
company=e.tradeName||e.companyName||'AlainB Pro',
addr=[e.address,[e.postal,e.city].filter(Boolean).join(' ')].filter(Boolean).join('<br>'),
travel=num(d.travelFee||0);
let rows=works.map(c=>'<tr><td><b>'+esc(c.name)+'</b><br><span class="desc">'+esc(c.description||'Aucun descriptif renseigné.')+'</span></td><td style="text-align:right">'+eur(c.price)+'</td></tr>').join('');
if(travel>0){rows+='<tr><td><b>Frais de déplacement</b><br><span class="desc">Prestation hors secteur habituel</span></td><td style="text-align:right">'+eur(travel)+'</td></tr>'}
if(!rows)rows='<tr><td>Aucune prestation sélectionnée</td><td>—</td></tr>';
let w=window.open('','_blank');if(!w){alert('Fenêtre d’impression bloquée');return}
w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Devis '+esc(d.id)+'</title><style>body{font:14px Arial;margin:35px;color:#17324c;line-height:1.45}h1{border-bottom:3px solid #2cbfad;padding-bottom:12px}.company b{font-size:17px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left;vertical-align:top}th{background:#102038;color:#fff}.desc{color:#526474;white-space:pre-wrap}.total{text-align:right;font-size:18px;margin-top:20px;font-weight:bold;color:#126f68}</style></head><body><div class="company"><b>'+esc(company)+'</b>'+(addr?'<br>'+addr:'')+'</div><h1>DEVIS '+esc(d.id)+'</h1><p><b>Client :</b> '+esc(cl?.name||d.client)+'<br>'+esc(cl?.street||'')+'<br>'+esc([cl?.postal,cl?.city].filter(Boolean).join(' '))+'</p><p><b>Date d’édition :</b> '+fdate(d.created)+' &nbsp; <b>Statut :</b> '+esc(d.status)+'</p><table><tr><th>Désignation des prestations</th><th style="text-align:right;width:130px">Montant</th></tr>'+rows+'</table><div class="total">Net à payer : '+eur(d.amount)+'</div><script>window.onload=function(){window.print()}<\/script></body></html>');
w.document.close();
};

/* Surcharge impression facture : intègre le déplacement éventuel */
const origPrintInvoice=printInvoice;
printInvoice=function(id){
let f=S.d.factures.find(x=>x.id===id);if(!f){origPrintInvoice(id);return}
let dev=S.d.devis.find(d=>cid(d.client)===cid(f.client)&&num(d.travelFee)>0);
if(!dev){origPrintInvoice(id);return}
let origTotal=invoiceTotal(f),travel=num(dev.travelFee),totalWithTravel=origTotal+travel;
let cl=client(f.client),e=S.d.settings||{},
rows=(f.interventions||[]).map(i=>S.d.interventions.find(x=>cid(x.id)===cid(i))).filter(Boolean).map(x=>'<tr><td>'+fdate(x.date)+'</td><td><b>'+esc(chname(x.chantier))+'</b>'+(chantier(x.chantier)?.description?'<br><span class="desc">'+esc(chantier(x.chantier).description)+'</span>':'')+'</td><td style="text-align:right">'+eur(x.amount)+'</td></tr>').join('');
rows+='<tr><td>—</td><td><b>Frais de déplacement</b><br><span class="desc">Prestation hors secteur (selon devis '+esc(dev.id)+')</span></td><td style="text-align:right">'+eur(travel)+'</td></tr>';
let isTransfer=String(f.payment||'').toLowerCase().includes('virement'),
bankBlock=isTransfer?'<section class="rib"><h2>Coordonnées bancaires pour règlement par virement</h2>'+(e.bank?'<p><b>'+esc(e.bank)+'</b></p>':'')+(e.accountHolder?'<p><b>Intitulé du compte :</b> '+esc(e.accountHolder)+'</p>':'')+(e.iban?'<p><b>IBAN :</b> '+esc(e.iban)+'</p>':'')+(e.bic?'<p><b>BIC / SWIFT :</b> '+esc(e.bic)+'</p>':'')+(e.bankLabel?'<p>'+esc(e.bankLabel)+'</p>':'')+'</section>':'',
companyName=e.tradeName||e.companyName||'AlainB Pro',
companyAddress=[e.address,[e.postal,e.city].filter(Boolean).join(' ')].filter(Boolean).join('<br>'),
companyContact=[e.phone?'Tél. : '+e.phone:'',e.email?'E-mail : '+e.email:''].filter(Boolean).join(' · '),
vatLine=e.vat||'TVA non applicable, art. 293 B du CGI',
legalCenter=[[e.siret?'SIRET : '+esc(e.siret):'',e.ape?'APE : '+esc(e.ape):''].filter(Boolean).join(' &nbsp;·&nbsp; '),e.footer?esc(e.footer):''].filter(Boolean).join('<br>'),
w=window.open('','_blank');if(!w){alert('Fenêtre bloquée');return}
w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Facture '+esc(f.id)+'</title><style>body{font:14px Arial;margin:35px;color:#17324c;line-height:1.4}h1{border-bottom:3px solid #2cbfad;padding-bottom:12px;margin-bottom:18px}h2{font-size:15px;margin:0 0 8px}.company{margin:0 0 18px}.company b{font-size:17px}.meta{margin:14px 0}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}th{background:#102038;color:#fff}.total{text-align:right;font-size:18px;margin-top:20px;font-weight:bold}.vatamount{text-align:right;font-size:14px;color:#d95c5c;margin-top:4px}.netdue{text-align:right;font-size:19px;font-weight:bold;color:#126f68;margin-top:4px}.rib{border:2px solid #2cbfad;background:#f3fcfa;padding:14px 16px;margin-top:25px;page-break-inside:avoid}.rib p{margin:4px 0}.desc{color:#526474;font-size:12px;white-space:pre-wrap}.vatnotice{margin:10px 0;font-size:13px;color:#17324c}.footer{margin-top:20px;color:#526474;font-size:12px}.legalcenter{text-align:center;margin-top:30px;padding-top:12px;border-top:1px solid #ddd;color:#6b7e91;font-size:11px;letter-spacing:.3px}@media print{body{margin:20px}}</style></head><body><div class="company"><b>'+esc(companyName)+'</b>'+(companyAddress?'<br>'+companyAddress:'')+(companyContact?'<br>'+esc(companyContact):'')+'</div><h1>FACTURE '+esc(f.id)+'</h1><p><b>Client :</b> '+esc(cl?.name||f.client)+'<br>'+esc(cl?.street||'')+'<br>'+esc([cl?.postal,cl?.city].filter(Boolean).join(' '))+'</p><p class="meta"><b>Date :</b> '+fdate(f.date)+' &nbsp; <b>Statut :</b> '+esc(f.status)+'</p><table><tr><th>Date</th><th>Prestation</th><th style="text-align:right">Montant</th></tr>'+rows+'</table><div class="total">Total : '+eur(totalWithTravel)+'</div><div class="vatamount">TVA : '+eur(0)+'</div><div class="netdue">Montant NET à régler : '+eur(totalWithTravel)+'</div><p class="vatnotice">'+esc(vatLine)+'</p><p><b>Mode de règlement :</b> '+esc(f.payment||(f.status==='Réglée'||f.status==='Payée'?'Virement':'Non défini'))+(f.paidDate?' · Règlement reçu le '+fdate(f.paidDate):'')+'</p>'+bankBlock+(legalCenter?'<p class="legalcenter">'+legalCenter+'</p>':'')+'<script>window.onload=function(){window.print()}<\/script></body></html>');
w.document.close();
};

/* Injection du champ Frais de déplacement dans le formulaire Devis */
function enhanceQuoteForm(){
const fAmount=document.getElementById('f_amount');
if(!fAmount||document.getElementById('f_travelFee'))return;
const wrap=document.createElement('div');
wrap.style.cssText='grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0;background:#f7fafd;padding:12px;border-radius:10px;border:1px solid #dce8f2';
wrap.innerHTML='<label style="font-size:11px;font-weight:bold;color:#4a637d;text-transform:uppercase">🚗 Frais de déplacement (€)<input id="f_travelFee" type="number" step="0.01" value="0" style="padding:9px;border:1px solid #cdd9e4;border-radius:7px;margin-top:4px"></label><div style="font-size:12px;color:#5b7188;display:flex;align-items:center;line-height:1.4">Ajoutés automatiquement au montant des prestations du chantier pour calculer le Net à payer.</div>';
fAmount.closest('label').parentNode.insertBefore(wrap,fAmount.closest('label'));

const recalc=()=>{
const travel=parseFloat(document.getElementById('f_travelFee')?.value)||0;
let works=active(S.d.chantiers).filter(c=>Array.from(document.querySelectorAll('.quote-chk:checked')).some(e=>cid(e.value)===cid(c.id)));
let base=works.reduce((a,c)=>a+num(c.price),0);
let net=base+travel;
fAmount.value=net.toFixed(2).replace('.00','');
const sum=document.getElementById('quotesummary');
if(sum){sum.innerHTML='Tarif prestations : <b>'+eur(base)+'</b> + Déplacement : <b>'+eur(travel)+'</b> = Net à payer : <b style="color:#126f68">'+eur(net)+'</b>'}
};
document.getElementById('f_travelFee').oninput=recalc;
document.querySelectorAll('.quote-chk').forEach(c=>c.addEventListener('change',recalc));

/* Sauvegarde du déplacement dans le devis */
const origSaveBtn=document.getElementById('save');
if(origSaveBtn&&!origSaveBtn.dataset.boundTravel){
origSaveBtn.dataset.boundTravel='1';
const prevClick=origSaveBtn.onclick;
origSaveBtn.onclick=function(e){
const travelVal=parseFloat(document.getElementById('f_travelFee')?.value)||0;
const devId=document.getElementById('f_id')?.value;
if(prevClick)prevClick.call(this,e);
if(devId){
const d=S.d.devis.find(x=>cid(x.id)===cid(devId));
if(d){d.travelFee=travelVal;save()}
}
};
}
}

function enhance(){
try{
enhanceTitle();
enhanceButtons();
enhanceCA();
enhanceBackup();
enhanceQuoteForm();
const fv=document.getElementById('f_visitDate');
if(fv&&!document.getElementById('f_id')){
let n=0;S.d.devis.forEach(x=>{const m=String(x.id||'').match(/(\d+)\s*$/);if(m)n=Math.max(n,Number(m[1]))});
const hid=document.createElement('input');hid.type='hidden';hid.id='f_id';hid.value='DEV-'+(n+1);
(fv.closest('.modal')||document.body).appendChild(hid);
}
}catch(e){console.error(e)}
}

const obs=new MutationObserver(()=>{obs.disconnect();enhance();obs.observe(R,{childList:true,subtree:true})});
enhance();obs.observe(R,{childList:true,subtree:true});
try{render()}catch(e){}
})();
