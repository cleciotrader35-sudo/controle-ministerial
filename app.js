const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
const todayISO = () => new Date().toISOString().slice(0,10);
const isConfigured = () => SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('COLE_AQUI') && !SUPABASE_ANON_KEY.includes('COLE_AQUI');
let sb = null, user = null, profile = null, view = 'dashboard', editing = null, editingEvent = null, selectedLeader = '';
if (isConfigured()) sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function ageKey(m){
  if(!m.data_nascimento) return 99999;
  const now = new Date();
  const b = new Date(m.data_nascimento+'T00:00:00');
  let n = new Date(now.getFullYear(), b.getMonth(), b.getDate());
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if(n < t) n.setFullYear(now.getFullYear()+1);
  return Math.ceil((n-t)/86400000);
}
function fileSafe(s){ return String(s||'relatorio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'_').toLowerCase(); }
function triggerDownload(name, content, type='application/json'){
  const blob = new Blob([content], {type});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

async function init(){
  if(!isConfigured()) return renderConfigWarning();
  const {data:{session}} = await sb.auth.getSession();
  user = session?.user || null;
  if(user) await loadProfile();
  render();
}
async function loadProfile(){
  let {data,error}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();
  if(error) throw error;
  if(!data){
    const username = user.email || 'usuario';
    const inserted = await sb.from('profiles').insert({id:user.id, username, role:'usuario', needs_change:false}).select('*').single();
    if(inserted.error) throw inserted.error;
    data=inserted.data;
  }
  profile=data;
  if(profile.needs_change) view='password';
}
function renderConfigWarning(){ $('#app').innerHTML=`<div class="login-wrap"><div class="login-card"><div class="logo-min">⚙️</div><h1>Configurar Supabase</h1><div class="setup-warning">Abra o arquivo <b>supabase-config.js</b> e cole a URL e a chave anon public do seu Supabase.</div><p>Depois crie as tabelas usando o arquivo <b>supabase_schema.sql</b>.</p></div></div>`; }
function render(){ if(!user) return renderLogin(); if(view==='password') return renderChangePass(); renderApp(); }
function renderLogin(){ $('#app').innerHTML=`<div class="login-wrap"><div class="login-card"><div class="logo-min">⛪</div><h1>Controle Ministerial</h1><div id="msg"></div><div class="field"><label>Email cadastrado no Supabase</label><input id="loginUser" type="email" placeholder="exemplo@email.com" autocomplete="username"></div><div class="field"><label>Senha</label><input id="loginPass" type="password" placeholder="Senha criada no Supabase" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()"></div><button class="btn primary" onclick="doLogin()">Entrar no sistema</button><p class="small">Use o email e a senha criados em Authentication &gt; Users no Supabase.</p></div></div>`; }
async function doLogin(){
  const msg = $('#msg');
  const email = ($('#loginUser')?.value || '').trim().toLowerCase();
  const p = ($('#loginPass')?.value || '').trim();
  if(!email || !p) return msg.innerHTML = '<div class="error">Informe o email e a senha.</div>';
  if(!email.includes('@')) return msg.innerHTML = '<div class="error">Digite o email completo criado no Supabase.</div>';
  msg.innerHTML = '<div class="info">Verificando login no Supabase...</div>';
  try{
    const { data, error } = await sb.auth.signInWithPassword({ email, password:p });
    if(error){
      let detalhe = error.message || 'Erro desconhecido';
      let dica = detalhe.toLowerCase().includes('invalid login credentials') ? 'Credenciais inválidas. Redefina a senha desse usuário no Supabase e tente novamente.' : 'Confira se o usuário existe no Authentication > Users e se este site usa o mesmo projeto Supabase.';
      if(detalhe.toLowerCase().includes('email not confirmed')) dica='Confirme o email do usuário no Supabase.';
      msg.innerHTML = `<div class="error"><b>Não foi possível entrar.</b><br>${esc(detalhe)}<br><span class="small">${esc(dica)}</span></div>`; return;
    }
    user = data.user;
    try{ await loadProfile(); }catch(e){ msg.innerHTML = `<div class="error"><b>Login aceito, mas faltam tabelas/permissões.</b><br>${esc(e.message || e)}<br><span class="small">Execute o supabase_schema.sql no SQL Editor.</span></div>`; return; }
    render();
  }catch(e){ msg.innerHTML = `<div class="error"><b>Erro inesperado.</b><br>${esc(e.message || e)}</div>`; }
}
async function logout(){ await sb.auth.signOut(); user=null; profile=null; view='dashboard'; render(); }
function renderChangePass(){ $('#app').innerHTML=`<div class="login-wrap"><div class="login-card"><div class="logo-min">🔐</div><h1>Definir senha permanente</h1><div id="msg"></div><div class="field"><label>Nova senha</label><input id="p1" type="password"></div><div class="field"><label>Confirmar senha</label><input id="p2" type="password"></div><button class="btn primary" onclick="savePass()">Salvar senha</button></div></div>`; }
async function savePass(){ const p1=$('#p1').value,p2=$('#p2').value; if(p1.length<6||p1!==p2) return $('#msg').innerHTML='<div class="error">As senhas precisam ser iguais e ter no mínimo 6 caracteres.</div>'; const {error}=await sb.auth.updateUser({password:p1}); if(error) return $('#msg').innerHTML='<div class="error">Erro ao alterar senha.</div>'; await sb.from('profiles').update({needs_change:false}).eq('id',user.id); profile.needs_change=false; view='dashboard'; render(); }

function renderApp(){
  $('#app').innerHTML=`<div class="layout"><aside class="sidebar"><div class="brand"><div class="logo-min">✝</div><div><h2>Marcos</h2><p>Controle Ministerial</p></div></div><div class="nav">
    <button class="btn ${view==='dashboard'?'active':''}" onclick="view='dashboard';renderDashboard()">📋 Membros</button>
    <button class="btn ${view==='form'?'active':''}" onclick="editing=null;view='form';renderForm()">➕ Novo cadastro</button>
    <button class="btn ${view==='leaders'?'active':''}" onclick="view='leaders';renderLeaders()">👥 Líderes</button>
    <button class="btn ${view==='events'?'active':''}" onclick="view='events';renderEvents()">🗓️ Eventos</button>
    <button class="btn" onclick="openImportXLSX()">📥 Importar XLSX</button>
    <button class="btn" onclick="exportBackup()">💾 Exportar Banco</button>
    <button class="btn" onclick="openImportBackup()">♻️ Importar Banco</button>
    <button class="btn ${view==='users'?'active':''}" onclick="view='users';renderUsers()">🔐 Usuários</button>
    <button class="btn" onclick="exportAllPDF()">📄 Exportar PDF</button>
    <button class="btn" onclick="exportAllXLSX()">📊 Exportar Excel</button>
    <button class="btn" onclick="logout()">🚪 Sair</button>
  </div></aside><main class="main" id="main"></main><input id="xlsxFile" type="file" accept=".xlsx,.xls" hidden onchange="importXLSX(event)"><input id="backupFile" type="file" accept=".json" hidden onchange="importBackup(event)"></div>`;
  if(view==='form') renderForm(); else if(view==='leaders') renderLeaders(); else if(view==='events') renderEvents(); else if(view==='users') renderUsers(); else renderDashboard();
}

async function getMembers(){ const {data,error}=await sb.from('membros').select('*').order('nome',{ascending:true}); if(error){ alert('Erro ao carregar membros: '+error.message); return []; } return data||[]; }
async function getEvents(){ const {data,error}=await sb.from('eventos').select('*').order('data_evento',{ascending:true}); if(error){ alert('Erro ao carregar eventos: '+error.message); return []; } return data||[]; }

async function renderDashboard(){
  view='dashboard'; const data=await getMembers(); const events=await getEvents();
  const upcoming = events.filter(e => e.data_evento >= todayISO()).slice(0,4);
  $('#main').innerHTML=`<div class="topbar"><div><h1>Painel de Membros</h1><p>Controle ministerial da recepção com cadastros, eventos, líderes, backup e relatórios.</p></div><button class="btn primary" onclick="editing=null;view='form';renderForm()">Novo membro</button></div>
  <div class="cards"><div class="stat"><p>Total</p><b>${data.length}</b></div><div class="stat green"><p>Ativos</p><b>${data.filter(m=>!m.data_saida).length}</b></div><div class="stat red"><p>Saíram</p><b>${data.filter(m=>m.data_saida).length}</b></div></div>
  <div class="dash-grid"><div class="birthday-card"><h3>🎂 Aniversariantes do mês</h3><p>${birthdayMonthHTML(data)}</p></div><div class="birthday-card next"><h3>⭐ Próximo aniversário</h3><p>${nextBirthdayHTML(data)}</p></div><div class="birthday-card warm"><h3>🗓️ Eventos próximos</h3><p>${upcoming.length?upcoming.map(e=>`<b>${esc(e.titulo)}</b> — ${fmt(e.data_evento)} ${esc(e.horario||'')}`).join('<br>'):'Nenhum evento cadastrado para os próximos dias.'}</p></div><div class="birthday-card safe"><h3>💾 Segurança dos dados</h3><p>Os cadastros ficam salvos online no Supabase. Use Exportar Banco para fazer backup em JSON.</p></div></div>
  <section class="panel"><div class="toolbar"><input id="q" placeholder="Buscar por nome, líder, contato, instagram ou indicação"><select id="status"><option value="todos">Todos</option><option value="ativos">Ativos</option><option value="sairam">Saíram</option></select><button class="btn" onclick="drawRows()">Filtrar</button></div><div id="rows"></div></section>`;
  drawRows(data);
}
function birthdayMonthHTML(data){ const month=new Date().getMonth(); const b=data.filter(m=>m.data_nascimento&&new Date(m.data_nascimento+'T00:00:00').getMonth()===month).sort((a,b)=>new Date(a.data_nascimento)-new Date(b.data_nascimento)); return b.length?b.map(m=>`<b>${esc(m.nome)}</b> — ${fmt(m.data_nascimento)}`).join('<br>'):'Nenhum aniversariante cadastrado neste mês.'; }
function nextBirthdayHTML(data){ const next=data.filter(m=>m.data_nascimento).sort((a,b)=>ageKey(a)-ageKey(b))[0]; return next?`<b>${esc(next.nome)}</b><br>${fmt(next.data_nascimento)}<br><span class="small">Faltam ${ageKey(next)} dia(s)</span>`:'Cadastre datas de nascimento para aparecer aqui.'; }
async function drawRows(prefetched){ const all=prefetched||await getMembers(); const q=($('#q')?.value||'').toLowerCase(), s=$('#status')?.value||'todos'; const data=all.filter(m=>(!q||[m.nome,m.contato,m.endereco,m.lider,m.instagram,m.indicacao].join(' ').toLowerCase().includes(q))&&(s==='todos'||(s==='ativos'&&!m.data_saida)||(s==='sairam'&&m.data_saida))); $('#rows').innerHTML=table(data,true); }
function table(data,acts=false){ return `<div class="table-wrap"><table class="table"><thead><tr><th>Nome</th><th>Líder</th><th>Contato</th><th>Instagram</th><th>Indicação</th><th>Nascimento</th><th>Entrada</th><th>Saída</th><th>Status</th>${acts?'<th>Ações</th>':''}</tr></thead><tbody>${data.map(m=>`<tr><td><b>${esc(m.nome)}</b><br><span class="small">${esc(m.endereco||'')}</span></td><td>${esc(m.lider||'-')}</td><td>${esc(m.contato||'')}</td><td>${esc(m.instagram||'-')}</td><td>${esc(m.indicacao||'-')}</td><td>${fmt(m.data_nascimento)}</td><td>${fmt(m.data_entrada)}</td><td>${fmt(m.data_saida)}</td><td><span class="badge ${m.data_saida?'off':'ok'}">${m.data_saida?'Saiu':'Ativo'}</span></td>${acts?`<td class="actions"><button class="btn" onclick="editMember('${m.id}')">Editar</button><button class="btn" onclick='exportPDF([${JSON.stringify(m)}],"membro_${fileSafe(m.nome)}")'>PDF</button><button class="btn" onclick='exportXLSX([${JSON.stringify(m)}],"membro_${fileSafe(m.nome)}")'>Excel</button><button class="btn red" onclick="delMember('${m.id}')">Excluir</button></td>`:''}</tr>`).join('')||`<tr><td colspan="${acts?10:9}">Nenhum membro cadastrado ainda.</td></tr>`}</tbody></table></div>`; }
async function editMember(id){ const {data}=await sb.from('membros').select('*').eq('id',id).single(); editing=data; view='form'; renderForm(); }
async function delMember(id){ if(!confirm('Excluir este cadastro?')) return; const {error}=await sb.from('membros').delete().eq('id',id); if(error) alert(error.message); renderDashboard(); }
function renderForm(){ const m=editing||{}; $('#main').innerHTML=`<div class="topbar"><div><h1>${editing?'Editar membro':'Novo membro'}</h1><p>Preencha os dados da Recepção com organização.</p></div><button class="btn" onclick="view='dashboard';renderDashboard()">← Voltar</button></div><section class="panel"><div class="form-grid"><div class="field"><label>Nome completo *</label><input id="nome" value="${esc(m.nome||'')}"></div><div class="field"><label>Nome do líder</label><input id="lider" value="${esc(m.lider||'')}"></div><div class="field"><label>Número para contato</label><input id="contato" value="${esc(m.contato||'')}"></div><div class="field"><label>Instagram</label><input id="instagram" value="${esc(m.instagram||'')}" placeholder="@usuario"></div><div class="field"><label>Indicação</label><input id="indicacao" value="${esc(m.indicacao||'')}" placeholder="Quem indicou/convidou"></div><div class="field"><label>Data de nascimento</label><input id="nascimento" type="date" value="${esc(m.data_nascimento||'')}"></div><div class="field full"><label>Endereço</label><input id="endereco" value="${esc(m.endereco||'')}"></div><div class="field"><label>Data de entrada na recepção *</label><input id="entrada" type="date" value="${esc(m.data_entrada||'')}"></div><div class="field"><label>Data de saída da recepção</label><input id="saida" type="date" value="${esc(m.data_saida||'')}"></div><div class="field full"><label>Observações</label><textarea id="obs" rows="5">${esc(m.observacoes||'')}</textarea></div></div><button class="btn primary" onclick="saveMember()">Salvar cadastro</button></section>`; }
async function saveMember(){ const item={user_id:user.id,nome:$('#nome').value.trim(),lider:$('#lider').value.trim(),contato:$('#contato').value.trim(),instagram:$('#instagram').value.trim(),indicacao:$('#indicacao').value.trim(),data_nascimento:$('#nascimento').value||null,endereco:$('#endereco').value.trim(),data_entrada:$('#entrada').value||null,data_saida:$('#saida').value||null,observacoes:$('#obs').value.trim()}; if(!item.nome||!item.data_entrada) return alert('Preencha nome e data de entrada.'); let res=editing?.id?await sb.from('membros').update(item).eq('id',editing.id):await sb.from('membros').insert(item); if(res.error) return alert('Erro ao salvar: '+res.error.message); editing=null; view='dashboard'; renderDashboard(); }

async function renderLeaders(){ view='leaders'; const data=await getMembers(); const leaders=[...new Set(data.map(m=>m.lider).filter(Boolean))].sort(); selectedLeader=selectedLeader||leaders[0]||''; const group=data.filter(m=>m.lider===selectedLeader); $('#main').innerHTML=`<div class="topbar"><div><h1>Líderes</h1><p>Visualize os membros vinculados a cada líder.</p></div></div><div class="leaders-grid"><section class="panel"><h3>Nomes dos líderes</h3><br><div class="leader-list">${leaders.map(l=>`<button class="leader-item ${l===selectedLeader?'active':''}" onclick="selectedLeader='${esc(l)}';renderLeaders()">${esc(l)} <span class="small">(${data.filter(m=>m.lider===l).length})</span></button>`).join('')||'<p>Nenhum líder cadastrado.</p>'}</div></section><section class="panel"><h3>${esc(selectedLeader||'Selecione um líder')}</h3><p class="small">Membros vinculados</p><div class="actions"><button class="btn" onclick="exportLeaderPDF()">PDF deste líder</button><button class="btn" onclick="exportLeaderXLSX()">Excel deste líder</button></div><br>${table(group,false)}</section></div>`; }

async function renderEvents(){ view='events'; const events=await getEvents(); $('#main').innerHTML=`<div class="topbar"><div><h1>Eventos</h1><p>Cadastre eventos da recepção e acompanhe os próximos compromissos.</p></div></div><section class="panel"><h3>${editingEvent?'Editar evento':'Novo evento'}</h3><div class="form-grid"><div class="field"><label>Título *</label><input id="evTitulo" value="${esc(editingEvent?.titulo||'')}"></div><div class="field"><label>Data *</label><input id="evData" type="date" value="${esc(editingEvent?.data_evento||'')}"></div><div class="field"><label>Horário</label><input id="evHora" value="${esc(editingEvent?.horario||'')}" placeholder="19:30"></div><div class="field"><label>Local</label><input id="evLocal" value="${esc(editingEvent?.local||'')}"></div><div class="field full"><label>Descrição</label><textarea id="evDesc" rows="3">${esc(editingEvent?.descricao||'')}</textarea></div></div><button class="btn primary" onclick="saveEvent()">Salvar evento</button> ${editingEvent?'<button class="btn" onclick="editingEvent=null;renderEvents()">Cancelar edição</button>':''}</section><br><section class="panel"><h3>Eventos cadastrados</h3><div class="table-wrap"><table class="table"><thead><tr><th>Título</th><th>Data</th><th>Horário</th><th>Local</th><th>Descrição</th><th>Ações</th></tr></thead><tbody>${events.map(e=>`<tr><td><b>${esc(e.titulo)}</b></td><td>${fmt(e.data_evento)}</td><td>${esc(e.horario||'-')}</td><td>${esc(e.local||'-')}</td><td>${esc(e.descricao||'-')}</td><td class="actions"><button class="btn" onclick="editEvent('${e.id}')">Editar</button><button class="btn red" onclick="delEvent('${e.id}')">Excluir</button></td></tr>`).join('')||'<tr><td colspan="6">Nenhum evento cadastrado.</td></tr>'}</tbody></table></div></section>`; }
async function saveEvent(){ const item={user_id:user.id,titulo:$('#evTitulo').value.trim(),data_evento:$('#evData').value||null,horario:$('#evHora').value.trim(),local:$('#evLocal').value.trim(),descricao:$('#evDesc').value.trim()}; if(!item.titulo||!item.data_evento) return alert('Preencha título e data.'); const res=editingEvent?.id?await sb.from('eventos').update(item).eq('id',editingEvent.id):await sb.from('eventos').insert(item); if(res.error) return alert(res.error.message); editingEvent=null; renderEvents(); }
async function editEvent(id){ const {data}=await sb.from('eventos').select('*').eq('id',id).single(); editingEvent=data; renderEvents(); }
async function delEvent(id){ if(!confirm('Excluir este evento?')) return; await sb.from('eventos').delete().eq('id',id); renderEvents(); }

function renderUsers(){ $('#main').innerHTML=`<div class="topbar"><div><h1>Usuários</h1><p>Controle de acesso via Supabase Auth.</p></div></div><section class="panel"><h3>Usuário logado</h3><p><b>Email:</b> ${esc(user.email)}</p><p><b>ID:</b> <span class="small">${esc(user.id)}</span></p><p><b>Perfil:</b> ${esc(profile?.role||'usuario')}</p><div class="setup-warning">Para criar novos usuários: Supabase &gt; Authentication &gt; Users &gt; Add user. Depois o usuário entra com o email e senha cadastrados.</div><button class="btn primary" onclick="view='password';renderChangePass()">Alterar minha senha</button></section>`; }

function rows(data){ return data.map(m=>({'Nome do membro':m.nome,'Nome do líder':m.lider,'Número para contato':m.contato,'Instagram':m.instagram,'Indicação':m.indicacao,'Data de nascimento':fmt(m.data_nascimento),'Data de entrada':fmt(m.data_entrada),'Data de saída':fmt(m.data_saida),'Endereço':m.endereco,'Observações':m.observacoes,'Status':m.data_saida?'Saiu':'Ativo'})); }
function exportXLSX(data,name='controle_ministerial_recepcao'){ const wb=XLSX.utils.book_new(), ws=XLSX.utils.json_to_sheet(rows(data)); ws['!cols']=[{wch:30},{wch:24},{wch:18},{wch:18},{wch:24},{wch:16},{wch:16},{wch:16},{wch:35},{wch:35},{wch:10}]; XLSX.utils.book_append_sheet(wb,ws,'Membros'); XLSX.writeFile(wb,`${fileSafe(name)}.xlsx`); }
async function exportAllXLSX(){ exportXLSX(await getMembers(),'todos_membros_recepcao'); }
async function exportLeaderXLSX(){ const data=(await getMembers()).filter(m=>m.lider===selectedLeader); exportXLSX(data,`lider_${selectedLeader}`); }
function exportPDF(data,name='controle_ministerial_recepcao'){ const {jsPDF}=window.jspdf; const doc=new jsPDF({orientation:'landscape', unit:'mm', format:'a4'}); doc.setFontSize(18); doc.text('Controle Ministerial - Recepção',14,16); doc.setFontSize(10); doc.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}`,14,24); const r=rows(data); const keys=Object.keys(r[0]||{'Nome do membro':'','Nome do líder':'','Número para contato':'','Instagram':'','Indicação':'','Data de nascimento':'','Data de entrada':'','Data de saída':'','Status':''}); doc.autoTable({startY:30,head:[keys],body:r.map(o=>keys.map(k=>o[k]||'')),styles:{fontSize:7,cellPadding:1.6},headStyles:{fillColor:[37,99,235],textColor:255},alternateRowStyles:{fillColor:[239,246,255]},margin:{left:8,right:8}}); doc.save(`${fileSafe(name)}.pdf`); }
async function exportAllPDF(){ exportPDF(await getMembers(),'todos_membros_recepcao'); }
async function exportLeaderPDF(){ const data=(await getMembers()).filter(m=>m.lider===selectedLeader); exportPDF(data,`lider_${selectedLeader}`); }

function openImportXLSX(){ $('#xlsxFile').click(); }
function normalizeRow(r){
  const get=(...names)=>{ for(const n of names){ const k=Object.keys(r).find(x=>x.trim().toLowerCase()===n.toLowerCase()); if(k) return r[k]; } return ''; };
  const toDate=v=>{ if(!v)return null; if(typeof v==='number'){ const d=XLSX.SSF.parse_date_code(v); return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`; } const s=String(v).trim(); if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s; const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:null; };
  return {user_id:user.id,nome:String(get('nome','nome do membro','nome completo')||'').trim(),lider:String(get('líder','lider','nome do líder','nome do lider')||'').trim(),contato:String(get('contato','telefone','número para contato','numero para contato')||'').trim(),instagram:String(get('instagram')||'').trim(),indicacao:String(get('indicação','indicacao','indicado por')||'').trim(),data_nascimento:toDate(get('nascimento','data de nascimento')),data_entrada:toDate(get('entrada','data de entrada','data de entrada na recepção')),data_saida:toDate(get('saída','saida','data de saída','data de saida')),endereco:String(get('endereço','endereco')||'').trim(),observacoes:String(get('observações','observacoes')||'').trim()};
}
async function importXLSX(ev){ const file=ev.target.files[0]; if(!file)return; const buf=await file.arrayBuffer(); const wb=XLSX.read(buf); const arr=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''}).map(normalizeRow).filter(x=>x.nome&&x.data_entrada); if(!arr.length) return alert('Nenhum cadastro válido encontrado. Confira as colunas Nome e Data de entrada.'); const {error}=await sb.from('membros').insert(arr); if(error) return alert('Erro ao importar: '+error.message); alert(`${arr.length} membros importados com sucesso.`); ev.target.value=''; renderDashboard(); }

async function exportBackup(){ const membros=await getMembers(), eventos=await getEvents(); triggerDownload(`backup_controle_ministerial_${todayISO()}.json`, JSON.stringify({versao:2,gerado_em:new Date().toISOString(),membros,eventos},null,2)); }
function openImportBackup(){ $('#backupFile').click(); }
async function importBackup(ev){ const file=ev.target.files[0]; if(!file)return; const json=JSON.parse(await file.text()); const membros=(json.membros||[]).map(({id,created_at,...m})=>({...m,user_id:user.id})); const eventos=(json.eventos||[]).map(({id,created_at,...e})=>({...e,user_id:user.id})); if(!confirm(`Importar ${membros.length} membros e ${eventos.length} eventos?`)) return; if(membros.length){ const {error}=await sb.from('membros').insert(membros); if(error) return alert('Erro nos membros: '+error.message); } if(eventos.length){ const {error}=await sb.from('eventos').insert(eventos); if(error) return alert('Erro nos eventos: '+error.message); } alert('Backup importado com sucesso.'); ev.target.value=''; renderDashboard(); }

init();
