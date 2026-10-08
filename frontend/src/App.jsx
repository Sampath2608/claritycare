import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, AlertCircle, AlertTriangle, ArrowRight, ArrowUpRight, BarChart3, BookHeart,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardList,
  Clock3, Download, FileHeart, Heart, HeartPulse, LayoutDashboard, LockKeyhole, LogOut,
  Menu, MessageCircleMore, Plus, Search, Send, Shield, ShieldAlert, ShieldCheck, Sparkles,
  Stethoscope, Trash2, UserRound, X
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { downloadPdf, request } from './api'

const PUBLIC_NOTICE = 'Educational decision support only — not a medical diagnosis, clinical probability, or medical advice.'
const FRIENDLY_QUESTIONS = ['What are common flu symptoms?', 'What does the prediction score mean?', 'How should I prepare for a doctor visit?']
const FORMAT = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
const dateText = date => date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const dateTime = date => date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const initials = name => (name || 'User').trim().split(/\s+/).slice(0, 2).map(piece => piece[0].toUpperCase()).join('')
const symptomLabel = (symptoms, key) => symptoms.flatMap(group => group.items).find(item => item.id === key)?.label || key.replaceAll('_', ' ')

const NAV = [
  { key: 'overview', text: 'Overview', icon: LayoutDashboard },
  { key: 'checker', text: 'Symptom checker', icon: Stethoscope },
  { key: 'history', text: 'My history', icon: Clock3 },
  { key: 'library', text: 'Health library', icon: BookHeart },
  { key: 'assistant', text: 'Health assistant', icon: MessageCircleMore },
]

function Logo({ pale = false }) {
  return <div className={`logo-wrap ${pale ? 'logo-pale' : ''}`}>
    <div className="logo-mark"><HeartPulse size={23} strokeWidth={2.25} /></div>
    <div className="logo-copy"><strong>clarity<span>care</span></strong><small>YOUR HEALTH COMPANION</small></div>
  </div>
}
function Pill({ children, type = 'teal', icon: Icon }) {
  return <span className={`pill pill-${type}`}>{Icon && <Icon size={13} />}{children}</span>
}
function IconBubble({ icon: Icon, tone = 'teal', size = 42 }) {
  return <span className={`icon-bubble tone-${tone}`} style={{ width: size, height: size }}><Icon size={size > 44 ? 24 : 20} /></span>
}
function EmptyState({ icon: Icon = ClipboardList, title, subtitle, action, onAction }) {
  return <div className="empty-state"><IconBubble icon={Icon} size={57} /><h3>{title}</h3><p>{subtitle}</p>{action && <button className="btn btn-primary" onClick={onAction}>{action} <ArrowRight size={16} /></button>}</div>
}
function Loading() { return <div className="loading-wrap"><div className="spinner"/><p>Preparing your health space…</p></div> }

