(function(){
const API_URL='https://script.google.com/macros/s/AKfycbx5qyFkHTgJpjlzbFuNHpYhXtBLg9u3klp3fMzRKMuVtU-3d64BGrRUaC6r4HNkibRv-Q/exec';
let timer=null,canPush=false,badKey=0,pushTry=0;
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
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function getJson(url){
for(let i=0;i<2;i++){
try{const r=await fetch(url);const t=await r.text();
try{return JSON.parse(t)}catch(e){console.error('Réponse non JSON ('+r.status+') essai '+(i+1)+' :',t.slice(0,300))}
}catch(e){console.error('Réseau essai '+(i+1)+' :',e)}
if(i===0){setStatus('Cloud indisponible, nouvel essai...');await wait(3000)}
}
return null;
}
const origSave=save;
save=function(){origSave();if(!canPush)return;clearTimeout(timer);pushTry=0;timer=setTimeout(push,5000)};
function retryPush(ms){if(pushTry<3){pushTry++;clearTimeout(timer);timer=setTimeout(push,ms)}}
async function push(){
try{setStatus('Synchronisation...');
const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'save',key:getKey(),data:S.d})});
const t=await r.text();let j=null;try{j=JSON.parse(t)}catch(e){console.error('Réponse POST non JSON :',t.slice(0,300))}
if(j&&j.error==='cle invalide'){badKey++;if(badKey>=2){localStorage.removeItem('abp_cle');badKey=0;setStatus('Clé refusée : rechargez la page pour la ressaisir');return}setStatus('Clé refusée, nouvel essai...');retryPush(4000);return}
if(!j||!j.ok)throw new Error(j&&j.error||'refus');
badKey=0;pushTry=0;
console.log('Sheets mis à jour :',j.report);
setStatus('Sauvegardé dans Google Sheets à '+new Date().toLocaleTimeString('fr-FR'));
}catch(e){console.error(e);setStatus('Erreur sauvegarde cloud, nouvel essai automatique (données locales conservées)');retryPush(10000)}
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
nextInvoiceId=function(){let raw=String((S.d.settings&&S.d.settings.invoicePrefix)||'FAC'),prefix=raw.replace(/[-\s]*\d{0,4}[-\s]*$/,'')||'FAC',year=String(S.ref||'').slice(0,4)||String(new Date().getFullYear()),n=0;S.d.factures.forEach(x=>{let p=String(x.id||'').split('-');if(p.length===3&&p[0]===prefix&&p[1]===year){n=Math.max(n,Number(p[2])||0)}});return prefix+'-'+year+'-'+String(n+1).padStart(3,'0')};
/* Confidentialité : la tuile CA encaissé est retirée du tableau de bord (visible dans la page Chiffre d'affaires) */
const origDash=dash;
dash=function(){return origDash().replace(/<div class="card"><div class="label">Chiffre d\u2019affaires encaiss\u00e9<\/div>[\s\S]*?Interventions pay\u00e9es<\/div><\/div>/,'').replace('<div class="metrics">','<div class="metrics" style="grid-template-columns:repeat(3,minmax(155px,1fr))">')};
/* Page Sauvegarde & import : mention de version */
const origBackup=backup;
backup=function(){return origBackup().replace(/<b>V1\.6\.40 :<\/b>[^<]*/,'<b>V3 :</b> gestion cloud synchronis\u00e9e avec Google Sheets.').replace(/donn\u00e9es locales de V1\.6\.40\./,'donn\u00e9es locales de la V3.')};
/* Menu principal : icône de l'application et libellé */
(function(){
const mk=document.querySelector('.brand .mark');
if(mk){mk.innerHTML='<img src="AlainB-Pro-Icone-iPad.png" alt="AlainB Pro" style="width:100%;height:100%;object-fit:cover;border-radius:9px;display:block">';mk.style.background='transparent';mk.style.overflow='hidden'}
const sm=document.querySelector('.brand small');
if(sm)sm.textContent='Gestion Cloud - V3';
})();
/* Menu latéral : icônes personnalisées, toutes sur le même fond dégradé mauve vers turquoise (affichées en 24 px) */
(function(){
const D={
chantiers:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEWaVvIAAADYH/pSlent6fxzc+00r+bSpPiyOfWmp/P3DP3KX/hcpPLeI/pTm+fjU/V0dP+xxPQtf/+/Ev8AAP82uuqyU/kxu+kvwPKvS/T1Ef4/v78/v/U5xet7e+59dO7knZxFAAAAIHRSTlP9APz+//36//7/Df8UamgIAv8DBAFwFZj/apgEEChkntBlUNoAAAIrSURBVHjajZaLluIgEESbBCQ8YnRG42N3Zv//L7eaAAFGMymVBLsu3c05SkgUspaH8dlFPUebvs2i2m7HrhEzJbICHHh2L/S0IdgCVkxj90bjtBIJ+BS225CFoQI+xdhtakwExXp+8a8E7Vq/IBiY9viZmBbAbvdbdm4ZsPPU7dQ0WwBrQc51EtKDwx1Pl7EuiqxFggGzQcMbAK1lfjvM3BDsGCdrCUw3BGVAaudwdU6HESmjOhJEYk7TDDhGeMTyjukha0YPjzinAIUKKEzCSGhoCbHcQ3CSUlou17BEuNF6KOKC5tLOGaQbmq/K+UyPKiolLSmW/Q05tS4cD2oqSmEG5FKjlLQhrLtcGU2TDZm0XgKG34icIUprXTfxowepTQlEbCMBSRNLMloabcLnLaCkNAFQuCKbiS+t3jYNk1GBLGUqQBXiXcLlBbDEYf/3ClAoyRQ9mBSH/Vs1gDELIM8m95AB9U2+AmSKtiUleRKqr4B+C+gVfg/HfpXiMozCTbCFwQQgGo4AfOFXPYJ9BchzCXj+UVMGTI+9wYDbBogGLE+nS05xzjW3wDkluJzA5C5MAZwzYNYMR5hJXE5FF9tCOfxnfBI7CQ9r+Lv31da+FRcUD5SPPcQRtnxk7SCiPx2KTBw2BP/f+tj9I/wW4GFoDnbs8PWd/Uqh3+bRAVvmb4d7a74fbj4Efz6cXBAIWe6rGaujdn95+TSD1nn2db0l4Hb94mI/Ss9/6QskKRby3EUAAAAASUVORK5CYII=',
ca:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEXx7/zXIPoAAACaV/JSlek0r+Z0dO22OvWoqPPOpvj3DP22x/VcpPLeI/pTm+fjU/XKVfl0dP8tf/+/Ev8AAP82uuqyU/kxu+kvwPKvS/T1Ef4/v78/v/U5xet7e+59dO5heUHKAAAAIHRSTlP//AD9/vr9/v//Df8UamgI/wIDBAFwFZj/apgEEChknplYtp8AAAIPSURBVHjajZYLc6sgEIVXMLogRtMa87i37f//l11eyyPReibTgpyPPctMgiAyaW3/jM8m6Dnq+JQFpV2PTSXL5EgC7MKzeaOndos1oMU0Nhsap0RE4FPoZkeaDAXwKcZmV2MkIOT5w58IOLR/RlhgOuK3xOQBvd9v3rm2gF6n/Ok8z5vEtGoCskCzAi+lNkOB1lSgd/Nod5r72k4PJq2BmKb3ghJ4VQMCQKxxKudUQql3QN+v1MPDL8leWl8UqF5KWfvnBwGSVURywKsErGlSNC1DhQpY4ZEBKh1rGKm6woO2yiO5/GW4EijmHL9spiKyMbJFbfoLABS68JjOF9VehbgpHo3EFjzaA0YAVRjYVN1OBbJaQRiFhF0FdEF1D+g/CKpLHgk/POmw6IGMKoDIFvkD35k/hPADDPvbEXu6bzA8br07ZMeUDqFlkwHR8Sz2MAz+H4QKAwNtR9+HcxuFQwDcIGAuHFvOBBieuTzDMGAIhlyhixZjv9SQgPxYiYw10pbCwGXhEkNJoMtG9ZABs1yIybqITfiBbYU+bdYBRRLLJXXxhyiO/TG+iIOEIav7uc9D7cgGChfKxxHiTDa+sg4QwR8vRUucdkT+/+W1+0+YPcCQobrY6YSvW/YruH6rVwc6MnM73Wvz/XQzbvH15WShBVflnsy0O2U3y9u3GWrdzr6utwjcrl827Efu+QViNiNUVJaz7gAAAABJRU5ErkJggg==',
factures:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEWXWvIAAADYIPpSlOluc+w0r+afp/LVovmzNfX3DP3HYvjPyPhcpPKtxfTeI/pTm/fjU/V0dP8tf/+/Ev8AAP82uuqyU/kxu+kvwPKvS/T1Ef4/v78/v/U5xet7e+59dO5AJQ5jAAAAIHRSTlP9APz+/vr///4N//8U/2poCAIDBAFwFZj/apgEEChkniXGajUAAAIDSURBVHjarZYLk6IwEIQnBPMGcRfxcbd7//9fXicCmURhratrLcsk/WV6KDGQYLI2fvT3Zta9t8vsKirttm8qRYYjGYgL9+aF7jYt1oAVQ99sqB8ysQCfwjY7sjAUwKfom131C0Fznh/8maC39mdEBIZ3/JEYHoDd75d3biNgp2GdcvpJjhHDZAHwQFrXuzpdhSJrUcA8Jox2pjHz+yGnzWLHl8FaArOuRsCkHHAmRSCrIUEkJjajNd6ElzNzBwVgzIQebm4ZESoQEO+MpxyJst/dRCyyCkCq4RIZRdiAuARNT0CCtoCJbgWgUySiNRIaKnQrh0vTXs9NqxqgGiBSKUme2gfU89QuoP4FKH566j9XaJVq6y1+AlDEaz9Le0Rqn22LXlRoFYA2C1N/+BhApWoG9u9yuZRX9RbfFKr9ZA2VQCDRys0Asuu8l3yixf1wlKsASFZBevDKt9kgjwDCFiBjvRQqO0K8qYkDLCCltiUHsD2dRlYCl6VbpXwn0UGnWIHxBIZ3UVwjGb1dxztAJDGeWIlKsRAbIk78Mz6JbaJQgDX93ZehNhUDzQfKxzvEEbb1yHqDmP3LoRiJw47g/10eu79E2AMCDNXBjit83rKfKfVbPTrgkoXL4Vqbr4dLSIvPDycjFlKVazZjd2QP48unGbQeR1/nywJczl8x7Af3/AV50COZ20Fc7AAAAABJRU5ErkJggg==',
documents:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEXXIPoAAABTk+ny7PyZV/LNpvg0r+ZwdO2op/O3NfX3DP1cpPLeI/pTm+fIZfjjU/V0dP8tf/+/Ev8AAP82uuqyU/kxu+kvwPKvS/T1Ef62wfU/v78/v/U5xet7e+59dO5BZBBaAAAAIHRSTlP8AP7//P/6/f/+DRRqaP8IAgMEAXAVmP9qmP8EEChknuK4p5kAAAHvSURBVHjajZaJloMgDEVDgULBamesXWb9/7+csAQQLcM7rSK8SxI8isAKGeMOwxOinoOh3iRY280AlRxTIhlwA0/Y0dP4wRowbBrghYYpEwS8MwMNGTSsgHc2QFMDERDz+cefCeiavyAcMPX4HTEFwLTrLSs3DjDLBJ2aFoNAZ0KUFBiDAU6h47QrsmNjMgaQScZxlJKjpKSWa5YomtmSO8Zg8Uc8e3FeRluwhkeYQpzQw71tDAAfI8kFjoYZHwiIqAhwEc+jHEMID5AYLCsArQT4U4yQtcCjjiAFRRIpQtYDILVTDbIRofAHgAe/XyW9E0FsgKhVswFojdPi3zXpRjQAvRdB6hYgi6KpCNfYA9Qqgua0Yh5Qe4CuAawoXqwB5RWAlJKO98CtAYZW5BLwG5tqJ0K+Io/4hR9VAFtx/0uA+gFbALUI+MiABaYOBGynr1M6KHwezocotVGRUvScEbCHl/rIKcUe6x5qeAmknHTswOnhMjdC1LLzBZlcxX86oxnYfOkOgem4l/GFdRIWrf5135mUSyhuKG89xBltacvqIKKfNkVHHBtC/9d62/1ktgVYNFQbO67w9ZX9Cr7e6tMBl8zejvfafD/erB/cfpzMOOCj3LMZZ8fc7bz7NYOlu6vv642A2/XbJftWev4AdF8kI7PlwxMAAAAASUVORK5CYII='};
const G='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d720fa"/><stop offset="1" stop-color="#34afe6"/></linearGradient></defs><circle cx="24" cy="24" r="24" fill="url(#g)"/>';
const W=b=>G+'<g fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'+b+'</g></svg>';
const V={
dash:W('<g fill="#fff" stroke="none"><rect x="13" y="13" width="9" height="13" rx="2"/><rect x="26" y="13" width="9" height="7" rx="2"/><rect x="26" y="24" width="9" height="11" rx="2"/><rect x="13" y="30" width="9" height="5" rx="2"/></g>'),
clients:W('<circle cx="24" cy="18" r="5.5"/><path d="M13.5 35c0-6 4.7-10 10.5-10s10.5 4 10.5 10"/>'),
devis:W('<path d="M15 11h13l6 6v20H15z"/><path d="M28 11v6h6"/><path d="M19.5 24h10M19.5 29h10M19.5 33h5"/>'),
interventions:W('<path transform="translate(-2.2 2.3)" fill="#fff" stroke="none" d="M39.4 29.4L38.4 29.2L30.9 21.8L29.3 23.0L28.1 22.9L22.1 28.9L19.0 25.8L25.0 19.8L24.9 18.6L26.1 17.1L18.6 9.3L18.8 8.0L21.7 5.1L22.2 4.8L23.2 5.0L42.9 24.8L43.1 25.7L42.7 26.3ZM13.0 38.6L11.4 38.4L10.1 37.4L9.3 35.6L9.6 33.9L17.0 26.3L17.6 26.2L21.6 30.1L21.7 30.8L14.9 37.6Z"/>'),
backup:W('<g transform="translate(9 9) scale(1.25)" stroke-width="2"><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></g>'),
settings:W('<path d="M13 16h22M13 24h22M13 32h22"/><g fill="#fff" stroke="none"><circle cx="19" cy="16" r="3.6"/><circle cx="30" cy="24" r="3.6"/><circle cx="21" cy="32" r="3.6"/></g>')};
document.querySelectorAll('.nav button[data-p]').forEach(b=>{
const p=b.dataset.p,v=V[p],f=D[p];if(!v&&!f)return;
const src=v?'data:image/svg+xml;utf8,'+encodeURIComponent(v):'data:image/png;base64,'+f;
const label=b.textContent.replace(/^\s*\S+\s+/,'').replace(/\s+/g,' ').trim();
b.innerHTML='<img src="'+src+'" alt="" width="24" height="24" style="width:24px;height:24px;object-fit:contain;flex-shrink:0"><span>'+label+'</span>';
b.style.display='flex';b.style.alignItems='center';b.style.gap='10px';
});
})();
/* Apparence : boutons d'actions en icônes */
(function(){
const st=document.createElement('style');
st.textContent='.rowact{display:inline-flex;gap:6px;flex-wrap:nowrap;white-space:nowrap;align-items:center}.btn.ico{padding:0;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px}.btn.ico svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}';
document.head.appendChild(st);
const I={
fiche:'<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></svg>',
relance:'<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>',
edit:'<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
del:'<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>'};
function b(cls,a,type,id,ico,tip){return '<button class="btn ico '+cls+'" data-a="'+a+'"'+(type?' data-t="'+type+'"':'')+' data-id="'+esc(id)+'" title="'+tip+'" aria-label="'+tip+'">'+I[ico]+'</button>'}
buttons=function(type,id){
return '<span class="rowact">'+b('alt','detail',type,id,'fiche','Fiche')+(type==='client'?b('','newrelance','',id,'relance','Relance'):'')+b('alt','edit',type,id,'edit','Modifier')+b('red','del',type,id,'del','Supprimer')+'</span>'};
try{render()}catch(e){}
})();
window.abpForcePush=async function(){if(!canPush)return false;clearTimeout(timer);pushTry=0;await push();return true};
(function(){const s=document.createElement('script');s.src='ui.js?v=1';document.body.appendChild(s)})();
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
