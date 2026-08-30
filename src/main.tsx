import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, FolderKanban, LayoutTemplate, Library, Sparkles, Settings, Plus, Search, Bell,
  ChevronDown, MoreHorizontal, Play, Clock3, CheckCircle2, CircleDashed, WandSparkles, Film, Mic2,
  Image as ImageIcon, ArrowUpRight, SlidersHorizontal, X, MonitorPlay, Loader2, FileText, Download, RefreshCw,
} from 'lucide-react';
import './styles.css';

/* ---------------- types ---------------- */

interface Scene { id: string; title: string; narration: string; visual_prompt?: string; mood?: string; status?: string; image?: string; asset?: string }
interface Project {
  id: string; topic: string; status: string; stage: string; progress: number; createdAt: string;
  settings?: any; scenes?: Scene[]; logs?: { time: string; message: string; level: string }[];
  source?: { type: string; url?: string; title?: string; author?: string; videoId?: string };
  error?: string; export?: string;
}
interface AnalysisResult {
  source: { videoId: string; url: string; title: string; author: string; lengthSeconds: number; transcript: string; transcriptSource: string; captionLanguage: string };
  analysis: null | {
    source: { topic: string; target_audience: string; style: string; tone: string; structure: { section: string; summary: string }[]; key_points: string[]; cta: string };
    production: { title: string; angle: string; summary: string; why_this_works: string; scenes: Scene[] };
  };
}

type View = 'overview' | 'projects';

const DURATIONS = [3, 5, 10];
const STYLES = ['Documentary', 'Explainer', 'News-style', 'Tutorial'];
const LANGUAGES = ['English', 'Bengali', 'Hindi', 'Spanish', 'Arabic'];

/** Client-side YouTube URL detector (server-এর parseVideoId-এর মিরর) */
function detectYouTubeUrl(text: string): string | null {
  const m = text.match(/(https?:\/\/)?(www\.|m\.)?(youtube\.com\/\S+|youtu\.be\/\S+)/i);
  return m ? m[0] : null;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 90) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return d.toLocaleDateString();
}

/* ---------------- engine API ---------------- */

