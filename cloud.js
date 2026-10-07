(function(){
const API_URL='https://script.google.com/macros/s/AKfycbz7GXDVlfjtpnwZ5dWBjI4WY5SZtzRENzWdy_V8b7gDhwTPq3y53Ei92jjFSS3i4CfP8g/exec';
let timer=null,canPush=false;
function setStatus(t){const s=document.getElementById('status');if(s)s.textContent=t}
async function getJson(url){
const r=await fetch(url);const t=await r.text();
try{return JSON.parse(t)}catch(e){console.error('Réponse non JSON ('+r.status+') :',t.slice(0,300));return null}
}
const origSave=save;
save=function(){origSave();if(!canPush)return;clearTimeout(timer);timer=setTimeout(push,1500)};
async function push(){
try{setStatus('Synchronisation...');
const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'save',data:S.d})});
const t=await r.text();let j=null;try{j=JSON.parse(t)}catch(e){console.error('Réponse POST non JSON :',t.slice(0,300))}
if(!j||!j.ok)throw new Error(j&&j.error||'refus');
console.log('Sheets mis à jour :',j.report);
setStatus('Sauvegardé dans Google Sheets à '+new Date().toLocaleTimeString('fr-FR'));
}catch(e){console.error(e);setStatus('Erreur sauvegarde cloud (données locales conservées)')}
}
function fromTabs(j){
const d={clients:[],chantiers:[],devis:[],interventions:[],relances:[],factures:[]};
Object.keys(j).forEach(n=>{if(Array.isArray(j[n])&&j[n].length){const x=normalize(n,j[n]);const l=n.toLowerCase();
if(l.includes('client'))d.clients=x;else if(l.includes('chant'))d.chantiers=x;else if(l.includes('devis'))d.devis=x;
else if(l.includes('intervention'))d.interventions=x;else if(l.includes('relance'))d.relances=x;else if(l.includes('facture'))d.factures=x}});
return d;
}
async function pull(){
if(!API_URL.includes('/exec'))return;
try{setStatus('Chargement cloud...');
const j=await getJson(API_URL);
if(!j||j.error){setStatus('Cloud illisible : mode local (voir console)');return}
const d=fromTabs(j);
if(!d.clients.length){setStatus('Cloud sans clients : mode local');return}
S.d={...S.d,...d};S.file='Google Sheets';linkInvoices();
localStorage.setItem('abp_v163_data',JSON.stringify(S.d));
render();canPush=true;
setStatus('Cloud chargé : '+d.clients.length+' clients, '+d.chantiers.length+' chantiers, '+d.interventions.length+' interv.');
}catch(e){console.error(e);setStatus('Cloud injoignable : mode local')}
}
pull();
})();
