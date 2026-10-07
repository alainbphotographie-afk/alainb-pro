(function(){
const API_URL='https://script.google.com/macros/s/AKfycbxhGcydL7Toy_zRWFfyscPdv8p4tMbf7-Vish3NnLNnZVcYIdIeHmgv2l9COlB6uOUxLQ/exec';
let timer=null,canPush=false;
const SET_KEYS=['tradeName','companyName','manager','legalForm','address','postal','city','phone','email','website','siret','ape','vat','legalNotice','accountHolder','bank','iban','bic','bankLabel','invoicePrefix','logoName','paymentTerms','footer'];
const SET_ALIAS={nomcommercial:'tradeName',raisonsociale:'companyName',responsable:'manager',dirigeant:'manager',formejuridique:'legalForm',adresse:'address',codepostal:'postal',cp:'postal',ville:'city',telephone:'phone',telephoneprofessionnel:'phone',emailprofessionnel:'email',mail:'email',siteweb:'website',site:'website',codeape:'ape',tva:'vat',mentionslegales:'legalNotice',titulaire:'accountHolder',titulairecompte:'accountHolder',banque:'bank',rib:'iban',libellevirement:'bankLabel',libellereglement:'bankLabel',prefixefactures:'invoicePrefix',prefixefacture:'invoicePrefix',logo:'logoName',conditionspaiement:'paymentTerms',piedpage:'footer',piedpagefacture:'footer'};
function nk(s){return String(s==null?'':s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}
SET_KEYS.forEach(k=>{SET_ALIAS[nk(k)]=k});
function parseSettings(rows){
const out={};if(!rows||!rows.length)return out;
const heads=Object.keys(rows[0]);
const kh=heads.find(h=>['cle','key','parametre','champ','rubrique','propriete','libelle'].includes(nk(h)));
const vh=heads.find(h=>['valeur','value'].includes(nk(h)));
if(kh&&vh){rows.forEach(r=>{const k=SET_ALIAS[nk(r[kh])];if(k&&r[vh]!==''&&r[vh]!=null)out[k]=String(r[vh])})}
else{heads.forEach(h=>{const k=SET_ALIAS[nk(h)],v=rows[0][h];if(k&&v!==''&&v!=null)out[k]=String(v)})}
return out;
}
function getKey(){let k=localStorage.getItem('abp_cle')||'';if(!k){k=prompt('Clé secrète AlainB Pro :')||'';if(k)localStorage.setItem('abp_cle',k)}return k}
function setStatus(t){const s=document.getElementById('status');if(s)s.textContent=t}
async function getJson(url){
const r=await fetch(url);const t=await r.text();
try{return JSON.parse(t)}catch(e){console.error('Réponse non JSON ('+r.status+') :',t.slice(0,300));return null}
}
const origSave=save;
save=function(){origSave();if(!canPush)return;clearTimeout(timer);timer=setTimeout(push,1500)};
async function push(){
try{setStatus('Synchronisation...');
const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'save',key:getKey(),data:S.d})});
const t=await r.text();let j=null;try{j=JSON.parse(t)}catch(e){console.error('Réponse POST non JSON :',t.slice(0,300))}
if(j&&j.error==='cle invalide'){localStorage.removeItem('abp_cle');setStatus('Clé refusée : rechargez la page');return}
if(!j||!j.ok)throw new Error(j&&j.error||'refus');
console.log('Sheets mis à jour :',j.report);
setStatus('Sauvegardé dans Google Sheets à '+new Date().toLocaleTimeString('fr-FR'));
}catch(e){console.error(e);setStatus('Erreur sauvegarde cloud (données locales conservées)')}
}
function fromTabs(j){
const d={clients:[],chantiers:[],devis:[],interventions:[],relances:[],factures:[],settings:{}};
Object.keys(j).forEach(n=>{const l=n.toLowerCase();if(!Array.isArray(j[n])||!j[n].length)return;
if(l.includes('param')){d.settings=parseSettings(j[n]);return}
const x=normalize(n,j[n]);
if(l.includes('client'))d.clients=x;else if(l.includes('chant'))d.chantiers=x;else if(l.includes('devis'))d.devis=x;
else if(l.includes('intervention'))d.interventions=x;else if(l.includes('relance'))d.relances=x;else if(l.includes('facture'))d.factures=x});
return d;
}
async function pull(){
if(!API_URL.includes('/exec'))return;
try{setStatus('Chargement cloud...');
const j=await getJson(API_URL+'?key='+encodeURIComponent(getKey()));
if(j&&j.error==='cle invalide'){localStorage.removeItem('abp_cle');setStatus('Clé refusée : rechargez la page pour la ressaisir');return}
if(!j||j.error){setStatus('Cloud illisible : mode local (voir console)');return}
const d=fromTabs(j);
if(!d.clients.length){setStatus('Cloud sans clients : mode local');return}
const st={...(S.d.settings||{}),...d.settings};
S.d={...S.d,...d,settings:st};S.file='Google Sheets';linkInvoices();
localStorage.setItem('abp_v163_data',JSON.stringify(S.d));
render();canPush=true;
setStatus('Cloud chargé : '+d.clients.length+' clients, '+d.chantiers.length+' chantiers, '+d.interventions.length+' interv., '+Object.keys(d.settings).length+' paramètres');
}catch(e){console.error(e);setStatus('Cloud injoignable : mode local')}
}
pull();
})();
