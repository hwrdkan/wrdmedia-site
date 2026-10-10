import { createPergolaScene } from './scene.js';
import rules from './rules.js';
import catalog from './catalog.json';
const $=s=>document.querySelector(s), R=rules;
const defaults={line:'operable-pergola',style:'classic',mount:'attached',finish:'bronze',widthIn:168,depthIn:144,louverAngleDeg:70,options:{led:true,fan:1}};
let cfg=R.normalize(catalog,defaults), api, night=false,plan=false;
function status(s){$('#status').textContent=s}
function saveBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function create(){if(api)api.dispose();try{api=createPergolaScene($('#stage'),catalog,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});if(!api)throw Error('WebGL unavailable');api.update(cfg);api.setNight(night);api.setPlan(plan);$('#loading').hidden=true}catch(e){$('#loading').hidden=false;$('#loading').textContent='3D needs a browser with WebGL enabled. Configuration and design saving still work.';status('3D preview unavailable on this device.')}}
function optionsSelect(sel,items,value){sel.replaceChildren(...items.map(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=x.name;return o}));sel.value=value}
function change(patch){cfg=R.normalize(catalog,{...cfg,...patch,options:{...cfg.options,...patch.options}});sync();if(api)api.update(cfg)}
function sync(){
 const line=catalog.lines.find(x=>x.id===cfg.line),eng=catalog.engineering_UNCONFIRMED,f=R.frame(catalog,cfg);
 optionsSelect($('#line'),catalog.lines,cfg.line);optionsSelect($('#style'),catalog.styles.filter(x=>line.styles.includes(x.id)),cfg.style);optionsSelect($('#mount'),((line.styleMounts&&line.styleMounts[cfg.style])||line.mounts).map(id=>({id,name:id==='attached'?'Attached to house':'Freestanding'})),cfg.mount);
 for(const [id,key] of [['width','widthIn'],['depth','depthIn']]){Object.assign($('#'+id),eng[key]);$('#'+id).value=cfg[key];$('#'+id+'-value').value=R.ftIn(cfg[key])}
 $('#louver-field').hidden=line.roof!=='louvers-operable';$('#louvers').value=cfg.louverAngleDeg;$('#louvers-value').value=cfg.louverAngleDeg+'°';
 $('#finishes').replaceChildren(...catalog.finishes.filter(x=>line.finishes.includes(x.id)).map(x=>{let b=document.createElement('button');b.className='finish';b.setAttribute('aria-pressed',String(x.id===cfg.finish));const s=document.createElement('span');s.className='swatch';s.style.background=x.roofHex?`linear-gradient(135deg,${x.hex} 50%,${x.roofHex} 50%)`:x.hex;b.append(s,document.createTextNode(x.name.replace(' (bronze frame, white roof)','')));b.onclick=()=>change({finish:x.id});return b}));
 $('#options').replaceChildren(...R.availableOptions(catalog,line,cfg.style).map(o=>{
 const div=document.createElement('div'), label=document.createElement('label');div.className='option';label.textContent=o.name;const value=cfg.options[o.id];
 if(o.perSide){const wrap=document.createElement('div');div.append(label);const sides=document.createElement('div');sides.className='sides';for(const side of R.SIDES){const b=document.createElement('button');b.textContent=side;b.setAttribute('aria-label',o.name+', '+side+' side');b.setAttribute('aria-pressed',String(value.includes(side)));b.disabled=cfg.mount==='attached'&&side==='back';b.onclick=()=>change({options:{[o.id]:value.includes(side)?value.filter(s=>s!==side):[...value,side]}});sides.append(b)}wrap.append(div,sides);return wrap}
 const input=document.createElement(o.perUnit?'select':'input');input.id='opt-'+o.id;label.htmlFor=input.id;if(o.perUnit){for(let i=0;i<=(o.max||4);i++){const el=document.createElement('option');el.value=i;el.textContent=i;input.append(el)}input.value=value;input.onchange=()=>change({options:{[o.id]:Number(input.value)}})}else{input.type='checkbox';input.checked=!!value;input.onchange=()=>change({options:{[o.id]:input.checked}})}div.append(label,input);return div;
 }));
 $('#footprint').textContent=R.ftIn(cfg.widthIn)+' × '+R.ftIn(cfg.depthIn);$('#area').textContent=f.areaSqft+' sq ft';$('#posts').textContent=f.posts+' posts';$('#summary').textContent=R.summary(catalog,cfg);const p=R.price(catalog,cfg);$('#price').textContent='$'+p.low.toLocaleString('en-US')+' to $'+p.high.toLocaleString('en-US');
}
for(const [id,key] of [['line','line'],['style','style'],['mount','mount']])$('#'+id).onchange=e=>change({[key]:e.target.value});
for(const [id,key] of [['width','widthIn'],['depth','depthIn'],['louvers','louverAngleDeg']])$('#'+id).oninput=e=>change({[key]:Number(e.target.value)});
function light(v){night=v;$('#day').setAttribute('aria-pressed',String(!v));$('#night').setAttribute('aria-pressed',String(v));api?.setNight(v)}$('#day').onclick=()=>light(false);$('#night').onclick=()=>light(true);
$('#plan').onclick=()=>{plan=!plan;$('#plan').setAttribute('aria-pressed',String(plan));api?.setPlan(plan)};$('#reset-view').onclick=()=>{plan=false;$('#plan').setAttribute('aria-pressed','false');create()};
$('#reset').onclick=()=>{cfg=R.normalize(catalog,defaults);light(false);plan=false;$('#plan').setAttribute('aria-pressed','false');history.replaceState(null,'',location.pathname+location.search);sync();create();status('Default design restored.')};
$('#save').onclick=()=>{saveBlob(new Blob([JSON.stringify({format:'pergola-studio',version:1,design:cfg},null,2)],{type:'application/json'}),'pergola-design.json');status('Editable design saved.')};
$('#open').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw Error();const p=JSON.parse(await file.text());if(p.format!=='pergola-studio'||p.version!==1||!p.design||typeof p.design!=='object'||Array.isArray(p.design))throw Error();cfg=R.normalize(catalog,p.design);sync();api?.update(cfg);status('Design opened.')}catch{status('That file is not a valid Pergola Studio design. Choose a saved JSON design.')}finally{e.target.value=''}};
$('#share').onclick=async()=>{const link=location.href.split('#')[0]+'#d'+R.encode(cfg);history.replaceState(null,'',link);try{await navigator.clipboard.writeText(link);status('Design link copied. The recipient needs access to this hosted page.')}catch{status('Design added to the address bar. Copy the URL to share it.')}};
$('#snapshot').onclick=()=>{const canvas=$('#stage canvas');if(!canvas){status('No 3D preview is available to capture.');return}canvas.toBlob(blob=>{if(blob){saveBlob(blob,'pergola-preview.png');status('Preview image saved.')}else status('Image capture failed. Try again.')},'image/png')};
const m=location.hash.match(/^#d([A-Za-z0-9_-]+)$/);if(m){const d=R.decode(catalog,m[1]);if(d)cfg=d;else status('Shared design could not be read. Showing the default design.')}
sync();create();window.addEventListener('pagehide',()=>api?.dispose());