function useEngine() {
  const [server, setServer] = useState(localStorage.getItem('autodirector-server') || 'http://10.0.2.2:8787');
  const [pairCode, setPairCode] = useState('');
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [connected, setConnected] = useState(false);

  const base = server.replace(/\/$/, '');
  const tokenKey = `autodirector-token:${base}`;
  const getToken = () => localStorage.getItem(tokenKey);

  const headers = useCallback(() => {
    const h: Record<string, string> = { 'content-type': 'application/json' };
    const t = getToken();
    if (t) h.authorization = `Bearer ${t}`;
    return h;
  }, [tokenKey]);

  const ensurePaired = useCallback(async () => {
    localStorage.setItem('autodirector-server', base);
    if (getToken()) return true;
    if (!/^\d{6}$/.test(pairCode)) throw new Error('PC-তে দেখানো ৬-ডিজিট pairing code টাইপ করুন');
    const res = await fetch(`${base}/api/pair`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: pairCode }) });
    if (!res.ok) throw new Error('Pairing failed — কোড মিলল না');
    const { token } = await res.json();
    localStorage.setItem(tokenKey, token);
    return true;
  }, [base, pairCode, tokenKey]);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/projects`, { headers: headers() });
      if (res.status === 401) { localStorage.removeItem(tokenKey); setConnected(false); return; }
      if (!res.ok) return;
      setConnected(true);
      setProjects((await res.json()) as Project[]);
    } catch { setConnected(false); }
  }, [base, headers, tokenKey]);

  useEffect(() => { if (getToken()) void loadProjects(); }, [loadProjects]);

  // চলমান প্রজেক্টের progress poll
  useEffect(() => {
    const running = (projects || []).some((p) => p.status === 'running' || p.status === 'queued');
    if (!running || !connected) return;
    const t = setInterval(() => void loadProjects(), 4000);
    return () => clearInterval(t);
  }, [projects, connected, loadProjects]);

  return { server, setServer, pairCode, setPairCode, projects, setProjects, connected, base, headers, ensurePaired, loadProjects, getToken };
}

/* ---------------- app ---------------- */

function App() {
  const engine = useEngine();
  const [view, setView] = useState<View>('overview');
  const [modal, setModal] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3600); };

  const projects = engine.projects || [];
  const running = projects.find((p) => p.status === 'running' || p.status === 'queued');
  const done = projects.filter((p) => p.status === 'complete');
  const detail = projects.find((p) => p.id === detailId) || null;
  const filtered = search ? projects.filter((p) => p.topic.toLowerCase().includes(search.toLowerCase())) : projects;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="logo"><Play fill="currentColor" size={15} /></div><span>AutoDirector</span><em>AI</em></div>
        <nav>
          <p>Workspace</p>
          <button className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}><LayoutDashboard />Overview</button>
          <button className={view === 'projects' ? 'active' : ''} onClick={() => setView('projects')}><FolderKanban />Projects <b>{projects.length}</b></button>
          <button onClick={() => notify('Templates coming soon')}><LayoutTemplate />Templates</button>
          <button onClick={() => notify('Asset library coming soon')}><Library />Asset library</button>
          <p>Production</p>
          <button onClick={() => notify('Local providers: Ollama, ComfyUI, Piper, FFmpeg — engine health /api/providers/health')}><Sparkles />AI providers</button>
          <button onClick={() => notify(`${done.length} completed production(s)`)}>
            <Film />Exports <b>{done.length}</b>
          </button>
        </nav>
        <div className="usage">
          <div><span>Engine</span><strong style={{ color: engine.connected ? 'var(--ok)' : 'var(--warn)' }}>{engine.connected ? 'Connected' : 'Offline'}</strong></div>
          <small>{engine.connected ? `${projects.length} project(s) on your PC` : 'New Production খুলে connect করুন'}</small>
          <button onClick={() => void engine.loadProjects()}><RefreshCw size={12} /> Refresh</button>
        </div>
        <div className="user">
          <div className="avatar">AD</div>
          <div><strong>Local Creator</strong><span>Zero API cost plan</span></div>
          <MoreHorizontal />
        </div>
      </aside>

      <main>
        <header>
          <div className="mobileBrand">AD</div>
          <div className="search"><Search /><input aria-label="Search" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <button className="iconBtn" onClick={() => notify('You’re all caught up')}><Bell /></button>
          <button className="create" onClick={() => setModal(true)}><Plus />New production</button>
        </header>

        <section className="content">
          {view === 'overview' ? (
            <Overview
              projects={projects} running={running} connected={engine.connected}
              onOpen={setDetailId} onNew={() => setModal(true)}
            />
          ) : (
            <div className="projectsGrid">
              {filtered.map((p) => <ProjectCard key={p.id} p={p} onOpen={() => setDetailId(p.id)} />)}
              {filtered.length === 0 && <div className="emptyMsg">No projects{search ? ' match your search' : ' yet — create your first production'}.</div>}
            </div>
          )}
        </section>
      </main>

      {modal && (
        <NewProductionModal
          engine={engine}
          onClose={() => setModal(false)}
          onCreated={() => { setModal(false); void engine.loadProjects(); setView('projects'); notify('Production created — local AI pipeline শুরু হয়েছে'); }}
          notify={notify}
        />
      )}

      {detail && <ProjectDetail p={detail} engine={engine} onClose={() => setDetailId(null)} />}

      {toast && <div className="toast"><CheckCircle2 />{toast}</div>}
    </div>
  );
}

/* ---------------- overview ---------------- */

const pipelineSteps = ['Research', 'Script', 'Images', 'Voice', 'Editing', 'Render'] as const;

function stageProgress(p: Project): number {
  const order: Record<string, number> = { 'Research & strategy': 0, Script: 1, Images: 2, Voice: 3, Editing: 4, Rendering: 5, Ready: 6 };
  const idx = order[p.stage] ?? -1;
  return idx < 0 ? 0 : Math.round((idx / (pipelineSteps.length - 1)) * 100);
}

function Overview({ projects, running, connected, onOpen, onNew }: {
  projects: Project[]; running?: Project; connected: boolean; onOpen: (id: string) => void; onNew: () => void;
}) {
  const featured = running || projects[0];
  return (
    <>
      <div className="welcome">
        <div>
          <span className="eyebrow">LOCAL-FIRST · ZERO API COST</span>
          <h1>আপনার নিজের AI স্টুডিও</h1>
          <p>টপিক বা YouTube লিংক দিন — Ollama রিসার্চ করবে, ComfyUI ভিজ্যুয়াল বানাবে, Piper ভয়েস দেবে, FFmpeg ফাইনাল ভিডিও রেন্ডার করবে।</p>
        </div>
        <button className="create secondaryCreate" onClick={onNew}><WandSparkles />Create with AI</button>
      </div>

      <div className="heroGrid">
        <div className="spotlight">
          {featured ? (
            <div className="spotCopy">
              {featured.status === 'running' || featured.status === 'queued' ? (
                <span className="live"><i /> PRODUCTION IN PROGRESS</span>
              ) : (
                <span className="live dim"><i /> {featured.status.toUpperCase()}</span>
              )}
              <h2>{featured.topic}</h2>
              <p>{featured.settings?.style || 'Documentary'} · {featured.settings?.aspectRatio || '16:9'} · {featured.settings?.duration || 3} min{featured.source?.type === 'youtube' ? ' · 🎥 YouTube-inspired' : ''}</p>
              <div className="overall"><span>Overall progress</span><strong>{featured.progress}%</strong></div>
              <div className="bigbar"><i style={{ width: `${featured.progress}%` }} /></div>
              <div className="spotActions">
                <button onClick={() => onOpen(featured.id)}><Play fill="currentColor" />Open production</button>
                <span><Clock3 />{featured.status === 'complete' ? 'Ready' : featured.stage}</span>
              </div>
            </div>
          ) : (
            <div className="spotCopy">
              <span className="live dim"><i /> NO PRODUCTIONS YET</span>
              <h2>প্রথম ভিডিও প্রোডাকশন শুরু করুন</h2>
              <p>{connected ? 'New production চাপুন — টপিক লিখুন বা কোনো YouTube ভিডিওর লিংক পেস্ট করুন।' : 'ইঞ্জিনের address আর pairing code দিয়ে connect করুন (engine আপনার PC-তে চলছে)।'}</p>
              <div className="spotActions"><button onClick={onNew}><WandSparkles />New production</button></div>
            </div>
          )}
          <div className="pipeline">
            {pipelineSteps.map((n, i) => {
              const total = pipelineSteps.length - 1;
              const prog = featured ? (featured.status === 'complete' ? 100 : stageProgress(featured)) : 0;
              const stepDone = prog >= (i / total) * 100 - 5;
              return (
                <div className={'step ' + (stepDone ? 'done' : prog > 0 ? 'running' : '')} key={n}>
                  <span>{stepDone ? <CheckCircle2 /> : <CircleDashed />}</span>
                  <label>{n}<small>{stepDone ? 'Complete' : 'Waiting'}</small></label>
                  {i < pipelineSteps.length - 1 && <b />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="quick">
          <div className="sectionHead"><div><span>QUICK START</span><h3>কী বানাবেন?</h3></div><Sparkles /></div>
          <button onClick={onNew}>
            <i className="qicon purple"><WandSparkles /></i>
            <span><strong>Start from a topic</strong><small>যেকোনো আইডিয়া থেকে সম্পূর্ণ ভিডিও</small></span>
            <ArrowUpRight />
          </button>
          <button onClick={onNew}>
            <i className="qicon red"><MonitorPlay /></i>
            <span><strong>Recreate a YouTube video</strong><small>লিংক দিলে structure analyze করে original ভিডিও</small></span>
            <ArrowUpRight />
          </button>
          <button onClick={onNew}>
            <i className="qicon orange"><Mic2 /></i>
            <span><strong>Narrated explainer</strong><small>Local neural voiceover সহ</small></span>
            <ArrowUpRight />
          </button>
        </div>
      </div>

      <div className="projectsHead">
        <div><span className="eyebrow">YOUR WORK</span><h2>Recent projects</h2></div>
      </div>
      <div className="cards">
        {projects.slice(0, 6).map((p) => <ProjectCard key={p.id} p={p} onOpen={() => onOpen(p.id)} />)}
        {projects.length === 0 && <div className="emptyMsg">এখনো কোনো প্রজেক্ট নেই — উপরের Quick Start ব্যবহার করুন।</div>}
      </div>
    </>
  );
}

/* ---------------- project card ---------------- */

function ProjectCard({ p, onOpen }: { p: Project; onOpen: () => void }) {
  return (
    <article onClick={onOpen}>
      <div className="thumb doc">
        <div className="visual"><span /></div>
        <span className="duration">{p.settings?.duration || 3}:00</span>
        <button aria-label="Project menu" onClick={(e) => { e.stopPropagation(); onOpen(); }}><MoreHorizontal /></button>
        {p.status === 'complete' && <div className="ready"><CheckCircle2 />READY</div>}
        {p.source?.type === 'youtube' && <div className="ytTag"><MonitorPlay size={11} /> SOURCE</div>}
      </div>
      <div className="cardBody">
        <div className="type">{p.settings?.style || 'Documentary'}<span>•</span>{p.settings?.aspectRatio || '16:9'}</div>
        <h3>{p.topic}</h3>
        <div className="status">
          <span className={p.status === 'complete' ? 'green' : p.status === 'failed' ? 'red' : ''}>
            {p.status === 'running' ? p.stage : p.status}
          </span>
          <b>{p.progress}%</b>
        </div>
        <div className="tinybar"><i style={{ width: `${p.progress}%` }} /></div>
        <small>{fmtTime(p.createdAt)} · {p.scenes?.length || 0} scenes</small>
      </div>
    </article>
  );
}

/* ---------------- new production modal (YouTube-aware) ---------------- */

function NewProductionModal({ engine, onClose, onCreated, notify }: {
  engine: ReturnType<typeof useEngine>;
  onClose: () => void; onCreated: () => void; notify: (m: string) => void;
}) {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(3);
  const [style, setStyle] = useState('Documentary');
  const [language, setLanguage] = useState('English');
  const [ratio, setRatio] = useState('16:9');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [ytError, setYtError] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [manualTranscript, setManualTranscript] = useState('');

  const ytUrl = detectYouTubeUrl(topic);
  const canGenerate = ytUrl ? true : topic.trim().length >= 3;

  const pairAndHeaders = async () => {
    await engine.ensurePaired();
    return engine.headers();
  };

  const analyze = async () => {
    setYtError(''); setBusy(true); setPhase('YouTube ভিডিও অ্যানালাইজ হচ্ছে — transcript আনা হচ্ছে…');
    try {
      const h = await pairAndHeaders();
      const res = await fetch(`${engine.base}/api/youtube/analyze`, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          url: ytUrl,
          transcript: manualTranscript.trim().length > 100 ? manualTranscript : undefined,
          language, duration, style,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data as AnalysisResult);
      if (!data.analysis) setPhase('Ollama পাওয়া যায়নি — transcript সেভ হবে, pipeline নিজে স্ক্রিপ্ট বানাবে');
    } catch (e) {
      setYtError(e instanceof Error ? e.message : 'Analysis failed');
      setShowTranscript(true);
    } finally { setBusy(false); setPhase(''); }
  };

  const createProduction = async () => {
    setBusy(true); setPhase(result ? 'প্রোডাকশন তৈরি হচ্ছে…' : '');
    try {
      const h = await pairAndHeaders();
      const body: any = {
        topic: result?.analysis?.production?.title || (ytUrl ? result?.source.title : topic.trim()),
        settings: { duration, language, style, aspectRatio: ratio },
      };
      if (ytUrl && result) {
        body.source = {
          type: 'youtube', videoId: result.source.videoId, url: result.source.url,
          title: result.source.title, author: result.source.author,
          lengthSeconds: result.source.lengthSeconds, transcript: result.source.transcript,
          transcriptSource: result.source.transcriptSource, analysis: result.analysis,
        };
      }
      const r = await fetch(`${engine.base}/api/projects`, { method: 'POST', headers: h, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('Create failed');
      const project = await r.json();
      const started = await fetch(`${engine.base}/api/projects/${project.id}/generate`, { method: 'POST', headers: h });
      if (!started.ok) throw new Error('Start failed');
      setTopic(''); setResult(null); setManualTranscript(''); setShowTranscript(false);
      onCreated();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Cannot reach local engine');
    } finally { setBusy(false); setPhase(''); }
  };

  const generate = async () => {
    if (ytUrl && !result) { await analyze(); } else { await createProduction(); }
  };

  const r = result;

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}><X /></button>
        <span className="eyebrow">NEW PRODUCTION</span>
        <h2>ভিডিওটা কী নিয়ে?</h2>
        <p>টপিক লিখুন — অথবা কোনো YouTube ভিডিওর লিংক পেস্ট করলে AutoDirector সেটা analyze করে একই স্টাইলের <b>মৌলিক</b> ভিডিও বানাবে।</p>

        <textarea autoFocus value={topic} onChange={(e) => { setTopic(e.target.value); setResult(null); setYtError(''); }}
          placeholder="e.g. How AI is changing education — অথবা https://youtu.be/…" />

        {ytUrl && !r && (
          <div className="ytPanel">
            <div className="ytBadge"><MonitorPlay size={14} /> YouTube ভিডিও সনাক্ত হয়েছে</div>
            <p>Generate চাপলে ইঞ্জিন transcript এনে structure, style আর key points analyze করবে — তারপর একই ফরম্যাটে original ভিডিও বানাবে (কপি নয়)।</p>
            <button className="linkBtn" onClick={() => setShowTranscript(!showTranscript)}>
              <FileText size={12} /> Captions না পেলে transcript manually পেস্ট করুন
            </button>
            {showTranscript && (
              <textarea className="transcriptBox" rows={4} value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                placeholder="ভিডিওর transcript এখানে পেস্ট করুন (কমপক্ষে ১০০ অক্ষর)…" />
            )}
          </div>
        )}

        {ytError && <div className="ytError">⚠️ {ytError}</div>}

        {busy && phase && (
          <div className="analyzing"><Loader2 className="spin" size={15} />{phase}</div>
        )}

        {r && (
          <div className="ytResult">
            <div className="ytResultHead">
              <MonitorPlay size={16} />
              <div>
                <strong>{r.source.title}</strong>
                <small>{r.source.author} · {Math.floor(r.source.lengthSeconds / 60)}:{String(r.source.lengthSeconds % 60).padStart(2, '0')} · captions: {r.source.captionLanguage}</small>
              </div>
              <button className="linkBtn" onClick={() => setResult(null)}>বদলান</button>
            </div>
            {r.analysis ? (
              <>
                <div className="ytMeta">
                  <span><b>Topic:</b> {r.analysis.source.topic}</span>
                  <span><b>Audience:</b> {r.analysis.source.target_audience}</span>
                  <span><b>Tone:</b> {r.analysis.source.tone}</span>
                </div>
                <div className="ytStructure">
                  {r.analysis.source.structure.slice(0, 5).map((s, i) => (
                    <div key={i}><em>{i + 1}</em><span>{s.section} — {s.summary}</span></div>
                  ))}
                </div>
                <div className="ytPlan">
                  <strong>🎬 নতুন ভিডিও: {r.analysis.production.title}</strong>
                  <p>{r.analysis.production.summary}</p>
                  <small>{r.analysis.production.scenes.length} scenes · {language} · {duration} min</small>
                </div>
              </>
            ) : (
              <div className="ytMeta"><span>⚠️ Ollama অফলাইন ছিল — pipeline চালু হলে নিজে স্ক্রিপ্ট বানাবে।</span></div>
            )}
          </div>
        )}

        <div className="connectionFields">
          <label className="serverLabel">LOCAL ENGINE ADDRESS
            <input value={engine.server} onChange={(e) => engine.setServer(e.target.value)} placeholder="http://192.168.1.10:8787" />
          </label>
          <label className="serverLabel codeLabel">PAIRING CODE
            <input value={engine.pairCode} inputMode="numeric" maxLength={6}
              onChange={(e) => engine.setPairCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
          </label>
        </div>

        <div className="choices">
          <select value={style} onChange={(e) => setStyle(e.target.value)} aria-label="Style">
            {STYLES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
          <div className="seg">
            {DURATIONS.map((d) => <button key={d} className={duration === d ? 'on' : ''} onClick={() => setDuration(d)}>{d} min</button>)}
          </div>
          <div className="seg">
            {['16:9', '9:16', '1:1'].map((a) => <button key={a} className={ratio === a ? 'on' : ''} onClick={() => setRatio(a)}>{a}</button>)}
          </div>
        </div>

        <button className="generate" onClick={generate} disabled={busy || !canGenerate}>
          {busy ? <><Loader2 className="spin" size={15} />Working…</> : ytUrl && !r ? <><MonitorPlay size={15} />Analyze video</> : <><Sparkles />{r ? 'এই প্ল্যান দিয়ে production শুরু করুন' : 'Generate production'}</>}
        </button>
      </div>
    </div>
  );
}

/* ---------------- project detail ---------------- */

function ProjectDetail({ p, engine, onClose }: { p: Project; engine: ReturnType<typeof useEngine>; onClose: () => void }) {
  const [logs, setLogs] = useState(p.logs || []);
  const loadLogs = useCallback(async () => {
    const res = await fetch(`${engine.base}/api/projects/${p.id}/logs`, { headers: engine.headers() });
    if (res.ok) setLogs(await res.json());
  }, [engine, p.id]);

  useEffect(() => {
    if (p.status === 'running' || p.status === 'queued') {
      const t = setInterval(() => { void loadLogs(); void engine.loadProjects(); }, 4000);
      return () => clearInterval(t);
    }
  }, [p.status, loadLogs, engine]);

  const download = async () => {
    const res = await fetch(`${engine.base}/api/projects/${p.id}/export`, { headers: engine.headers() });
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${p.topic.replace(/[^a-z0-9]+/gi, '-').slice(0, 50)}.mp4`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal detailModal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}><X /></button>
        <span className="eyebrow">{p.status.toUpperCase()} · {p.stage}</span>
        <h2>{p.topic}</h2>
        <div className="detailMeta">
          <span><b>Style:</b> {p.settings?.style || 'Documentary'}</span>
          <span><b>Language:</b> {p.settings?.language || 'English'}</span>
          <span><b>Ratio:</b> {p.settings?.aspectRatio || '16:9'}</span>
          <span><b>Scenes:</b> {p.scenes?.length || 0}</span>
          {p.source?.type === 'youtube' && <span><b>Source:</b> <a href={p.source.url} target="_blank" rel="noreferrer">{p.source.title} ↗</a></span>}
        </div>
        <div className="bigbar"><i style={{ width: `${p.progress}%` }} /></div>

        {p.status === 'complete' && (
          <button className="generate" onClick={() => void download()}><Download size={14} /> Download MP4</button>
        )}
        {p.error && <div className="ytError">⚠️ {p.error}</div>}

        {p.scenes && p.scenes.length > 0 && (
          <div className="sceneList">
            {p.scenes.map((s, i) => (
              <div className="sceneItem" key={s.id || i}>
                <em>{i + 1}</em>
                <div>
                  <strong>{s.title}</strong>
                  <p>{(s.narration || '').slice(0, 180)}{(s.narration || '').length > 180 ? '…' : ''}</p>
                </div>
                <span className={s.image ? 'green' : ''}>{s.image ? '✓' : '…'}</span>
              </div>
            ))}
          </div>
        )}

        <div className="logBox">
          <div className="logHead"><span>ENGINE LOG</span><button className="linkBtn" onClick={() => void loadLogs()}><RefreshCw size={11} /> refresh</button></div>
          {[...logs].reverse().slice(0, 40).map((l, i) => (
            <div className={`logLine ${l.level}`} key={i}><small>{new Date(l.time).toLocaleTimeString()}</small>{l.message}</div>
          ))}
          {logs.length === 0 && <div className="logLine">No logs yet.</div>}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
