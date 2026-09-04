const dbName = 'studynest-db';
let database, currentViewUrl = null, currentDoc = null, activeNav = 'all';
const $ = s => document.querySelector(s);
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }), { threshold: 0.12 }) : null;
function reveal(elements) { elements.forEach(element => { element.classList.add('reveal'); if (revealObserver) revealObserver.observe(element); else element.classList.add('is-visible'); }); }

function openDatabase() { return new Promise((resolve, reject) => { const r = indexedDB.open(dbName, 1); r.onupgradeneeded = () => r.result.createObjectStore('documents', { keyPath: 'id' }); r.onsuccess = () => { database = r.result; resolve(); }; r.onerror = () => reject(r.error); }); }
function getAll() { return new Promise((resolve, reject) => { const r = database.transaction('documents').objectStore('documents').getAll(); r.onsuccess = () => resolve(r.result.sort((a,b) => b.addedAt-a.addedAt)); r.onerror = () => reject(r.error); }); }
function esc(text) { const d=document.createElement('div');d.textContent=text;return d.innerHTML; }
function showToast(message) { const t=$('#toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600); }
function displayDate(time) { return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(new Date(time)); }

async function render() {
  const docs = await getAll(), term=$('#searchInput').value.trim().toLowerCase(), subject=$('#subjectFilter').value, type=$('#typeFilter').value;
  const filtered = docs.filter(d => (activeNav !== 'recent' || Date.now()-d.addedAt < 7*864e5) && (subject==='all'||d.subject===subject) && (type==='all'||d.type===type) && (!term || [d.name,d.label,d.subject,d.type].join(' ').toLowerCase().includes(term)));
  $('#allCount').textContent=docs.length; $('#libraryInfo').textContent = docs.length ? `${docs.length} study resource${docs.length===1?'':'s'} available.` : 'New study material will appear here soon.';
  $('#emptyState').hidden = !!filtered.length; $('#documentGrid').innerHTML = filtered.map(d => `<article class="doc-card" data-id="${d.id}"><div class="doc-preview"><span class="pdf-mark">PDF</span><span class="subject-badge">${esc(d.subject)}</span></div><div class="doc-info"><p class="doc-name" title="${esc(d.label||d.name)}">${esc(d.label||d.name)}</p><p class="doc-meta">${esc(d.type)} · ${displayDate(d.addedAt)}</p><div class="doc-actions"><button class="open-link" data-open="${d.id}">View PDF ↗</button></div></div></article>`).join(''); reveal([...document.querySelectorAll('#documentGrid .doc-card')]);
}
async function viewDocument(id) { currentDoc=(await getAll()).find(d=>d.id===id); if(!currentDoc)return; currentViewUrl=URL.createObjectURL(currentDoc.file); $('#viewerTitle').textContent=currentDoc.label||currentDoc.name; $('#pdfViewer').src=currentViewUrl; $('#viewerDialog').showModal(); }
function closeViewer(){ $('#viewerDialog').close();$('#pdfViewer').src='';if(currentViewUrl)URL.revokeObjectURL(currentViewUrl);currentViewUrl=null; }

$('#searchInput').addEventListener('input',render); ['#subjectFilter','#typeFilter'].forEach(s=>$(s).addEventListener('change',render)); document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeNav=b.dataset.filter;render()});
$('#documentGrid').onclick=async e=>{const id=e.target.dataset.open;if(id)viewDocument(id);};
$('#closeViewer').onclick=closeViewer; $('#viewerDialog').addEventListener('close',()=>{if(currentViewUrl){URL.revokeObjectURL(currentViewUrl);currentViewUrl=null;}});
function showUpgrade(){ $('#upgradeDialog').showModal(); } $('#upgradeButton').onclick=showUpgrade; $('#upgradeStripButton').onclick=showUpgrade; $('#closeUpgrade').onclick=()=>$('#upgradeDialog').close(); $('#paymentButton').onclick=()=>showToast('Payment will be available when the online site is connected.');
function ownerHash(value){let h=5381;for(let i=0;i<value.length;i++)h=((h<<5)+h)^value.charCodeAt(i);return String(h>>>0)}
$('#ownerAccess').onclick=e=>{const saved=localStorage.getItem('studynest-owner-passcode-v1');if(!saved)return; e.preventDefault();const pass=prompt('Enter the owner passcode to open the dashboard.');if(pass!==null&&ownerHash(pass)===saved){sessionStorage.setItem('studynest-owner-session','yes');location.href='admin.html'}else if(pass!==null)showToast('Incorrect owner passcode.');};
openDatabase().then(render).catch(()=>showToast('Your browser could not open the local library.'));
reveal([document.querySelector('header'), document.querySelector('.welcome-strip'), document.querySelector('.tools'), document.querySelector('.library-heading'), document.querySelector('#emptyState')]);
