(function(){
const API_URL='https://script.google.com/macros/s/AKfycbx5qyFkHTgJpjlzbFuNHpYhXtBLg9u3klp3fMzRKMuVtU-3d64BGrRUaC6r4HNkibRv-Q/exec';
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
/* Menu latéral : icônes personnalisées (PNG 48 px intégrés, affichés en 24 px) */
(function(){
const D={
dash:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEUZnckAAABVaa4zhbsnnMg9fLdabrBfZq4nmskhpdgzfb1RmLJTb7Eco7kAAP98fH8Df/s5hrtFgME4ir0A//9/f/8/P38Kf388PLdMkcZBgL1EiMOkpN89fbdPe8BJgbvML4odAAAAIHRSTlP7APv6Yf1dFp4dBA+kDgECAp7/aQECBAIEF/F7BL7/iNB+9aEAAAJESURBVHjajZbZgqsgDIYToSAgLq1dp2fm/d/yBFABpdZctDT8XxL2AiY2WvpQvIbJaq6c455qIGmrTD2ZY1QR6FtUa3XIQ/p+CygEDh+Mm5hkBjQq2DGFNgcsctg1TiET4KveETYC+rt+IeBY/ECoAPT7401H3jugte/S5JeW5GlHAooFcSx7abXuoyold0tZ8I89aNwkrw3Fpxxm20NRtoFIakla20JZVNLa6XTKbdKFzIMBrjzkqH1RVFAtS0mWFgujtSE0zSBp7XrsikKyRV8/fcRlKwf2WScxOeVnwXynq6NDbTmZ1XN1FGQWkRzmJvVcQjn0TQ7uDiGf40wqFgHjwxvUrcYLgzcbaBfryWmmHIucmsMT4ELB3G6/MEQPYEhrhqhj0YBhP/rj4Uu6+EM2ahxyUdo2rZucO5qfYfh5or+QerMDYIsb61cZTuw0G7wmoFPa2XUC/sEiOTGoXsuPVxWA6xz8OgHnCFTQnE9VMPr2gBvCX9P8gcTOA4nk1YCoEnOARFGdvVXC5SAgUQiQK6BFE38bHClLCkjAFeASxHhUXw50gOI3A0wO6Az4FXSAZHUcqCTSJdAcBxrahV2bpNCPm7ylwE3fOh0B2V4hG6VfLplmcNbEBNJdlfIdBc6SEhvviAlk6y7jazbuHZOUwF/32dR/NuFO0/ygiCN6HZ+sA4TAR/ooPr4RAm/5s/vYH7mc4icPO03BxyQNzPHTvw50WGRTlMvkEGZ/Tqhjm0VI31EEsHM9Mi51I7yjSzX/AW8yG9PVZLb6AAAAAElFTkSuQmCC',
clients:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEUdotkgmdEfo+IdmtMEf/MCd7tVqu0P7/kOfMAJfMIAAP8VuLgJdr4FdL3///8Meb8Af38LfcJIkbZV1P8Mh8kAAAAWl9MdotgiqtsFesImtecCdL4apuQll9Avp9kbldC9od4+AAAAIHRSTlPkah6cCgcEB2rTAQObyAFtAqIHBvwA+/7+/vz8/lFRk07uZZwAAAK2SURBVHjalZaJktowDIZ/ySwse3TbrWMTx07e/y0r306AaauBHQb0rW4pmAY5sfxh2mCSYKP0xc9RB/3jG0dtGGtNE43I8EPgJD8o66O2vBGtaBGjFacfjwBP33RL6sarsBKFoBIhQudupALvE8PZ5I2lkIJAoEqAp5c98D6tgE2AJ/IlAmqEpkqg+EPudkuAV2vRF/+rV/PcCHT9DNgVtgEIxYAQr5mIwHlao34CLNaa1eQJKhAJzsBlYocKeNUiiDkl1YB5PsXsYrrwbyQDfwWu55c3Ac45gIcumcGleRGn3iecLuwG4GnQSfjthPOkiv59WtGKndSX+UPKO13cDjB+rVGgF64AM0sMNYIKiFMB1mPULy4t8+uEH8g57YD3ijkEZpmLI/D5AxLyABjrzUaBSYQDbdrsgGV5ATkMgLe0EsBixjBAgfbA/AU1Ak7FGYoDgZghydTGagd8AAMAWpEy5GV8cs1i6CPwCdcBJ5OQi2ZJhqHNGw3AIkANWvRdbYvoUgVkjnrQA+BUawoB4ku3cVP6HpDU3GzbMBHQXbi03wg4Us42IlnoJhSNQAoaWFOl89JDB3J/07UFXdLqVDawxi2WgdwY2TOVokhpLYVDWTMJkIJIWkfgSq1wuTUcCLcOqAioDszRpyW3Rm4+p6TLG+CPgATxS6egT6W9YwgDsG3GyHsAVAJie+cBikkdAPnvRtEOIF0GKI+oBILRQnRpZ+F6rSNalkD0q6fVcHp1YNa6LoHDmsmAp02VlRSOa+awyIoFw8XAACz6Ky6yw6osgByJsvPC3arcL+NqwdTWC3fLeL/unwN93e8Oyjqc3B0wHpThZHnpQR+lQLJpHp2s4SiClcjWhPHwKLazazxUlqyv8OTsRq/O6bBbnwVDIPR9f9h3jw5j0E8fHf7/4eQfH3/+AOc7rNFC8hOfAAAAAElFTkSuQmCC',
chantiers:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEWaVvIAAADYH/pSlent6fxzc+00r+bSpPiyOfWmp/P3DP3KX/hcpPLeI/pTm+fjU/V0dP+xxPQtf/+/Ev8AAP82uuqyU/kxu+kvwPKvS/T1Ef4/v78/v/U5xet7e+59dO7knZxFAAAAIHRSTlP9APz+//36//7/Df8UamgIAv8DBAFwFZj/apgEEChkntBlUNoAAAIrSURBVHjajZaLluIgEESbBCQ8YnRG42N3Zv//L7eaAAFGMymVBLsu3c05SkgUspaH8dlFPUebvs2i2m7HrhEzJbICHHh2L/S0IdgCVkxj90bjtBIJ+BS225CFoQI+xdhtakwExXp+8a8E7Vq/IBiY9viZmBbAbvdbdm4ZsPPU7dQ0WwBrQc51EtKDwx1Pl7EuiqxFggGzQcMbAK1lfjvM3BDsGCdrCUw3BGVAaudwdU6HESmjOhJEYk7TDDhGeMTyjukha0YPjzinAIUKKEzCSGhoCbHcQ3CSUlou17BEuNF6KOKC5tLOGaQbmq/K+UyPKiolLSmW/Q05tS4cD2oqSmEG5FKjlLQhrLtcGU2TDZm0XgKG34icIUprXTfxowepTQlEbCMBSRNLMloabcLnLaCkNAFQuCKbiS+t3jYNk1GBLGUqQBXiXcLlBbDEYf/3ClAoyRQ9mBSH/Vs1gDELIM8m95AB9U2+AmSKtiUleRKqr4B+C+gVfg/HfpXiMozCTbCFwQQgGo4AfOFXPYJ9BchzCXj+UVMGTI+9wYDbBogGLE+nS05xzjW3wDkluJzA5C5MAZwzYNYMR5hJXE5FF9tCOfxnfBI7CQ9r+Lv31da+FRcUD5SPPcQRtnxk7SCiPx2KTBw2BP/f+tj9I/wW4GFoDnbs8PWd/Uqh3+bRAVvmb4d7a74fbj4Efz6cXBAIWe6rGaujdn95+TSD1nn2db0l4Hb94mI/Ss9/6QskKRby3EUAAAAASUVORK5CYII=',
devis:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEVaabTK0uk/P79rcO1cdb51ise6xeNIZLcAAP9LZrV/f38/f78uTqugrtj//wAAf39/qtT///9BXbMAAABEYbb8/P05V6/O1uuXp9Xm6vRJZbdFYrVGZcCHmc5lfcGqt9wVLmA6AAAAIHRSTlMY/wQI////mQFVAgT//wECBgH+APz//////2/I/////x/u0JMAAAKZSURBVHjalVaLdtsgDIXE4DTtus2RBNjG/P9fVoAfImu6Y504TW1dxNXjYvUQdr/w13XsJyg29aPKN+7SR7W/1Vich2IFlDHqW8CV/+lhXp034xu9Kg+fARdeHZ68q83AUS7PgPeHmubhhc3TgVDb+m/fL7+xedsQavUff3AvkHFFqLqfcR6G/yLeN4Di/RzBX4XiXVVnTpk6/KkY/yJh6zNVUv+4qeu0AYji4mMHNEAnbAVMV3V7ZNROgMBiNk+04GFhXW8e827ut+u+IQLU3nsXgAHOJEzGCcAA19tvdXn08wHQzifvXI5gAmPRSMDcPy5KMGaEcyklzREMeh2T1V4CMm/VlIBM2Dl4cLgs2ACYhfqcZOIJwHdcikw6ITrdAmD6VKqtDg0flP8saG1K+UruAPCeVNtEBMRVoJIlq7XNl5aAkWdGBjDBYdAmc0icpF/5o1EAeiUpcB2C432XtAa2jHYoI0yq2RE4Xeow1Ep7Y0M0MgKTaAGhVNpBAbiIProQXwOAUmkevfZStFw9rt0PESiygzdb80FEOzgcXgFyPvOHYAW4er2KQLCUecmV7txhVmQJRFoJQgCTkgGG0L8Tt6a1l9OAsfSOKVFgM0mhF60BZNG7mqaOIfv9RjtE83GK0KZ1LD3QKiJyR7n5/goSHYa4D3JkJcjaAQvQQeFpgEIlgT4H0jlt3HroBjlAjSiljUQyrB/cSTXaHiKPqBCBTMItVWmCj6ZiUUeSIvAkMwgfS3UMeflgYzccFNTt3ggZi0DMRKsUoPMmF3DPaxUylso/IlHlOUHkwejWNjlSVKWyFWOopaod0Sr5Jsat3B+qDy/lvhwocOZAOX9knT8UyzF96tg9f7Cff3U4/3Kyvf6on19/vgCoC6WMBQSW6gAAAABJRU5ErkJggg==',
interventions:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEUjq/8qm/81cP8fo/9gZ/9QX/9QbP8I7/9XmP8ioP8Exv9Kb/8Lwv8/P/8+ff9///+hof8+f/89fv////8AAAAVpv8uh/9JaP85ef8KtP8llv8cm/9Cc/8AAP8Aqv8Af//iSSm1AAAAIHRSTlMXZATZEvFhCg2g/qplBMoCBGK7AgD+/f3+/f3+/QEDAv764fwAAAJKSURBVHjanZbZeuMgDIUhgIFmlk6L8Yr9/m9Zid0Ef9MZbhI754+wkI5MzHW5g7jq6sFdIyCN3N8j1C+i8Eq5ewDlRLM1LGst08jwG0CeRlE2sqT2a/41KHPKHgB/D/Jx27w+EDOsXQx1EFK+EL2MEaCKrgmY9/3JzaMFQL+g3gMUfvfEPEekECR90KBHAPQSbmRgn/Z9SATJ+jGsjWlzwq0HEgmANZifBTjSfhAYmXJXwgMTD0+OwHnKrIctQfIzUQETP88IHEa/lQivRASePgRBPQV9ASCtmfhjCwCPwRGQUrKlAQoxVIDg0mH+Q4ArUBF7BnymIMJv9grYVb8bGYkMCCh2chjp9Q0ABDldJJIeU0uIT9ErYJmSvkgLISBRDyIN6wPKH3hNiEkY54uuA6xWOQgg610JITg+9FsHgIolHFvKRKICfnQBChuCCErFShw8AIm9AbAjoGMV+8jnkQHaAVDvq9Xap3I8EnfAxop+npFIMXpbgna46KGSQgz3MF1gZHTVcDxVTweiRLimlcHBAGEq14jEkM+hPjjUI0GLL3mfeQ9ZQqAujQX0BwQnyfmya4hnLo2q+IIeTitu6OIaufhKeSc9eAi7AbC8UwP19A0wic+6RZdKfwPEFo0moH1LBn0fiCaQbIYeJOhvgWgzyci0OU7YIBvXGyAbGVil7zqKl2zc7gB+8saMNdVVT7dAZcbJ7hHa7oA0IHoD5RXYp2agNCOrAXojqxmKF6A/FNuxa/86dq+D3X5jsP/7q8N/vJx85/XnC0/hrdMF2icsAAAAAElFTkSuQmCC',
ca:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEXx7/zXIPoAAACaV/JSlek0r+Z0dO22OvWoqPPOpvj3DP22x/VcpPLeI/pTm+fjU/XKVfl0dP8tf/+/Ev8AAP82uuqyU/kxu+kvwPKvS/T1Ef4/v78/v/U5xet7e+59dO5heUHKAAAAIHRSTlP//AD9/vr9/v//Df8UamgI/wIDBAFwFZj/apgEEChknplYtp8AAAIPSURBVHjajZYLc6sgEIVXMLogRtMa87i37f//l11eyyPReibTgpyPPctMgiAyaW3/jM8m6Dnq+JQFpV2PTSXL5EgC7MKzeaOndos1oMU0Nhsap0RE4FPoZkeaDAXwKcZmV2MkIOT5w58IOLR/RlhgOuK3xOQBvd9v3rm2gF6n/Ok8z5vEtGoCskCzAi+lNkOB1lSgd/Nod5r72k4PJq2BmKb3ghJ4VQMCQKxxKudUQql3QN+v1MPDL8leWl8UqF5KWfvnBwGSVURywKsErGlSNC1DhQpY4ZEBKh1rGKm6woO2yiO5/GW4EijmHL9spiKyMbJFbfoLABS68JjOF9VehbgpHo3EFjzaA0YAVRjYVN1OBbJaQRiFhF0FdEF1D+g/CKpLHgk/POmw6IGMKoDIFvkD35k/hPADDPvbEXu6bzA8br07ZMeUDqFlkwHR8Sz2MAz+H4QKAwNtR9+HcxuFQwDcIGAuHFvOBBieuTzDMGAIhlyhixZjv9SQgPxYiYw10pbCwGXhEkNJoMtG9ZABs1yIybqITfiBbYU+bdYBRRLLJXXxhyiO/TG+iIOEIav7uc9D7cgGChfKxxHiTDa+sg4QwR8vRUucdkT+/+W1+0+YPcCQobrY6YSvW/YruH6rVwc6MnM73Wvz/XQzbvH15WShBVflnsy0O2U3y9u3GWrdzr6utwjcrl827Efu+QViNiNUVJaz7gAAAABJRU5ErkJggg==',
factures:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEWXWvIAAADYIPpSlOluc+w0r+afp/LVovmzNfX3DP3HYvjPyPhcpPKtxfTeI/pTm+fjU/V0dP8tf/+/Ev8AAP82uuqyU/kxu+kvwPKvS/T1Ef4/v78/v/U5xet7e+59dO5AJQ5jAAAAIHRSTlP9APz+/vr///4N//8U/2poCAIDBAFwFZj/apgEEChkniXGajUAAAIDSURBVHjarZYLk6IwEIQnBPMGcRfxcbd7//9fXicCmURhratrLcsk/WV6KDGQYLI2fvT3Zta9t8vsKirttm8qRYYjGYgL9+aF7jYt1oAVQ99sqB8ysQCfwjY7sjAUwKfom131C0Fznh/8maC39mdEBIZ3/JEYHoDd75d3biNgp2GdcvpJjhHDZAHwQFrXuzpdhSJrUcA8Jox2pjHz+yGnzWLHl8FaArOuRsCkHHAmRSCrIUEkJjajNd6ElzNzBwVgzIQebm4ZESoQEO+MpxyJst/dRCyyCkCq4RIZRdiAuARNT0CCtoCJbgWgUySiNRIaKnQrh0vTXs9NqxqgGiBSKUme2gfU89QuoP4FKH566j9XaJVq6y1+AlDEaz9Le0Rqn22LXlRoFYA2C1N/+BhApWoG9u9yuZRX9RbfFKr9ZA2VQCDRys0Asuu8l3yixf1wlKsASFZBevDKt9kgjwDCFiBjvRQqO0K8qYkDLCCltiUHsD2dRlYCl6VbpXwn0UGnWIHxBIZ3UVwjGb1dxztAJDGeWIlKsRAbIk78Mz6JbaJQgDX93ZehNhUDzQfKxzvEEbb1yHqDmP3LoRiJw47g/10eu79E2AMCDNXBjit83rKfKfVbPTrgkoXL4Vqbr4dLSIvPDycjFlKVazZjd2QP48unGbQeR1/nywJczl8x7Af3/AV50COZ20Fc7AAAAABJRU5ErkJggg==',
documents:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEXXIPoAAABTk+ny7PyZV/LNpvg0r+ZwdO2op/O3NfX3DP1cpPLeI/pTm+fIZfjjU/V0dP8tf/+/Ev8AAP82uuqyU/kxu+kvwPKvS/T1Ef62wfU/v78/v/U5xet7e+59dO5BZBBaAAAAIHRSTlP8AP7//P/6/f/+DRRqaP8IAgMEAXAVmP9qmP8EEChknuK4p5kAAAHvSURBVHjajZaJloMgDEVDgULBamesXWb9/7+csAQQLcM7rSK8SxI8isAKGeMOwxOinoOh3iRY280AlRxTIhlwA0/Y0dP4wRowbBrghYYpEwS8MwMNGTSsgHc2QFMDERDz+cefCeiavyAcMPX4HTEFwLTrLSs3DjDLBJ2aFoNAZ0KUFBiDAU6h47QrsmNjMgaQScZxlJKjpKSWa5YomtmSO8Zg8Uc8e3FeRluwhkeYQpzQw71tDAAfI8kFjoYZHwiIqAhwEc+jHEMID5AYLCsArQT4U4yQtcCjjiAFRRIpQtYDILVTDbIRofAHgAe/XyW9E0FsgKhVswFojdPi3zXpRjQAvRdB6hYgi6KpCNfYA9Qqgua0Yh5Qe4CuAawoXqwB5RWAlJKO98CtAYZW5BLwG5tqJ0K+Io/4hR9VAFtx/0uA+gFbALUI+MiABaYOBGynr1M6KHwezocotVGRUvScEbCHl/rIKcUe6x5qeAmknHTswOnhMjdC1LLzBZlcxX86oxnYfOkOgem4l/GFdRIWrf5135mUSyhuKG89xBltacvqIKKfNkVHHBtC/9d62/1ktgVYNFQbO67w9ZX9Cr7e6tMBl8zejvfafD/erB/cfpzMOOCj3LMZZ8fc7bz7NYOlu6vv642A2/XbJftWev4AdF8kI7PlwxMAAAAASUVORK5CYII=',
backup:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEUAAAAancpVaa80hLtQcrJgb7EjmcYgp9s8fLcfoMlcbrBgrdaRtNlTe8JHgsQ3hrwAuroAAP8Af/8A//80f79/f38AAH8/P78Af38qkb5VkLRCgL7///9/f/9HgLlAgLn2HqV7AAAAIHRSTlMA+fb5qyCpGPZqYAoG/v+7AwECAQQCAgQCYCL/AQJ1u1EsyIwAAAHoSURBVHjavZXbWusgEIWHwHA0sWnUbWvV939LBxIShtBYb/a66EeG9TOHHApQ6N3Qj3FaLNIuBd7hjkx0i0qRMU37mTa0aEibtNk43om7ctd9khMYcSBDhsrvxKEcJ371V8QDfkaYR/yRMHmeJs/vVs/C8c7TdKdTWPzz3T4gwmkqCzKT0Zry6k30VLi6qPOUbwCATjF2Ju/PTFQ/6LWiPWD4RDS8wGZYgMAyVH2Y8rKdwV1KwhEgODCFomkdJi3YY1lUNAMXeCun+gYXSnOGMqWQJaADhEIQdB5HlKSatJBJQsawjFdbCykeAZldelsS8CxKd2bEM5SuGtirBuRfAPn/Abv32wqw0iYJC/DdBr4BaDtJWugWYCBADbbbyQ6KgGF2fXTZFJe0/gpPlcJXBLoPm2G/HhWB6/6TeE1AlgdkAI6omCjAgFCsCegR/FA2MNCJvWIm8D0HeMsc6D0B2D0OdAj0Vqt5rY6A1RPgdUSeoS/9Pc+A4yuVlA+NE0Kop0QBzGcSTT2MiGtNwN/oNbBU9IRjvPrMfSu8tf78bqhyx59zZNdpW3NBSS+PED5+Jv9AMD/Av98ITxbgBB75sfbHzvFuEo9bv5viPVQtO928uNkQbeyzeITW8UuSuIN+zaN8CrDjfwBfixrgBQinbwAAAABJRU5ErkJggg==',
settings:'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAYFBMVEVgSakAAACeRq0pS6bEQrDdz+mcN6ZkOKKmmM7QpNYwOp6rWK9gWq4dWqwjU6n/AP8AAP9sTarYU7THSLOhS66ge8IuUai5L7mqqqrBO6vFR7EqP7/EdcP///8qKn8AcXHJqY1dAAAAIHRSTlP9AP38/P///////xISGWgBAWogaWb/jgMD/48E/wEDArT3XisAAAKPSURBVHjajVaLsqMgDAUqCIqV2tq6fdz7/3+5SXhF2u7sGYuQnJOXM1ohOeYbrstyJiwLnm7zjiL4AQiv5d4x3JcXmT8KYDueuzecl5ZVdtsHOkm2HS1hlEv3FQu494J5lufuHzgjgwlgOrteuz+AneGepyVSPfc9va5VMVZBG79zGuC6NkcWLPLSKQbjnFGGVobuQjlw+HIs1HgRNa10RYyoQEHlP6EQwwUGiuuqggSjvFS+Utopp5+GTrgFyzMrsCgxzyPjG6MgSY4I4clSqhrnWdxKgujAK/lN7kGrkuIm5k3tBLFJY0iVzkWgtlmwEbmcG9Z1zYmA79ighBSKK9JdO/jZyGN8BXTJH45OjFhSYmrOkKJWZPo4f+DF2vPzsL2pNVWBddSDsbrPph6rgkzW2SrIQ9XO2pXNKvWLe2utdinKJQmEsj0AgqqaAFMotIEjN3IRJyUIfbqtLu3o5NZ4AkG8n8RJ/I9AJIGoAioJKFBSFQAPbYB3ATXNYwlSUywLE+yzwGcvzgJJtqaAsfZYP7iyyVcB5LXojyyyWIyL1r6vAil4yXHVKMcqmTFBckFvdb5DFTpnKhmTwLd8GvG6lklzhZcibE1BuaO3ShFbEA95qvbIGrJhSPmK4CQfIgTPIg3YcpmhxfYHlsCHAD2UFOQCuiXhYOM2hkkJPL7IvK8lQPgBqJYEtNWVL7ynN5+X/lAxwFUEsBfVBcT4MvbyeOBIVFoZjsiPr/uHvO5cByrd7m1XoJUPim8VWHHL9+wLFKZW0eIqp8A/iuG36aPBUf6E5rM7yek7H5zvH/YfuX1JctzA+eGvwy+k+SA5TuT6+OcEXK9p1/11eslazptABhr1NB0JEzEfYUf5C+D7JKHEMoQrAAAAAElFTkSuQmCC'};
D.backup=D.backup.replace('Nk43om7ctd','Nk43ok7ctd');
document.querySelectorAll('.nav button[data-p]').forEach(b=>{
const f=D[b.dataset.p];if(!f)return;
const label=b.textContent.replace(/^\s*\S+\s+/,'').replace(/\s+/g,' ').trim();
b.innerHTML='<img src="data:image/png;base64,'+f+'" alt="" width="24" height="24" style="width:24px;height:24px;object-fit:contain;flex-shrink:0"><span>'+label+'</span>';
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
