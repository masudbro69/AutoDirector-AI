import { useMemo, useState } from 'react';
import { CalendarDays, Flame, Upload } from 'lucide-react';
import type { Store } from '../store';
import { buildRoadmap, elapsedWeeks } from '../roadmap';
import { Chip, Field, NumberInput, ProgressBar, SectionHead } from '../components/ui';
import { addDays, fmtNum, startOfWeek, toDateStr } from '../utils';

export default function Roadmap({ store }: { store: Store }) {
  const { state, actions, stats } = store;
  const [manualCount, setManualCount] = useState(1);

  const phases = useMemo(() => buildRoadmap(state.settings), [state.settings]);
  const currentWeek = elapsedWeeks(state.settings.planStart);

  /** শেষ ১৬ সপ্তাহের আপলোড হিসাব */
  const weeks = useMemo(() => {
    const monday = startOfWeek(new Date());
    const out: { label: string; uploads: number; start: Date }[] = [];
    for (let i = 15; i >= 0; i--) {
      const start = addDays(monday, -7 * i);
      let uploads = 0;
      for (let d = 0; d < 7; d++) {
        uploads += stats.uploadCountByDate(toDateStr(addDays(start, d)));
      }
      out.push({ label: `W${52 - i}`, uploads, start });
    }
    return out;
  }, [stats]);

  /** শেষ ২৬ সপ্তাহের heatmap (দিন অনুযায়ী) */
  const heat = useMemo(() => {
    const monday = startOfWeek(new Date());
    const cells: { date: string; count: number }[] = [];
    for (let w = 25; w >= 0; w--) {
      for (let d = 0; d < 7; d++) {
        const date = toDateStr(addDays(monday, -7 * w + d));
        cells.push({ date, count: stats.uploadCountByDate(date) });
      }
    }
    return cells;
  }, [stats]);

  const maxWeekUploads = Math.max(1, ...weeks.map((w) => w.uploads));
  const todayCount = stats.uploadCountByDate(toDateStr(new Date()));

  return (
    <div className="view">
      <SectionHead
        eyebrow="STEP 7 — CONSISTENCY (৬ মাস)"
        title="Roadmap & Consistency Tracker"
        sub="সপ্তাহে ৫–১০টা আপলোড, ২ সপ্তাহে ১ নিশ কমপ্লিট — ৬ মাস consistency-ই আসল সিক্রেট। এখানে আপনার প্রোগ্রেস ট্র্যাক করুন।"
      />

      <div className="roadTop">
        <div className="card weekCard">
          <span className="eyebrow">এই সপ্তাহ</span>
          <h3>
            {stats.thisWeekUploads}/{state.settings.uploadsPerWeek} আপলোড
          </h3>
          <ProgressBar value={stats.thisWeekUploads} max={state.settings.uploadsPerWeek} height={10} />
          <p className="muted small">
            আজ করা আপলোড: <b>{todayCount}টা</b> · Streak: <b>{stats.weekStreak} সপ্তাহ</b> 🔥
          </p>
          <div className="manualUpload">
            <span>Pipeline-এ নেই এমন আপলোড লগ করুন:</span>
            <div className="manualRow">
              <NumberInput value={manualCount} min={1} onChange={(v) => setManualCount(Math.max(1, Math.round(v)))} />
              <button className="btn accent" onClick={() => actions.logManualUploads(manualCount)}>
                <Upload size={14} /> যোগ
              </button>
            </div>
          </div>
        </div>

        <div className="card weeksChart">
          <span className="eyebrow">শেষ ১৬ সপ্তাহের আপলোড</span>
          <div className="chart">
            {weeks.map((w, i) => (
              <div className="chartCol" key={i} title={`${toDateStr(w.start)} — ${w.uploads} আপলোড`}>
                <div className="chartBarWrap">
                  <div
                    className="chartBar"
                    style={{
                      height: `${Math.max(4, (w.uploads / maxWeekUploads) * 100)}%`,
                      background: w.uploads >= state.settings.uploadsPerWeek ? 'var(--green)' : w.uploads > 0 ? 'var(--accent)' : 'var(--border-strong)',
                    }}
                  />
                </div>
                <span className="chartVal">{w.uploads}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card heatCard">
          <span className="eyebrow">Consistency Heatmap (২৬ সপ্তাহ)</span>
          <div className="heatGrid">
            {heat.map((c) => (
              <i
                key={c.date}
                className={`heat ${c.count === 0 ? '' : c.count < 3 ? 'l1' : c.count < 6 ? 'l2' : c.count < 10 ? 'l3' : 'l4'}`}
                title={`${c.date}: ${c.count} আপলোড`}
              />
            ))}
          </div>
          <div className="heatLegend">
            <span>কম</span>
            <i className="heat" />
            <i className="heat l1" />
            <i className="heat l2" />
            <i className="heat l3" />
            <i className="heat l4" />
            <span>বেশি</span>
          </div>
        </div>
      </div>

      <div className="card">
        <SectionHead
          eyebrow="AUTO-GENERATED PLAN"
          title="আপনার ৬ মাসের রোডম্যাপ"
          sub={`Settings অনুযায়ী তৈরি — সপ্তাহে ${state.settings.uploadsPerWeek}টা আপলোড, ${state.settings.productsPerNiche}টা প্রোডাক্ট/নিশ, মোট ${fmtNum(state.settings.dominationTarget)}টার domination টার্গেট।`}
        />
        <div className="timeline">
          {phases.map((ph, i) => {
            const done = currentWeek > ph.startWeek + ph.weeks - 1;
            const active = currentWeek >= ph.startWeek && !done;
            return (
              <div className={`phase ${active ? 'active' : ''} ${done ? 'done' : ''}`} key={i}>
                <div className="phaseDot">{done ? '✓' : active ? '●' : i + 1}</div>
                <div className="phaseBody">
                  <div className="phaseHead">
                    <strong>{ph.title}</strong>
                    <Chip tone={done ? 'green' : active ? 'accent' : 'gray'}>
                      সপ্তাহ {ph.startWeek}–{ph.startWeek + ph.weeks - 1}
                    </Chip>
                    {active && <Chip tone="green">চলছে (সপ্তাহ {currentWeek})</Chip>}
                  </div>
                  <ul>
                    {ph.items.map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card planCard">
        <div className="formRow">
          <Field label="সপ্তাহে আপলোড টার্গেট">
            <NumberInput value={state.settings.uploadsPerWeek} min={1} max={50} onChange={(v) => actions.updateSettings({ uploadsPerWeek: Math.max(1, Math.round(v)) })} />
          </Field>
          <Field label="প্রতি niche-এ প্রোডাক্ট">
            <NumberInput value={state.settings.productsPerNiche} min={1} max={100} onChange={(v) => actions.updateSettings({ productsPerNiche: Math.max(1, Math.round(v)) })} />
          </Field>
          <Field label="Domination টার্গেট (মোট প্রোডাক্ট)">
            <NumberInput value={state.settings.dominationTarget} min={10} max={1000} onChange={(v) => actions.updateSettings({ dominationTarget: Math.max(10, Math.round(v)) })} />
          </Field>
          <Field label="রোডম্যাপ শুরুর তারিখ">
            <input type="date" className="input" value={state.settings.planStart} onChange={(e) => actions.updateSettings({ planStart: e.target.value })} />
          </Field>
        </div>
        <p className="muted small">
          <CalendarDays size={13} /> প্ল্যান বদলালেই রোডম্যাপ সাথে সাথে আপডেট হয়ে যায়। ভিডিওর হিসাবে ২ সপ্তাহে ১০টা প্রোডাক্ট = একটা নিশ কমপ্লিট।
        </p>
        <div className="flameRow">
          <Flame size={15} color="var(--amber)" />
          <span>
            মনে রাখবেন: চাকরির মতো করে সপ্তাহে ৫টাও দিলে ৬ মাসে দাঁড়ায় ১৩০টা প্রোডাক্ট — টার্গেটের কাছাকাছি। আর সেল না এলে ভিডিও অনুযায়ী প্ল্যানটাই রিভিউ করুন, নিশ বদলাবেন না।
          </span>
        </div>
      </div>
    </div>
  );
}
