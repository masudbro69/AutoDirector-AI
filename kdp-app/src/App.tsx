import { useRef, useState } from 'react';
import {
  LayoutDashboard,
  Calculator as CalcIcon,
  Search,
  Users,
  ListChecks,
  CalendarDays,
  Settings as SettingsIcon,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  BookOpenCheck,
} from 'lucide-react';
import type { Store } from './store';
import { useKdpStore } from './store';
import Dashboard from './views/Dashboard';
import Calculator from './views/Calculator';
import Niches from './views/Niches';
import Competitors from './views/Competitors';
import Pipeline from './views/Pipeline';
import Roadmap from './views/Roadmap';
import { Field, Modal, NumberInput, SectionHead } from './components/ui';
import type { AppState } from './types';

const TABS = [
  { key: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { key: 'calculator', label: 'Income Calculator', icon: CalcIcon },
  { key: 'niches', label: 'Niche Research', icon: Search },
  { key: 'competitors', label: 'Competitors', icon: Users },
  { key: 'pipeline', label: 'Pipeline', icon: ListChecks },
  { key: 'roadmap', label: 'Roadmap', icon: CalendarDays },
];

export default function App({ store }: { store: Store }) {
  const [tab, setTab] = useState('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const goto = (t: string) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">
            <BookOpenCheck size={18} />
          </div>
          <div>
            <strong>
              KDP <em>Command Center</em>
            </strong>
            <span>Amazon Kindle Domination System</span>
          </div>
        </div>

        <nav>
          <p className="navTitle">সিস্টেম</p>
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => goto(t.key)}>
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="sideGoal">
          <span>মাসিক টার্গেট</span>
          <strong>৳{store.state.settings.monthlyGoalBDT.toLocaleString('en-IN')}</strong>
          <small>দিনে {store.stats.salesNeededPerDay}টা সেলেই পূরণ</small>
        </div>

        <button className="settingsBtn" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon size={15} /> Settings & Data
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobileBrand">
            <BookOpenCheck size={18} /> <span>KDP Command Center</span>
          </div>
          <div className="topStats">
            <span>
              🔥 <b>{store.stats.weekStreak}</b> সপ্তাহ streak
            </span>
            <span>
              📦 <b>{store.stats.liveProducts}</b> live
            </span>
            <span>
              📈 <b>{Math.round(store.stats.goalProgressPct)}%</b> মাসের টার্গেট
            </span>
          </div>
          <button className="settingsBtn mobileSettings" onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <SettingsIcon size={16} />
          </button>
        </header>

        <div className="content">
          {tab === 'dashboard' && <Dashboard store={store} goto={goto} />}
          {tab === 'calculator' && <Calculator store={store} />}
          {tab === 'niches' && <Niches store={store} goto={goto} />}
          {tab === 'competitors' && <Competitors store={store} />}
          {tab === 'pipeline' && <Pipeline store={store} />}
          {tab === 'roadmap' && <Roadmap store={store} />}
        </div>

        <footer className="footer">
          KDP Command Center — “Amazon Kindle Business: ০ থেকে মাসে ৩০,০০০+ টাকা” ভিডিওর সিস্টেম অনুযায়ী তৈরি। সব ডেটা আপনার ব্রাউজারেই থাকে।
        </footer>
      </main>

      <nav className="bottomNav">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => goto(t.key)} aria-label={t.label}>
            <t.icon size={18} />
            <span>{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>

      {settingsOpen && <SettingsModal store={store} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function SettingsModal({ store, onClose }: { store: Store; onClose: () => void }) {
  const { state, actions } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kdp-command-center-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as AppState;
      actions.importState(parsed);
      setMsg('ডেটা ইমপোর্ট হয়েছে ✅');
    } catch {
      setMsg('ফাইলটা পড়া গেল না — সঠিক JSON ব্যাকআপ দিন');
    }
  };

  const s = state.settings;

  return (
    <Modal title="Settings & Data" onClose={onClose} wide>
      <SectionHead eyebrow="প্ল্যান" title="আপনার সংখ্যাগুলো" />
      <div className="formRow">
        <Field label="আপনার নাম">
          <input className="input" value={s.creatorName} onChange={(e) => actions.updateSettings({ creatorName: e.target.value })} />
        </Field>
        <Field label="মাসিক টার্গেট (৳)">
          <NumberInput value={s.monthlyGoalBDT} min={1000} step={1000} onChange={(v) => actions.updateSettings({ monthlyGoalBDT: v })} />
        </Field>
        <Field label="ডলার রেট (৳/$)">
          <NumberInput value={s.usdRate} min={50} max={200} onChange={(v) => actions.updateSettings({ usdRate: v })} />
        </Field>
      </div>
      <div className="formRow">
        <Field label="প্রতি বইয়ে প্রফিট ($)">
          <NumberInput value={s.profitPerBookUSD} min={0.5} step={0.5} onChange={(v) => actions.updateSettings({ profitPerBookUSD: v })} />
        </Field>
        <Field label="সপ্তাহে আপলোড">
          <NumberInput value={s.uploadsPerWeek} min={1} max={50} onChange={(v) => actions.updateSettings({ uploadsPerWeek: v })} />
        </Field>
        <Field label="প্রতি niche-এ প্রোডাক্ট">
          <NumberInput value={s.productsPerNiche} min={1} max={100} onChange={(v) => actions.updateSettings({ productsPerNiche: v })} />
        </Field>
      </div>
      <div className="formRow">
        <Field label="Domination টার্গেট">
          <NumberInput value={s.dominationTarget} min={10} max={1000} onChange={(v) => actions.updateSettings({ dominationTarget: v })} />
        </Field>
        <Field label="প্ল্যানের মেয়াদ (মাস)">
          <NumberInput value={s.planMonths} min={1} max={24} onChange={(v) => actions.updateSettings({ planMonths: v })} />
        </Field>
      </div>

      <SectionHead eyebrow="ডেটা" title="ব্যাকআপ ও রিসেট" />
      <div className="dataActions">
        <button className="btn ghost" onClick={exportData}>
          <Download size={14} /> JSON এক্সপোর্ট
        </button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> ব্যাকআপ ইমপোর্ট
        </button>
        <button className="btn ghost" onClick={() => actions.loadDemo()}>
          <Sparkles size={14} /> ভিডিওর ডেমো ডেটা
        </button>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm('সব ডেটা মুছে ফেলে নতুন করে শুরু করবেন?')) actions.reset();
          }}
        >
          <RotateCcw size={14} /> সব রিসেট
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importData(f);
          }}
        />
      </div>
      {msg && <p className="muted small">{msg}</p>}
      <p className="muted small">🔒 আপনার সব ডেটা শুধুমাত্র এই ব্রাউজারের localStorage-এ সেভ থাকে — কোথাও আপলোড হয় না। নিয়মিত JSON ব্যাকআপ নিয়ে রাখুন।</p>
      <div className="modalActions">
        <button className="btn accent" onClick={onClose}>
          হয়ে গেছে
        </button>
      </div>
    </Modal>
  );
}

export function useApp() {
  return useKdpStore();
}
