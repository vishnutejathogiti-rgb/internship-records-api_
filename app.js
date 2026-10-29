const $ = (id) => document.getElementById(id);
let page = 1, totalPages = 1, currentRows = [];
const limit = 6;
const escapeHTML = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notice(message='') { $('notice').textContent = message; }
async function api(path, options={}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers||{}) } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    const msg = result?.error?.message || `Request failed (${response.status})`;
    const detail = result?.error?.details ? ' — ' + Object.values(result.error.details).join('; ') : '';
    throw new Error(msg + detail);
  }
  return result;
}
function renderCard(job) {
  const skills = (job.skills || []).slice(0,4).map(s=>`<span class="skill">${escapeHTML(s)}</span>`).join('');
  const isOpen = job.status === 'open';
  return `<article class="job-card"><div class="job-top"><div class="company-avatar">${escapeHTML((job.company||'?').slice(0,1).toUpperCase())}</div><span class="status-badge ${isOpen?'':'closed'}">${escapeHTML(job.status)}</span></div><h3>${escapeHTML(job.title)}</h3><div class="company-name">${escapeHTML(job.company)}</div><div class="job-meta"><span>⌖ ${escapeHTML(job.location)}</span><span>${escapeHTML(job.mode)}</span><span>${escapeHTML(job.type)}</span></div><p>${escapeHTML(job.description.length>125?job.description.slice(0,125)+'…':job.description)}</p><div class="skills">${skills}</div><div class="job-actions">${isOpen && job.apply_url ? `<a class="btn btn-primary" href="${escapeHTML(job.apply_url)}" target="_blank" rel="noopener noreferrer">Apply now ↗</a>` : `<button class="btn btn-outline" disabled>${isOpen?'Contact company':'Role closed'}</button>`}<button class="btn-small" data-edit="${job.id}">Edit</button><button class="btn-small" data-delete="${job.id}" aria-label="Delete ${escapeHTML(job.title)}">Delete</button></div></article>`;
}
async function loadJobs() {
  notice('');
  $('cards').innerHTML = '<div class="loading">Loading opportunities from the API…</div>';
  const params = new URLSearchParams({page:String(page),limit:String(limit)});
  const search = $('search').value.trim(), status = $('statusFilter').value;
  if (search) params.set('search',search);
  if (status) params.set('status',status);
  try {
    const result = await api('/api/internships?'+params.toString());
    currentRows = result.data;
    const mode = $('modeFilter').value;
    const rows = mode ? currentRows.filter(j=>j.mode===mode) : currentRows;
    $('cards').innerHTML = rows.length ? rows.map(renderCard).join('') : '<div class="empty-state">No roles match these filters. Try another search.</div>';
    $('resultCount').textContent = `${result.meta.total} role${result.meta.total===1?'':'s'} found`;
    $('heroTotal').textContent = result.meta.total;
    totalPages = Math.max(1,result.meta.totalPages);
    $('pageInfo').textContent = `Page ${page} of ${totalPages}`;
    $('prevPage').disabled = page <= 1;
    $('nextPage').disabled = page >= totalPages;
  } catch (err) {
    $('cards').innerHTML = '<div class="empty-state">Could not load roles. Make sure the API server is running, then refresh.</div>';
    notice(err.message);
  }
}
function openModal(job=null) {
  $('internshipForm').reset(); $('formError').textContent=''; $('recordId').value=job?.id||'';
  $('modalTitle').textContent=job?'Edit internship':'Add an internship';
  $('saveBtn').textContent=job?'Update internship':'Save internship';
  if(job) {
    for(const key of ['title','company','location','mode','type','description','apply_url','status']) if(job[key]!==undefined) $(key).value=job[key];
    $('skills').value=(job.skills||[]).join(', ');
  } else { $('location').value='Remote'; }
  $('modal').hidden=false; document.body.style.overflow='hidden'; $('title').focus();
}
function closeModal(){ $('modal').hidden=true; document.body.style.overflow=''; }
$('openCreate').addEventListener('click',()=>openModal());
$('closeModal').addEventListener('click',closeModal); $('cancelModal').addEventListener('click',closeModal);
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('modal').hidden)closeModal()});
$('internshipForm').addEventListener('submit',async e=>{
  e.preventDefault(); $('formError').textContent='';
  const id=$('recordId').value;
  const body={title:$('title').value.trim(),company:$('company').value.trim(),location:$('location').value.trim()||'Remote',mode:$('mode').value,type:$('type').value,description:$('description').value.trim(),skills:$('skills').value.split(',').map(s=>s.trim()).filter(Boolean),apply_url:$('apply_url').value.trim(),status:$('status').value};
  $('saveBtn').disabled=true; $('saveBtn').textContent='Saving…';
  try { await api(id?`/api/internships/${id}`:'/api/internships',{method:id?'PUT':'POST',body:JSON.stringify(body)}); closeModal(); page=1; await loadJobs(); notice(id?'Internship updated successfully.':'Internship created successfully.'); }
  catch(err){$('formError').textContent=err.message;}
  finally{$('saveBtn').disabled=false;$('saveBtn').textContent=id?'Update internship':'Save internship';}
});
$('cards').addEventListener('click',async e=>{
  const edit=e.target.closest('[data-edit]'), del=e.target.closest('[data-delete]');
  if(edit){const id=Number(edit.dataset.edit);const job=currentRows.find(j=>j.id===id);if(job)openModal(job);}
  if(del){const id=Number(del.dataset.delete);if(!confirm('Delete this internship record permanently?'))return;try{await api(`/api/internships/${id}`,{method:'DELETE'});await loadJobs();notice('Internship deleted.');}catch(err){notice(err.message);}}
});
let searchTimer; $('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{page=1;loadJobs()},250)});
$('statusFilter').addEventListener('change',()=>{page=1;loadJobs()}); $('modeFilter').addEventListener('change',loadJobs);
$('resetFilters').addEventListener('click',()=>{$('search').value='';$('modeFilter').value='';$('statusFilter').value='open';page=1;loadJobs()});
$('prevPage').addEventListener('click',()=>{if(page>1){page--;loadJobs()}});
$('nextPage').addEventListener('click',()=>{if(page<totalPages){page++;loadJobs()}});
$('year').textContent=new Date().getFullYear(); loadJobs();