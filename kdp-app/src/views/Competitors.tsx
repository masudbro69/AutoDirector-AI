import { useMemo, useState } from 'react';
import { Plus, Trash2, Users, ExternalLink } from 'lucide-react';
import type { Store } from '../store';
import type { Competitor } from '../types';
import { EmptyState, Field, Modal, NumberInput, SectionHead } from '../components/ui';
import { fmtNum } from '../utils';

export default function Competitors({ store }: { store: Store }) {
  const { state, actions } = store;
  const niches = state.niches;
  const [nicheId, setNicheId] = useState<string>(niches.find((n) => n.status === 'active')?.id || niches[0]?.id || '');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', priceUSD: 12, bsr: 50000, reviews: 100, notes: '', url: '' });
  const [editing, setEditing] = useState<Competitor | null>(null);

  const selected = niches.find((n) => n.id === nicheId);
  const competitors = useMemo(() => state.competitors.filter((c) => c.nicheId === nicheId), [state.competitors, nicheId]);

  const summary = useMemo(() => {
    if (competitors.length === 0) return null;
    const prices = competitors.map((c) => c.priceUSD);
    const bsrs = competitors.map((c) => c.bsr);
    const reviews = competitors.map((c) => c.reviews);
    return {
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      bestBSR: Math.min(...bsrs),
      maxReviews: Math.max(...reviews),
      count: competitors.length,
    };
  }, [competitors]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', priceUSD: 12, bsr: 50000, reviews: 100, notes: '', url: '' });
    setModal(true);
  };

  const openEdit = (c: Competitor) => {
    setEditing(c);
    setForm({ name: c.name, priceUSD: c.priceUSD, bsr: c.bsr, reviews: c.reviews, notes: c.notes, url: c.url || '' });
    setModal(true);
  };

  const save = () => {
    if (form.name.trim().length < 2 || !nicheId) return;
    if (editing) actions.updateCompetitor(editing.id, { ...form, nicheId });
    else actions.addCompetitor({ ...form, nicheId });
    setModal(false);
  };

  if (niches.length === 0) {
    return (
      <div className="view">
        <SectionHead eyebrow="STEP 5 — COMPETITOR ANALYSIS" title="Competitor Deep Analysis" />
        <div className="card">
          <EmptyState icon={<Users size={28} />} title="আগে একটা niche যোগ করুন" detail="Competitor ট্র্যাক করার আগে Niche Research ট্যাবে অন্তত একটা নিশ থাকতে হবে।" />
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <SectionHead
        eyebrow="STEP 5 — COMPETITOR ANALYSIS"
        title="Competitor Deep Analysis"
        sub="প্রতিযোগীদের price, BSR, রিভিউ, presentation, interior আর A+ content — সব মার্ক করে মার্কেটে ঢুকুন। ইংরেজি রিভিউ না বুঝলে স্ক্রিনশট নিয়ে AI-কে দেখান।"
        action={
          <button className="btn accent" onClick={openAdd}>
            <Plus size={15} /> প্রতিযোগী যোগ
          </button>
        }
      />

      <div className="nicheTabs">
        {niches.map((n) => (
          <button key={n.id} className={`tab ${n.id === nicheId ? 'on' : ''}`} onClick={() => setNicheId(n.id)}>
            {n.name}
          </button>
        ))}
      </div>

      {summary && (
        <div className="compSummary">
          <div className="compStat">
            <span>Average Price</span>
            <strong>${summary.avgPrice.toFixed(2)}</strong>
            <small>রেঞ্জ ${summary.minPrice}–${summary.maxPrice}</small>
          </div>
          <div className="compStat">
            <span>Best BSR</span>
            <strong>{fmtNum(summary.bestBSR)}</strong>
            <small>নিশে demand আছে কি না বোঝায়</small>
          </div>
          <div className="compStat">
            <span>রিভিউ ব্যারিয়ার</span>
            <strong>{fmtNum(summary.maxReviews)}</strong>
            <small>sabche boro competitor</small>
          </div>
          <div className="compStat">
            <span>Tracked</span>
            <strong>{summary.count}টা</strong>
            <small>{selected?.name}</small>
          </div>
          <div className="compInsight">
            💡{' '}
            {summary.avgPrice >= 18
              ? 'High-ticket নিশ — $18+ প্রাইসে কম সেলেই ভালো প্রফিট। আপনার pricing-ও এই রেঞ্জে রাখুন।'
              : summary.avgPrice >= 12
                ? 'ঠিক আছে — $12+ প্রাইসে $4+ প্রফিট সম্ভব। Premium presentation দিয়ে প্রাইস আরও বাড়ানো যায়।'
                : 'প্রাইস কম — high-ticket sub-niche খুঁজে দেখুন, নাহলে অনেক সেল লাগবে।'}
          </div>
        </div>
      )}

      {competitors.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users size={26} />}
            title="এই নিশে এখনো কোনো competitor ট্র্যাক করা হয়নি"
            detail="Amazon-এ নিশের top ৩–৫ প্রোডাক্ট যোগ করুন — তাদের presentation, interior structure আর A+ content নোট করুন।"
            action={
              <button className="btn accent" onClick={openAdd}>
                <Plus size={14} /> প্রহিযোগী যোগ করুন
              </button>
            }
          />
        </div>
      ) : (
        <div className="card tableCard">
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>প্রোডাক্ট</th>
                  <th>Price</th>
                  <th>BSR</th>
                  <th>Reviews</th>
                  <th>নোট (presentation, interior, A+)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong className="compName">{c.name}</strong>
                      {c.url && (
                        <a className="compLink" href={c.url} target="_blank" rel="noreferrer">
                          <ExternalLink size={12} /> Amazon-এ দেখুন
                        </a>
                      )}
                    </td>
                    <td className="num">${c.priceUSD.toFixed(2)}</td>
                    <td className="num">{fmtNum(c.bsr)}</td>
                    <td className="num">{fmtNum(c.reviews)}</td>
                    <td className="notesCell">{c.notes}</td>
                    <td className="rowActions">
                      <button className="iconBtn" onClick={() => openEdit(c)} aria-label="এডিট">
                        ✏️
                      </button>
                      <button className="iconBtn danger" onClick={() => actions.removeCompetitor(c.id)} aria-label="ডিলিট">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Competitor এডিট' : 'Competitor যোগ করুন'} onClose={() => setModal(false)} wide>
          <Field label="প্রোডাক্টের নাম">
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="যেমন: Anatomy of Yoga — Premium Edition" />
          </Field>
          <div className="formRow">
            <Field label="Price ($)">
              <NumberInput value={form.priceUSD} step={0.5} onChange={(v) => setForm({ ...form, priceUSD: v })} />
            </Field>
            <Field label="BSR">
              <NumberInput value={form.bsr} onChange={(v) => setForm({ ...form, bsr: v })} />
            </Field>
            <Field label="Reviews">
              <NumberInput value={form.reviews} onChange={(v) => setForm({ ...form, reviews: v })} />
            </Field>
          </div>
          <Field label="Deep analysis নোট" hint="প্রেজেন্টেশন, interior structure, A+ content, ব্র্যান্ড কোলাবোরেশন">
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="যেমন: premium interior, A+ content-এ ইলাস্ট্রেটেড প্রিভিউ…" />
          </Field>
          <Field label="Amazon লিংক (ঐচ্ছিক)">
            <input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://amazon.com/…" />
          </Field>
          <div className="modalActions">
            <button className="btn ghost" onClick={() => setModal(false)}>
              বাতিল
            </button>
            <button className="btn accent" onClick={save}>
              {editing ? 'আপডেট' : 'যোগ করুন'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