function AuthPage({ onAuth }) {
  const [register, setRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const data = await request(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', data: { ...(register ? { name } : {}), email, password } })
      onAuth(data)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <div className="auth-layout">
    <aside className="auth-visual">
      <div className="auth-visual-top"><Logo pale /></div>
      <div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/>
      <div className="auth-intro"><Pill type="glass" icon={Sparkles}>Smarter health understanding</Pill><h1>Better health starts with <em>clarity.</em></h1><p>Explore symptom patterns, keep useful records, and discover trusted general health information in one calm space.</p></div>
      <div className="auth-showcase"><div className="showcase-heading"><div className="showcase-dot"/><span>YOUR PERSONAL HEALTH SPACE</span><span>✦</span></div><div className="showcase-grid"><div className="mini-card"><IconBubble icon={Stethoscope} /><strong>Explore symptoms</strong><small>A guided, easy experience</small></div><div className="mini-card"><IconBubble icon={FileHeart} tone="blue"/><strong>Save your history</strong><small>Everything in one place</small></div></div><div className="auth-showcase-bottom"><span><ShieldCheck size={15}/> Privacy-minded design</span><span>EDUCATIONAL DEMO</span></div></div>
      <div className="auth-bottom">Made for curiosity. Guided by care.</div>
    </aside>
    <main className="auth-form-side"><div className="auth-mobile-logo"><Logo /></div><div className="auth-form-card"><Pill icon={Heart}>Welcome to ClarityCare</Pill><h2>{register ? 'Create your account' : 'Welcome back'}</h2><p className="subtle">{register ? 'Start exploring your health information today.' : 'Your healthier understanding continues here.'}</p>
      <form onSubmit={submit} className="auth-form">
        {register && <label>Full name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Alex Morgan" required minLength={2} maxLength={100} /></label>}
        <label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required /></label>
        <label>Password<input type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 8 characters" required /></label>
        {error && <div className="inline-error"><AlertCircle size={16}/>{error}</div>}
        <button className="btn btn-primary btn-wide" type="submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create my account' : 'Sign in to dashboard'}<ArrowRight size={17}/></button>
      </form>
      <div className="auth-switch">{register ? 'Already have an account?' : 'New to ClarityCare?'} <button onClick={()=>{setRegister(!register);setError('')}}>{register ? 'Sign in' : 'Create an account'}</button></div>
      <div className="auth-privacy"><LockKeyhole size={15}/> Your health history is only accessible to your logged-in account.</div>
      <div className="auth-disclaimer">{PUBLIC_NOTICE}</div>
    </div></main>
  </div>
}

function Sidebar({ active, onNav, user, onLogout, open, onClose }) {
  return <><div className={`sidebar-scrim ${open ? 'is-open' : ''}`} onClick={onClose}/><aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
    <div className="sidebar-top"><Logo pale/><button className="mobile-close" aria-label="Close menu" onClick={onClose}><X size={20}/></button></div>
    <div className="nav-group-title">WORKSPACE</div>
    <nav className="main-nav">{NAV.map(({ key, text, icon: Icon })=><button key={key} className={`nav-item ${active===key ? 'active' : ''}`} onClick={()=>{onNav(key);onClose()}}><Icon size={19}/><span>{text}</span>{active===key && <span className="nav-selected"/>}</button>)}</nav>
    <div className="nav-group-title nav-group-account">ACCOUNT</div><nav className="main-nav"><button className={`nav-item ${active==='profile'?'active':''}`} onClick={()=>{onNav('profile');onClose()}}><UserRound size={19}/><span>My profile</span></button>{user.is_admin && <button className={`nav-item ${active==='admin'?'active':''}`} onClick={()=>{onNav('admin');onClose()}}><Shield size={19}/><span>Admin dashboard</span></button>}</nav>
    <div className="sidebar-foot"><div className="sidebar-tip"><div className="sidebar-tip-icon"><Heart size={20}/></div><strong>Here for your health journey</strong><p>Explore, learn and stay informed — at your pace.</p></div><div className="sidebar-user"><span className="avatar">{initials(user.name)}</span><div><strong>{user.name}</strong><small>Personal account</small></div><button onClick={onLogout} aria-label="Log out" title="Log out"><LogOut size={18}/></button></div></div>
  </aside></>
}

function Overview({ user, dashboard, history, conditions, onNav, onResult }) {
  const today = new Date().toLocaleDateString('en-IN', FORMAT)
  const recent = history[0]
  const bestName = record => record?.urgent ? 'Urgent safety notice' : conditions.find(c=>c.slug===record?.matches?.[0]?.slug)?.name || 'Symptom pattern'
  const chartData = (dashboard?.activity || []).map(x=>({ ...x, day: new Date(x.date + 'T12:00:00').toLocaleDateString('en-IN', {weekday:'short'}) }))
  return <div className="view-content">
    <div className="welcome-line"><div><Pill icon={Sparkles}>YOUR WELLNESS DASHBOARD</Pill><h1>Good to see you, {user.name.split(' ')[0]} <span className="wave">✳</span></h1><p>Here's a little overview of your health exploration journey.</p></div><div className="date-stamp"><CalendarDays size={17}/>{today}</div></div>
    <div className="overview-hero"><div className="hero-copy"><span className="hero-overline"><span className="online-dot"/> YOUR HEALTH, MADE SIMPLER</span><h2>Understand your symptoms.<br/><em>Feel more informed.</em></h2><p>Explore possible symptom patterns with our educational ML demo. Clear information, no complicated steps.</p><button className="btn btn-white" onClick={()=>onNav('checker')}>Start symptom check <ArrowRight size={17}/></button></div><div className="hero-art" aria-hidden="true"><div className="hero-art-orbit one"/><div className="hero-art-orbit two"/><div className="hero-art-main"><HeartPulse size={105} strokeWidth={1.25}/></div><div className="orbit-spark spark-one">✳</div><div className="orbit-spark spark-two">✦</div><div className="floating-health-pill"><CheckCircle2 size={16}/> Your wellness, your way</div></div></div>
    <div className="metrics-grid"><div className="metric-card"><IconBubble icon={ClipboardList} tone="teal" size={50}/><div><span>Total explorations</span><strong>{dashboard?.total_predictions ?? 0}</strong><small>All-time symptom checks</small></div></div><div className="metric-card"><IconBubble icon={Clock3} tone="blue" size={50}/><div><span>Latest check</span><strong className="metric-date">{recent ? dateText(recent.created_at) : 'Not yet'}</strong><small>{recent ? 'Saved to your history' : 'Ready when you are'}</small></div></div><div className="metric-card"><IconBubble icon={BookHeart} tone="gold" size={50}/><div><span>Health topics</span><strong>{conditions.length}</strong><small>Educational guides</small></div></div></div>
    <div className="bottom-grid"><div className="panel activity-panel"><div className="panel-heading"><div><h3>Your activity</h3><p>Symptom checks in the last 7 days</p></div><Pill type="muted"><BarChart3 size={13}/> This week</Pill></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:12, right:10, left:10, bottom:0}}><defs><linearGradient id="activityShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#43b8ad" stopOpacity={.28}/><stop offset="95%" stopColor="#43b8ad" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9eef1"/><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fill:'#8794a1', fontSize:12}} dy={12}/><Tooltip formatter={count=>[count,'Checks']} contentStyle={{borderRadius:12, border:'1px solid #e3edf0'}}/><Area type="monotone" dataKey="count" stroke="#2da99c" strokeWidth={3} fill="url(#activityShade)" dot={{r:3,fill:'#2da99c'}} activeDot={{r:5}}/></AreaChart></ResponsiveContainer></div></div>
    <div className="panel recent-panel"><div className="panel-heading"><div><h3>Recent checks</h3><p>Your latest saved explorations</p></div><button className="text-button" onClick={()=>onNav('history')}>View all <ArrowUpRight size={16}/></button></div><div className="recent-list">{history.slice(0,3).map(rec=><button className="recent-row" onClick={()=>onResult(rec)} key={rec.id}><span className={`recent-icon ${rec.urgent ? 'danger' : ''}`}>{rec.urgent?<AlertTriangle size={19}/>:<Activity size={19}/>}</span><span className="recent-info"><strong>{bestName(rec)}</strong><small>{dateTime(rec.created_at)}</small></span><ChevronRight size={17}/></button>)}{!history.length && <div className="recent-empty"><FileHeart size={30}/><p>No checks yet. Your first exploration is a tap away.</p></div>}</div></div></div>
    <div className="gentle-reminder"><ShieldCheck size={20}/><p><strong>A gentle reminder:</strong> {PUBLIC_NOTICE} Consult a qualified clinician for personal decisions.</p></div>
  </div>
}

function Checker({ symptoms, onPredict, busy, result, onReset, conditions, onDownload }) {
  const [selected, setSelected] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const filtered = symptoms.map(group=>({...group, items: group.items.filter(item=>item.label.toLowerCase().includes(query.toLowerCase()))})).filter(group=>group.items.length)
  const toggle = id => {setError('');setSelected(old=>old.includes(id)?old.filter(i=>i!==id):old.length>=12?old:[...old,id])}
  async function submit() {if (!selected.length) {setError('Please select at least one symptom.');return} try {await onPredict(selected)} catch(err) {setError(err.message)} }
  function restart() {setSelected([]);setQuery('');setError('');onReset()}
  if (result) return <Result result={result} symptoms={symptoms} conditions={conditions} onReset={restart} onDownload={onDownload}/>
  return <div className="view-content"><PageIntro eyebrow="SYMPTOM EXPLORER" title="Let's understand how you're feeling" subtitle="Select the symptoms you're experiencing. This is a model demonstration, not a clinical assessment." />
    <div className="checker-layout"><section className="panel checker-panel"><div className="checker-top"><div className="step-number">01</div><div><h3>What symptoms are you noticing?</h3><p>Select all that apply — up to 12 symptoms.</p></div></div><div className="symptom-search"><Search size={19}/><input aria-label="Search symptoms" placeholder="Search for a symptom, e.g. headache..." value={query} onChange={e=>setQuery(e.target.value)}/>{query && <button onClick={()=>setQuery('')} aria-label="Clear search"><X size={16}/></button>}</div>
      <div className="symptom-groups">{filtered.map(group=><div key={group.group} className="symptom-group"><div className="symptom-group-label">{group.group}{group.group==='Potential urgent symptoms' && <AlertTriangle size={14}/>}</div><div className="symptom-options">{group.items.map(item=><button className={`symptom-option ${selected.includes(item.id)?'chosen':''} ${group.group==='Potential urgent symptoms'?'urgent-option':''}`} aria-pressed={selected.includes(item.id)} onClick={()=>toggle(item.id)} key={item.id}><span className="choice-box">{selected.includes(item.id)&&<Check size={13} strokeWidth={3}/>}</span>{item.label}</button>)}</div></div>)}{!filtered.length&&<p className="no-results">No matching symptoms. Try a different keyword.</p>}</div>
      {error&&<div className="inline-error"><AlertCircle size={16}/>{error}</div>}<div className="checker-actions"><span>{selected.length} of 12 symptoms selected</span><button className="btn btn-primary" onClick={submit} disabled={busy||!selected.length}>{busy?'Checking…':'Explore patterns'} <ArrowRight size={17}/></button></div></section>
      <aside className="checker-aside"><div className="panel summary-panel"><div className="section-icon-heading"><IconBubble icon={ClipboardList}/><h3>Your selected symptoms</h3></div>{selected.length ? <div className="selected-chips">{selected.map(item=><button onClick={()=>toggle(item)} key={item}>{symptomLabel(symptoms,item)}<X size={13}/></button>)}</div>:<p className="summary-placeholder">As you select symptoms, they'll appear here.</p>}<div className="summary-meter"><div style={{width:`${selected.length/12*100}%`}}/></div><small>{selected.length} / 12 selected</small></div>
      <div className="support-panel"><ShieldCheck size={25}/><h3>Your safety comes first</h3><p>Chest pain, trouble breathing, new confusion, fainting or a sudden severe headache may need urgent medical attention. This tool never delays emergency care.</p></div><div className="disclaimer-side"><CircleHelp size={18}/><span>Scores are derived from synthetic examples and have no clinical validity.</span></div></aside></div>
  </div>
}

function Result({ result, symptoms, conditions, onReset, onDownload, onBack }) {
  const [downloading, setDownloading] = useState(false)
  const main = result.matches?.[0]
  const mainName = conditions.find(c=>c.slug===main?.slug)?.name || 'Symptom pattern'
  const save = async()=>{setDownloading(true);try{await onDownload(result.id)}finally{setDownloading(false)}}
  return <div className="view-content"><PageIntro eyebrow="YOUR EXPLORATION" title={result.urgent ? 'An important safety notice' : 'Your symptom pattern summary'} subtitle={`Created ${dateTime(result.created_at)} • Record #${result.id}`}/>
    <div className="result-layout"><section className="panel result-main"><div className={`result-status ${result.urgent?'status-urgent':'status-demo'}`}>{result.urgent?<ShieldAlert size={30}/>:<Sparkles size={30}/>}<div><strong>{result.urgent?'Seek urgent medical attention':'Pattern exploration complete'}</strong><span>{result.urgent?'No model ranking was produced due to a potential safety concern.':'Here is how the synthetic demo model ranked the patterns.'}</span></div></div>
      {result.urgent?<div className="urgent-message"><h2>Please seek medical help now</h2><p>One or more selected symptoms may need urgent in-person evaluation. Contact emergency services or go to an emergency department as appropriate in your area. Do not use this educational tool to decide whether it is safe to wait.</p></div>:<><h2 className="result-heading">Highest ranked pattern</h2><div className="result-primary"><IconBubble icon={HeartPulse} size={62}/><div><small>DEMO PATTERN MATCH</small><h2>{mainName}</h2><p>This is a symptom-pattern label, not a diagnosed condition.</p></div><div className="result-score"><strong>{main?.score?.toFixed(1)}%</strong><span>demo score*</span></div></div><h3 className="rank-title">Other model-ranked patterns</h3><div className="ranked-list">{result.matches.map((item,index)=>{const name=conditions.find(c=>c.slug===item.slug)?.name||item.slug;return <div className="rank-row" key={item.slug}><div><span className="rank-number">0{index+1}</span><strong>{name}</strong><span>{item.score.toFixed(1)}%</span></div><div className="rank-track"><div style={{width:`${item.score}%`}}/></div></div>})}</div><p className="score-footnote">*Demo model scores are uncalibrated rankings learned from synthetic data, not real disease probabilities. Low scores do not rule out serious conditions.</p></>}
      <div className="result-actions"><button className="btn btn-primary" onClick={onReset}><Plus size={17}/> New check</button><button className="btn btn-outline" onClick={save} disabled={downloading}><Download size={17}/>{downloading?'Preparing PDF…':'Download report'}</button>{onBack&&<button className="btn btn-quiet" onClick={onBack}>Back to history</button>}</div></section>
      <aside className="result-aside"><div className="panel"><h3>Symptoms you selected</h3><div className="result-tags">{result.symptoms.map(symptom=><span key={symptom}><CheckCircle2 size={15}/>{symptomLabel(symptoms,symptom)}</span>)}</div></div><div className="support-panel"><ShieldCheck size={24}/><h3>What comes next?</h3><p>Discuss persistent, worsening or concerning symptoms with a healthcare professional. They can consider your full history and whether any tests are needed.</p></div><div className="disclaimer-side"><AlertCircle size={18}/><span>{PUBLIC_NOTICE}</span></div></aside></div>
  </div>
}

function History({ history, conditions, symptoms, onView, onDownload, onDelete, onNav }) {
  const [query,setQuery] = useState('')
  const [busyId,setBusyId] = useState(null)
  const filtered = history.filter(item => {
    const main = conditions.find(c=>c.slug===item.matches?.[0]?.slug)?.name || ''
    return (main+' '+item.symptoms.join(' ')+' '+dateText(item.created_at)).toLowerCase().includes(query.toLowerCase())
  })
  async function save(id) {setBusyId(id);try{await onDownload(id)}finally{setBusyId(null)}}
  return <div className="view-content"><PageIntro eyebrow="YOUR PERSONAL TIMELINE" title="My health history" subtitle="Look back at your saved symptom explorations and download educational reports." />
    <div className="panel history-panel"><div className="history-toolbar"><div><h3>Saved explorations <span className="count-badge">{history.length}</span></h3><p>Only visible to your account</p></div><div className="symptom-search history-search"><Search size={18}/><input placeholder="Search records..." aria-label="Search records" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    {filtered.length ? <div className="history-list">{filtered.map(item=>{const label=item.urgent?'Urgent safety notice':conditions.find(c=>c.slug===item.matches?.[0]?.slug)?.name||'Symptom pattern';return <div key={item.id} className="history-row"><IconBubble icon={item.urgent?ShieldAlert:FileHeart} tone={item.urgent?'red':'teal'} size={46}/><div className="history-info"><strong>{label}</strong><span>{item.symptoms.slice(0,3).map(x=>symptomLabel(symptoms,x)).join(' · ')}{item.symptoms.length>3?` +${item.symptoms.length-3} more`:''}</span></div><span className="history-date"><CalendarDays size={15}/>{dateText(item.created_at)}</span><div className="history-row-actions"><button aria-label="View report" title="View summary" onClick={()=>onView(item)}><ChevronRight size={19}/></button><button aria-label="Download PDF" title="Download PDF" disabled={busyId===item.id} onClick={()=>save(item.id)}><Download size={17}/></button><button className="delete-icon" aria-label="Delete record" title="Delete record" onClick={()=>{if(window.confirm('Delete this saved exploration?'))onDelete(item.id)}}><Trash2 size={17}/></button></div></div>})}</div>:<EmptyState title={history.length?'No matching records':'Your history starts here'} subtitle={history.length?'Try a different search term.':'Your symptom explorations and downloadable reports will appear here.'} icon={ClipboardList} action={history.length?undefined:'Start exploring'} onAction={()=>onNav('checker')}/>}</div>
  </div>
}

function Library({ conditions }) {
  const [query,setQuery]=useState('')
  const [expanded,setExpanded]=useState(null)
  const matches=conditions.filter(c=>(c.name+' '+c.summary+' '+c.common_symptoms.join(' ')).toLowerCase().includes(query.toLowerCase()))
  return <div className="view-content"><PageIntro eyebrow="KNOWLEDGE FOR WELLBEING" title="Health information library" subtitle="Plain-language overviews of common symptom patterns and when to seek professional advice." />
    <div className="library-tools"><div className="symptom-search"><Search size={19}/><input placeholder="Find a health topic..." aria-label="Search health library" value={query} onChange={e=>setQuery(e.target.value)}/></div><Pill type="muted" icon={BookHeart}>{matches.length} topics</Pill></div>
    <div className="library-grid">{matches.map((c,index)=><div className={`panel condition-card ${expanded===c.slug?'condition-expanded':''}`} key={c.slug}><div className="condition-card-top"><IconBubble icon={[HeartPulse,Activity,Stethoscope,FileHeart,BookHeart,Heart][index%6]} tone={['teal','blue','gold'][index%3]} size={53}/><Pill type="muted">Health guide</Pill></div><h3>{c.name}</h3><p>{c.summary}</p><div className="condition-symptoms">{c.common_symptoms.slice(0,3).map(s=><span key={s}>{s}</span>)}</div><button className="condition-learn" onClick={()=>setExpanded(expanded===c.slug?null:c.slug)}>{expanded===c.slug?'Show less':'Read more'}<ChevronDown size={17}/></button>{expanded===c.slug&&<div className="condition-more"><strong>General prevention</strong><p>{c.prevention}</p><strong>When to seek care</strong><p>{c.when_to_seek_care}</p></div>}</div>)}</div>{!matches.length&&<EmptyState icon={Search} title="No topics found" subtitle="Try a different search term."/>}
    <div className="gentle-reminder"><ShieldCheck size={20}/><p><strong>General information only.</strong> These pages do not identify the cause of your symptoms and are not a substitute for medical care.</p></div>
  </div>
}

function Assistant({ token }) {
  const [messages,setMessages]=useState([{role:'assistant',text:'Hello! 👋 I’m your educational health guide. Ask about common health topics, how the demo model works, or what to ask at a medical appointment.'}])
  const [draft,setDraft]=useState('')
  const [busy,setBusy]=useState(false)
  const tail=useRef(null)
  useEffect(()=>tail.current?.scrollIntoView({behavior:'smooth'}),[messages,busy])
  async function send(text=draft) {
    if(!text.trim()||busy)return
    const input=text.trim()
    setDraft('');setMessages(prev=>[...prev,{role:'user',text:input}]);setBusy(true)
    try{const data=await request('/api/health-assistant',{method:'POST',token,data:{message:input}});setMessages(prev=>[...prev,{role:'assistant',text:data.answer}])}
    catch(err){setMessages(prev=>[...prev,{role:'assistant',text:`I couldn't retrieve an answer: ${err.message}`}])}
    finally{setBusy(false)}
  }
  return <div className="view-content"><PageIntro eyebrow="YOUR LEARNING COMPANION" title="Health information assistant" subtitle="Ask general questions and get educational, rule-based responses — never a diagnosis." />
    <div className="assistant-shell panel"><div className="chat-header"><div className="chat-avatar"><MessageCircleMore size={25}/></div><div><h3>ClarityCare guide</h3><p><span className="online-dot"/> Rule-based • general health information</p></div><Pill type="teal" icon={ShieldCheck}>Educational only</Pill></div><div className="chat-messages">{messages.map((msg,index)=><div className={`message-line ${msg.role==='user'?'user-line':''}`} key={index}>{msg.role==='assistant'&&<div className="assistant-avatar"><HeartPulse size={17}/></div>}<div className={`chat-bubble ${msg.role==='user'?'bubble-user':'bubble-assistant'}`}>{msg.text}</div></div>)}{busy&&<div className="message-line"><div className="assistant-avatar"><HeartPulse size={17}/></div><div className="chat-bubble bubble-assistant">Looking through the educational guide…</div></div>}<div ref={tail}/></div>
    <div className="chat-bottom">{messages.length<=2&&<div className="prompt-suggestions">{FRIENDLY_QUESTIONS.map(q=><button key={q} onClick={()=>send(q)}>{q}<ArrowUpRight size={14}/></button>)}</div>}<form className="chat-input" onSubmit={e=>{e.preventDefault();send()}}><input value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1000} placeholder="Ask a general health question..." aria-label="Type your health question"/><button type="submit" disabled={busy||draft.trim().length<3} aria-label="Send message"><Send size={19}/></button></form><small><ShieldCheck size={13}/> No individualized treatment advice. Contact a healthcare professional for personal concerns.</small></div></div>
  </div>
}

function Profile({ user, token, onUpdate, onDelete }) {
  const [name,setName]=useState(user.name)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')
  async function submit(e){e.preventDefault();setBusy(true);setError('');setSuccess('');try{const data=await request('/api/user/profile',{method:'PUT',token,data:{name}});onUpdate(data);setSuccess('Your profile was updated.')}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <div className="view-content"><PageIntro eyebrow="YOUR ACCOUNT" title="My profile" subtitle="Review your account information and manage your personal details." /><div className="profile-grid"><div className="panel profile-panel"><div className="profile-identity"><span className="profile-avatar">{initials(user.name)}</span><div><h3>{user.name}</h3><p>{user.email}</p><Pill type="teal"><CheckCircle2 size={13}/> Active account</Pill></div></div><form className="profile-form" onSubmit={submit}><label>Full name<input value={name} minLength={2} maxLength={100} onChange={e=>setName(e.target.value)} required/></label><label>Email address<input value={user.email} disabled/><small>Changing your email is not available in this demo.</small></label><label>Joined<input value={dateText(user.created_at)} disabled/></label>{error&&<div className="inline-error"><AlertCircle size={16}/>{error}</div>}{success&&<div className="inline-success"><CheckCircle2 size={16}/>{success}</div>}<button type="submit" className="btn btn-primary" disabled={busy||name.trim()===user.name}>{busy?'Saving…':'Save changes'}<ArrowRight size={16}/></button></form></div>
  <div className="profile-side"><div className="support-panel"><ShieldCheck size={24}/><h3>Account privacy</h3><p>Your records are only available through your authenticated account. Use report downloads only on devices you trust.</p></div><div className="panel danger-panel"><h3>Delete your account</h3><p>Delete your account and associated symptom history from the app database. This cannot be undone.</p><button className="btn btn-danger-outline" onClick={()=>{if(window.confirm('Permanently delete your account and its history?')) onDelete()}}><Trash2 size={16}/> Delete account</button></div></div></div></div>
}

function AdminView({ token, conditions, onConditionsChange }) {
  const [summary,setSummary]=useState(null)
  const [users,setUsers]=useState([])
  const [selected,setSelected]=useState('')
  const [draft,setDraft]=useState(null)
  const [saving,setSaving]=useState(false)
  const [success,setSuccess]=useState('')
  const [error,setError]=useState('')
  useEffect(()=>{Promise.all([request('/api/admin/summary',{token}),request('/api/admin/users',{token})]).then(([a,b])=>{setSummary(a);setUsers(b)}).catch(e=>setError(e.message))},[token])
  useEffect(()=>{if(!selected&&conditions.length)setSelected(conditions[0].slug)},[conditions,selected])
  useEffect(()=>{const c=conditions.find(item=>item.slug===selected);if(c)setDraft({...c,common_symptoms:[...c.common_symptoms]})},[selected,conditions])
  async function saveCondition(e) {
    e.preventDefault();setSaving(true);setSuccess('');setError('')
    try {
      const next=await request(`/api/admin/conditions/${selected}`,{token,method:'PUT',data:{name:draft.name,summary:draft.summary,common_symptoms:draft.common_symptoms,prevention:draft.prevention,when_to_seek_care:draft.when_to_seek_care}})
      onConditionsChange(previous=>previous.map(item=>item.slug===selected?next:item))
      setSuccess('Health guide updated successfully.')
    } catch(err) {setError(err.message)} finally {setSaving(false)}
  }
  return <div className="view-content"><PageIntro eyebrow="RESTRICTED MANAGEMENT" title="Administrator overview" subtitle="Aggregate activity insights, user accounts and editable educational health guides."/>
    {error&&<div className="inline-error"><AlertCircle size={16}/>{error}</div>}
    <div className="admin-metrics">{[['Registered users',summary?.users,UserRound],['Explorations',summary?.predictions,ClipboardList],['Checks today',summary?.today_predictions,Activity],['Health topics',summary?.conditions,BookHeart]].map(([label,value,Icon])=><div className="metric-card" key={label}><IconBubble icon={Icon}/><div><span>{label}</span><strong>{value ?? '—'}</strong></div></div>)}</div>
    <div className="panel admin-users"><h3>Registered users</h3><p>Account list — private symptom histories are never exposed here.</p><div className="user-list">{users.map(u=><div className="user-row" key={u.id}><span className="avatar avatar-light">{initials(u.name)}</span><strong>{u.name}</strong><span>{u.email}</span><small>{dateText(u.created_at)}</small></div>)}</div></div>
    <div className="panel admin-editor"><h3>Edit health library content</h3><p>Changes appear for all users. General educational information should be reviewed by qualified professionals.</p>
      <div className="editor-select"><label htmlFor="admin-condition">Choose a topic</label><select id="admin-condition" value={selected} onChange={e=>{setSelected(e.target.value);setSuccess('')}}>{conditions.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
      {draft&&<form onSubmit={saveCondition} className="editor-form"><label>Topic title<input required minLength={3} maxLength={100} value={draft.name} onChange={e=>setDraft(old=>({...old,name:e.target.value}))}/></label><label>Summary<textarea rows={3} minLength={10} required value={draft.summary} onChange={e=>setDraft(old=>({...old,summary:e.target.value}))}/></label><label>General prevention<textarea rows={2} minLength={8} required value={draft.prevention} onChange={e=>setDraft(old=>({...old,prevention:e.target.value}))}/></label><label>When to seek care<textarea rows={2} minLength={8} required value={draft.when_to_seek_care} onChange={e=>setDraft(old=>({...old,when_to_seek_care:e.target.value}))}/></label>{success&&<div className="inline-success"><CheckCircle2 size={16}/>{success}</div>}<button className="btn btn-primary" disabled={saving}>{saving?'Saving…':'Save health guide'} <ArrowRight size={16}/></button></form>}
    </div>
  </div>
}

function PageIntro({ eyebrow,title,subtitle }) {return <div className="page-intro"><Pill icon={Sparkles}>{eyebrow}</Pill><h1>{title}</h1><p>{subtitle}</p></div>}

export default function App() {
  const [token,setToken] = useState(()=>sessionStorage.getItem('claritycare_token'))
  const [user,setUser] = useState(null)
  const [loading,setLoading]=useState(!!sessionStorage.getItem('claritycare_token'))
  const [section,setSection]=useState('overview')
  const [menuOpen,setMenuOpen]=useState(false)
  const [history,setHistory]=useState([])
  const [dashboard,setDashboard]=useState(null)
  const [conditions,setConditions]=useState([])
  const [symptoms,setSymptoms]=useState([])
  const [result,setResult]=useState(null)
  const [working,setWorking]=useState(false)
  const [error,setError]=useState('')
  const [toast,setToast]=useState('')
  function notify(message){setToast(message);setTimeout(()=>setToast(''),4200)}
  function logout(){sessionStorage.removeItem('claritycare_token');setToken(null);setUser(null);setResult(null);setHistory([]);setSection('overview')}
  async function refresh(authToken=token){if (!authToken) return;const [hist,dash]=await Promise.all([request('/api/predictions',{token:authToken}),request('/api/dashboard',{token:authToken})]);setHistory(hist);setDashboard(dash)}
  useEffect(()=>{let alive=true;Promise.all([request('/api/symptoms'),request('/api/conditions')]).then(([s,c])=>{if(alive){setSymptoms(s);setConditions(c)}}).catch(e=>{if(alive)setError(e.message)});return()=>{alive=false}},[])
  useEffect(()=>{if(!token){setLoading(false);return}let alive=true;Promise.all([request('/api/user/profile',{token}),request('/api/predictions',{token}),request('/api/dashboard',{token})]).then(([u,h,d])=>{if(alive){setUser(u);setHistory(h);setDashboard(d)}}).catch(e=>{if(alive){if(e.message.includes('Authentication')||e.message.includes('Invalid or expired')||e.message.includes('User not found'))logout();else setError(e.message)}}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[token])
  function authenticated(data){sessionStorage.setItem('claritycare_token',data.token);setUser(data.user);setToken(data.token);setSection('overview');setError('')}
  function navigate(destination){setSection(destination);setError('');if(destination==='checker')setResult(null)}
  async function runPrediction(symptomIds){setWorking(true);try{const data=await request('/api/predict',{token,method:'POST',data:{symptoms:symptomIds}});setResult(data);await refresh();notify(data.urgent?'Urgent safety notice displayed':'Exploration saved to your history')}finally{setWorking(false)}}
  async function deleteOne(id){try{await request(`/api/predictions/${id}`,{token,method:'DELETE'});await refresh();notify('Record deleted')}catch(e){setError(e.message)}}
  async function getPdf(id){try{await downloadPdf(id,token)}catch(e){setError(e.message)}}
  async function deleteAccount(){try{await request('/api/user/profile',{token,method:'DELETE'});logout()}catch(e){setError(e.message)}}
  function openResult(rec){setResult(rec);setSection('checker')}
  const titles={overview:'Overview',checker:'Symptom checker',history:'Health history',library:'Health library',assistant:'Health assistant',profile:'My profile',admin:'Admin overview'}
  if(loading)return <Loading/>
  if(!token||!user)return <AuthPage onAuth={authenticated}/>
  return <div className="app-layout"><Sidebar active={section} onNav={navigate} user={user} onLogout={logout} open={menuOpen} onClose={()=>setMenuOpen(false)}/><main className="workspace"><header className="top-header"><div className="top-left"><button className="menu-toggle" onClick={()=>setMenuOpen(true)} aria-label="Open menu"><Menu size={23}/></button><span className="breadcrumb">Workspace</span><ChevronRight size={14}/><strong>{titles[section]}</strong></div><div className="top-right"><span className="header-status"><span className="online-dot"/> Educational environment</span><div className="header-divider"/><span className="avatar avatar-header" title={user.name}>{initials(user.name)}</span></div></header>
    {error&&<div className="global-error"><AlertCircle size={17}/>{error}<button onClick={()=>setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
    {section==='overview'&&<Overview user={user} dashboard={dashboard} history={history} conditions={conditions} onNav={navigate} onResult={openResult}/>}
    {section==='checker'&&<Checker key={result?'result-'+result.id:'fresh'} symptoms={symptoms} conditions={conditions} result={result} onReset={()=>setResult(null)} onPredict={runPrediction} busy={working} onDownload={getPdf}/>}
    {section==='history'&&<History history={history} symptoms={symptoms} conditions={conditions} onView={openResult} onDownload={getPdf} onDelete={deleteOne} onNav={navigate}/>}
    {section==='library'&&<Library conditions={conditions}/>}
    {section==='assistant'&&<Assistant token={token}/>}
    {section==='profile'&&<Profile user={user} token={token} onUpdate={setUser} onDelete={deleteAccount}/>}
    {section==='admin'&&user.is_admin&&<AdminView token={token} conditions={conditions} onConditionsChange={setConditions}/>}
    <footer className="workspace-footer"><HeartPulse size={15}/> ClarityCare AI <span>•</span> Education-first health tools <span>•</span> Not a substitute for medical care</footer>
    </main>{toast&&<div className="toast"><CheckCircle2 size={18}/>{toast}</div>}</div>
}
