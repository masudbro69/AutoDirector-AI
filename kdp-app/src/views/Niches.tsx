import { useState } from 'react';
import { Plus, Search, Trash2, Pencil, Sparkles } from 'lucide-react';
import type { Store } from '../store';
import type { Niche, NicheMetrics, NicheStatus } from '../types';
import { scoreNiche } from '../scoring';
import { Chip, EmptyState, Field, Modal, NumberInput, SectionHead } from '../components/ui';
import { fmtNum } from '../utils';

const STATUS_LABELS: Record<NicheStatus, string> = {
  researching: 'Researching',
  active: 'Active',
  dominated: 'Dominated',
  paused: 'Paused',
};

const emptyMetrics: NicheMetrics = { searchResults: 500, topBSR: 30000, avgPriceUSD: 12, topReviews: 300 };

export default function Niches({ store, goto }: { store: Store; goto: (tab: string) => void }) {
  const { state, actions } = store;
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Niche | null>(null);
  const [name, setName] = useState('');
  const [metrics, setMetrics] = useState<NicheMetrics>(emptyMetrics);
  const [notes, setNotes] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const preview = scoreNiche(metrics);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setMetrics(emptyMetrics);
    setNotes('');
    setModal(true);
  };

  const openEdit = (n: Niche) => {
    setEditing(n);
    setName(n.name);
    setMetrics(n.metrics);
    setNotes(n.notes);
    setModal(true);
  };

  const save = () => {
    if (name.trim().length < 2) return;
    if (editing) actions.updateNiche(editing.id, { name: name.trim(), metrics, notes });
    else actions.addNiche(name, metrics, notes);
    setModal(false);
  };

  return (
    <div className="view">
      <SectionHead
        eyebrow="STEP 2 & 3 — NICHE RESEARCH"
        title="Niche Research & Scoring"
        sub="Don't Enter the Ocean — Become King of the Pond। Amazon-এর data বসিয়ে দেখুন নিশটা pond নাকি ocean।"
        action={
          <button className="btn accent" onClick={openAdd}>
            <Plus size={15} /> নতুন Niche
          </button>
        }
      />

      {state.niches.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Search size={28} />}
            title="প্রথম niche রিসার্চ করুন"
            detail="Amazon-এ সার্চ দিয়ে কয়টা প্রোডাক্ট আসে, top seller-এর BSR, প্রাইস আর রিভিউ — এই ৪টা ডেটা বসালেই স্কোর পেয়ে যাবেন। ভিডিওর উদাহরণ দেখতে চাইলে ডেমো লোড করুন।"
            action={
              <button className="btn ghost" onClick={() => actions.loadDemo()}>
                <Sparkles size={14} /> ভিডিওর উদাহরণ লোড করুন
              </button>
            }
          />
        </div>
      ) : (
        <div className="nicheGrid">
          {state.niches.map((n) => {
            const s = scoreNiche(n.metrics);
            return (
              <article className={`nicheCard verdict-${s.verdict}`} key={n.id}>
                <div className="nicheTop">
                  <div>
                    <h3>{n.name}</h3>
                    <div className="nicheChips">
                      <Chip tone={n.status === 'active' ? 'green' : n.status === 'dominated' ? 'accent' : n.status === 'paused' ? 'gray' : 'blue'}>{STATUS_LABELS[n.status]}</Chip>
                      <Chip tone={s.verdict === 'pond' ? 'green' : s.verdict === 'potential' ? 'amber' : 'red'}>{s.headline}</Chip>
                    </div>
                  </div>
                  <div className="nicheScore">
                    <strong style={{ color: s.verdict === 'pond' ? 'var(--green)' : s.verdict === 'potential' ? 'var(--amber)' : 'var(--red)' }}>{s.total}</strong>
                    <span>/100</span>
                  </div>
                </div>

                <p className="nicheSummary">{s.summary}</p>

                <div className="breakdown">
                  {s.breakdown.map((b) => (
                    <div className="breakRow" key={b.key}>
                      <span className="breakLabel">{b.label}</span>
                      <div className="bar">
                        <i
                          style={{
                            width: `${(b.score / b.max) * 100}%`,
                            background: b.score / b.max >= 0.66 ? 'var(--green)' : b.score / b.max >= 0.33 ? 'var(--amber)' : 'var(--red)',
                          }}
                        />
                      </div>
                      <b>
                        {b.score}/{b.max}
                      </b>
                    </div>
                  ))}
                </div>

                <div className="metricChips">
                  <span>📦 {fmtNum(n.metrics.searchResults)} প্রোডাক্ট</span>
                  <span>📊 BSR {fmtNum(n.metrics.topBSR)}</span>
                  <span>💲 ${n.metrics.avgPriceUSD}</span>
                  <span>⭐ {fmtNum(n.metrics.topReviews)} রিভিউ</span>
                </div>

                {n.notes && <p className="nicheNotes">📝 {n.notes}</p>}

                <ul className="adviceList">
                  {s.advice.slice(0, 3).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>

                <div className="nicheActions">
                  {n.status !== 'active' && s.verdict !== 'ocean' && (
                    <button className="btn small green" onClick={() => actions.updateNiche(n.id, { status: 'active' })}>
                      🎯 Active করুন
                    </button>
                  )}
                  {n.status === 'active' && (
                    <button className="btn small" onClick={() => actions.updateNiche(n.id, { status: 'dominated' })}>
                      👑 Dominate সম্পন্ন
                    </button>
                  )}
                  <button className="btn small ghost" onClick={() => goto('competitors')}>
                    প্রতিযোগী অ্যানালাইসিস
                  </button>
                  <button className="iconBtn" onClick={() => openEdit(n)} aria-label="এডিট">
                    <Pencil size={14} />
                  </button>
                  <button className="iconBtn danger" onClick={() => setConfirmId(n.id)} aria-label="ডিলিট">
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Niche এডিট করুন' : 'নতুন Niche যোগ করুন'} onClose={() => setModal(false)} wide>
          <div className="modalGrid">
            <div>
              <Field label="Niche-এর নাম" hint="যেমন: Yoga Anatomy Coloring Book">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Niche name…" />
              </Field>
              <Field label="কতটা competing product আসে?" hint="Amazon সার্চের রেজাল্ট সংখ্যা">
                <NumberInput value={metrics.searchResults} onChange={(v) => setMetrics({ ...metrics, searchResults: v })} />
              </Field>
              <Field label="Top seller-এর BSR" hint="কম = বেশি সেল (যেমন ৯০০০)">
                <NumberInput value={metrics.topBSR} onChange={(v) => setMetrics({ ...metrics, topBSR: v })} />
              </Field>
              <Field label="Average price ($)" hint="High-ticket: $12+">
                <NumberInput value={metrics.avgPriceUSD} step={0.5} onChange={(v) => setMetrics({ ...metrics, avgPriceUSD: v })} />
              </Field>
              <Field label="Top প্রতিযোগীর review সংখ্যা" hint="২২,০০০ মানে ocean!">
                <NumberInput value={metrics.topReviews} onChange={(v) => setMetrics({ ...metrics, topReviews: v })} />
              </Field>
              <Field label="নোট (ঐচ্ছিক)">
                <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="রিসার্চ নোট…" />
              </Field>
            </div>
            <div className="scorePreview">
              <span className="eyebrow">LIVE SCORE PREVIEW</span>
              <div className="previewTotal">
                <strong style={{ color: s0(preview.verdict) }}>{preview.total}</strong>
                <span>/100</span>
              </div>
              <div className="previewHeadline">{preview.headline}</div>
              <p className="muted small">{preview.summary}</p>
              <div className="breakdown">
                {preview.breakdown.map((b) => (
                  <div className="breakRow" key={b.key}>
                    <span className="breakLabel">{b.label}</span>
                    <div className="bar">
                      <i style={{ width: `${(b.score / b.max) * 100}%`, background: 'var(--accent)' }} />
                    </div>
                    <b>
                      {b.score}/{b.max}
                    </b>
                  </div>
                ))}
              </div>
              <ul className="adviceList">
                {preview.advice.slice(0, 3).map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="modalActions">
            <button className="btn ghost" onClick={() => setModal(false)}>
              বাতিল
            </button>
            <button className="btn accent" onClick={save}>
              {editing ? 'আপডেট করুন' : 'যোগ করুন'}
            </button>
          </div>
        </Modal>
      )}

      {confirmId && (
        <Modal title="Niche মুছে ফেলবেন?" onClose={() => setConfirmId(null)}>
          <p className="muted">এই niche, এর সব competitor আর product-ও মুছে যাবে।</p>
          <div className="modalActions">
            <button className="btn ghost" onClick={() => setConfirmId(null)}>
              না, থাক
            </button>
            <button
              className="btn danger"
              onClick={() => {
                actions.removeNiche(confirmId);
                setConfirmId(null);
              }}
            >
              <Trash2 size={14} /> হ্যাঁ, মুছে দিন
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function s0(verdict: string): string {
  return verdict === 'pond' ? 'var(--green)' : verdict === 'potential' ? 'var(--amber)' : 'var(--red)';
}
