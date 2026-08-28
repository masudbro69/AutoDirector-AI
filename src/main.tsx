import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutDashboard, FolderKanban, LayoutTemplate, Library, Sparkles, Settings, Plus, Search, Bell, ChevronDown, MoreHorizontal, Play, Clock3, CheckCircle2, CircleDashed, WandSparkles, Film, Mic2, Image as ImageIcon, ArrowUpRight, SlidersHorizontal, X } from 'lucide-react';
import './styles.css';

type Project={title:string;type:string;duration:string;progress:number;status:string;time:string;theme:string};
const projects:Project[]=[
 {title:'The Future of Artificial Intelligence',type:'Documentary',duration:'10:24',progress:72,status:'Generating video',time:'Updated 2 min ago',theme:'future'},
 {title:'The Hidden Cities Beneath Us',type:'History',duration:'08:12',progress:100,status:'Ready to export',time:'Updated yesterday',theme:'city'},
 {title:'Why We Dream',type:'Science',duration:'06:45',progress:38,status:'Creating storyboard',time:'Updated 3 hrs ago',theme:'dream'},
];
const pipeline=[['Research',100],['Script',100],['Storyboard',100],['Images',100],['Video',72],['Voice',100],['Editing',45],['Quality control',0]] as const;

function App(){
 const [modal,setModal]=useState(false); const [filter,setFilter]=useState('All projects'); const [toast,setToast]=useState('');
 const [topic,setTopic]=useState(''); const [server,setServer]=useState(localStorage.getItem('autodirector-server')||'http://10.0.2.2:8787');
 const notify=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3200)};
 const createProduction=async()=>{if(topic.trim().length<3)return notify('Please enter a video topic');try{localStorage.setItem('autodirector-server',server.replace(/\/$/,''));const r=await fetch(`${server.replace(/\/$/,'')}/api/projects`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({topic,settings:{duration:10,language:'English',style:'Documentary',aspectRatio:'16:9'}})});if(!r.ok)throw new Error();setModal(false);setTopic('');notify('Production created — local AI research is starting')}catch{notify('Cannot reach local engine — check the server address')}};
 return <div className="app">
  <aside className="sidebar">
   <div className="brand"><div className="logo"><Play fill="currentColor" size={15}/></div><span>AutoDirector</span><em>AI</em></div>
   <nav><p>Workspace</p>
    <button className="active"><LayoutDashboard/>Overview</button><button><FolderKanban/>Projects <b>3</b></button><button><LayoutTemplate/>Templates</button><button><Library/>Asset library</button>
    <p>Production</p><button><Sparkles/>AI providers</button><button><Film/>Exports</button>
   </nav>
   <div className="usage"><div><span>Monthly usage</span><strong>68%</strong></div><div className="bar"><i/></div><small>6,840 of 10,000 credits</small><button onClick={()=>notify('Plans are coming soon')}>Upgrade plan <ArrowUpRight size={13}/></button></div>
   <div className="user"><div className="avatar">MK</div><div><strong>Masud Khan</strong><span>Creator plan</span></div><MoreHorizontal/></div>
  </aside>
  <main>
   <header><div className="mobileBrand">AD</div><div className="search"><Search/><input aria-label="Search" placeholder="Search projects, assets, or templates..."/><kbd>⌘ K</kbd></div><button className="iconBtn" onClick={()=>notify('You’re all caught up')}><Bell/></button><button className="create" onClick={()=>setModal(true)}><Plus/>New production</button></header>
   <section className="content">
    <div className="welcome"><div><span className="eyebrow">FRIDAY, AUGUST 28</span><h1>Good morning, Masud.</h1><p>Your studio is ready. Pick up where you left off or create something new.</p></div><button className="create secondaryCreate" onClick={()=>setModal(true)}><WandSparkles/>Create with AI</button></div>
    <div className="heroGrid">
     <div className="spotlight"><div className="spotCopy"><span className="live"><i/> PRODUCTION IN PROGRESS</span><h2>The Future of Artificial Intelligence</h2><p>Documentary · 16:9 · 10 min</p><div className="overall"><span>Overall progress</span><strong>72%</strong></div><div className="bigbar"><i/></div><div className="spotActions"><button onClick={()=>notify('Opening production workspace…')}><Play fill="currentColor"/>Open production</button><span><Clock3/>~12 min remaining</span></div></div>
      <div className="pipeline">{pipeline.map(([n,v],i)=><div className={'step '+(v===100?'done':v>0?'running':'')} key={n}><span>{v===100?<CheckCircle2/>:v>0?<CircleDashed/>:<i/>}</span><label>{n}<small>{v===100?'Complete':v>0?`${v}% complete`:'Waiting'}</small></label>{i<pipeline.length-1&&<b/>}</div>)}</div>
     </div>
     <div className="quick"><div className="sectionHead"><div><span>QUICK START</span><h3>What will you create?</h3></div><Sparkles/></div>
      <button onClick={()=>setModal(true)}><i className="qicon purple"><WandSparkles/></i><span><strong>Start from a topic</strong><small>Turn any idea into a complete video</small></span><ArrowUpRight/></button>
      <button onClick={()=>notify('Upload panel ready')}><i className="qicon blue"><ImageIcon/></i><span><strong>Upload a document</strong><small>PDF, article, notes, or script</small></span><ArrowUpRight/></button>
      <button onClick={()=>notify('Voiceover workflow selected')}><i className="qicon orange"><Mic2/></i><span><strong>Create a voiceover</strong><small>Natural narration in 40+ languages</small></span><ArrowUpRight/></button>
     </div>
    </div>
    <div className="projectsHead"><div><span className="eyebrow">YOUR WORK</span><h2>Recent projects</h2></div><div><button className="filter" onClick={()=>setFilter(filter==='All projects'?'In progress':'All projects')}><SlidersHorizontal/>{filter}<ChevronDown/></button><button className="viewAll">View all projects <ArrowUpRight/></button></div></div>
    <div className="cards">{projects.filter(p=>filter==='All projects'||p.progress<100).map(p=><article key={p.title} onClick={()=>notify(`Opening “${p.title}”`)}><div className={'thumb '+p.theme}><div className="visual"><span/></div><span className="duration">{p.duration}</span><button aria-label="Project menu" onClick={e=>{e.stopPropagation();notify('Project menu opened')}}><MoreHorizontal/></button>{p.progress===100&&<div className="ready"><CheckCircle2/>READY</div>}</div><div className="cardBody"><div className="type">{p.type}<span>•</span>16:9</div><h3>{p.title}</h3><div className="status"><span className={p.progress===100?'green':''}>{p.status}</span><b>{p.progress}%</b></div><div className="tinybar"><i style={{width:`${p.progress}%`}}/></div><small>{p.time}</small></div></article>)}</div>
   </section>
  </main>
  {modal&&<div className="overlay" onMouseDown={()=>setModal(false)}><div className="modal" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={()=>setModal(false)}><X/></button><span className="eyebrow">NEW PRODUCTION</span><h2>What’s your video about?</h2><p>Give AutoDirector a topic, idea, URL, or paste your notes.</p><textarea autoFocus value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. How artificial intelligence is changing the world"/><label className="serverLabel">LOCAL ENGINE ADDRESS<input value={server} onChange={e=>setServer(e.target.value)} placeholder="http://192.168.1.10:8787"/></label><div className="choices"><button>Documentary <ChevronDown/></button><button>10 minutes <ChevronDown/></button><button>16:9 <ChevronDown/></button></div><button className="generate" onClick={createProduction}><Sparkles/>Generate production</button></div></div>}
  {toast&&<div className="toast"><CheckCircle2/>{toast}</div>}
 </div>
}
createRoot(document.getElementById('root')!).render(<App/>);
