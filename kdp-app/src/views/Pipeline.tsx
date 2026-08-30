import { useState } from 'react';
import { Plus, AlertTriangle, Trash2, Crown } from 'lucide-react';
import type { Store } from '../store';
import type { Product, ProductStatus } from '../types';
import { PRODUCT_STATUSES, UNIQUENESS_LABELS } from '../types';
import { Chip, EmptyState, Field, Modal, ProgressBar, SectionHead } from '../components/ui';
import { fmtNum } from '../utils';

export default function Pipeline({ store }: { store: Store }) {
  const { state, actions } = store;
  const [filterNiche, setFilterNiche] = useState('all');
  const [modal, setModal] = useState(false);
  const [warnProduct, setWarnProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    nicheId: '',
    title: '',
    subtitle: '',
    keywords: '',
    status: 'research' as ProductStatus,
    unique: { uniqueTitle: false, uniqueSubtitle: false, newKeywords: false, newInterior: false, newDesign: false },
  });

  const niches = state.niches;
  const products = state.products.filter((p) => filterNiche === 'all' || p.nicheId === filterNiche);
  const liveCount = state.products.filter((p) => p.status === 'live').length;
  const nicheName = (id: string) => niches.find((n) => n.id === id)?.name || '—';

  const openAdd = () => {
    setEditing(null);
    setForm({
      nicheId: niches.find((n) => n.status === 'active')?.id || niches[0]?.id || '',
      title: '',
      subtitle: '',
      keywords: '',
      status: 'research',
      unique: { uniqueTitle: false, uniqueSubtitle: false, newKeywords: false, newInterior: false, newDesign: false },
    });
    setModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ nicheId: p.nicheId, title: p.title, subtitle: p.subtitle, keywords: p.keywords, status: p.status, unique: { ...p.unique } });
    setModal(true);
  };

  /** ভিডিওর anti copy-paste rule: upload/live-এ যাওয়ার আগে ইউনিকনেস চেক */
  const tryMove = (p: Product, status: ProductStatus) => {
    if (status === 'upload' || status === 'live') {
      const allUnique = Object.values(p.unique).every(Boolean);
      if (!allUnique) {
        setWarnProduct(p);
        return;
      }
    }
    actions.updateProduct(p.id, { status });
  };

  const save = () => {
    if (form.title.trim().length < 2 || !form.nicheId) return;
    if (editing) actions.updateProduct(editing.id, { ...form });
    else actions.addProduct({ ...form });
    setModal(false);
  };

  return (
    <div className="view">
      <SectionHead
        eyebrow="STEP 6 — DOMINATE THE NICHE"
        title="Product Pipeline"
        sub="একটা নিশে ইউনিক প্রোডাক্টের পাহাড় বানান — প্রতিটার নতুন টাইটেল, সাবটাইটেল, কিওয়ার্ড আর ইন্টেরিয়র। কপি-পেস্ট কখনো না!"
        action={
          <button className="btn accent" onClick={openAdd} disabled={niches.length === 0}>
            <Plus size={15} /> নতুন প্রোডাক্ট
          </button>
        }
      />

      <div className="dominationBar card">
        <div className="domInfo">
          <Crown size={18} />
          <div>
            <strong>
              Domination প্রোগ্রেস — {fmtNum(liveCount)}/{fmtNum(state.settings.dominationTarget)} live প্রোডাক্ট
            </strong>
            <small>
              ভিডিওর প্ল্যান: প্রিমিয়াম কোয়ালিটিতে ১৫০–৩০০টা প্রোডাক্ট আপলোড করলে সেল না আসা প্রায় impossible। (Settings-এ টার্গেট বদলান)
            </small>
          </div>
        </div>
        <ProgressBar value={liveCount} max={state.settings.dominationTarget} height={10} />
      </div>

      {niches.length > 0 && (
        <div className="nicheTabs">
          <button className={`tab ${filterNiche === 'all' ? 'on' : ''}`} onClick={() => setFilterNiche('all')}>
            সব নিশ ({state.products.length})
          </button>
          {niches.map((n) => (
            <button key={n.id} className={`tab ${n.id === filterNiche ? 'on' : ''}`} onClick={() => setFilterNiche(n.id)}>
              {n.name} ({state.products.filter((p) => p.nicheId === n.id).length})
            </button>
          ))}
        </div>
      )}

      {state.products.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Plus size={26} />}
            title="Pipeline খালি"
            detail={niches.length === 0 ? 'আগে Niche Research ট্যাবে একটা নিশ যোগ করুন।' : 'প্রথম প্রোডাক্ট প্ল্যান করুন — ইউনিক টাইটেল, সাবটাইটেল আর কিওয়ার্ড এক্সপেরিমেন্ট সহ।'}
            action={
              niches.length === 0 ? undefined : (
                <button className="btn accent" onClick={openAdd}>
                  <Plus size={14} /> প্রোডাক্ট যোগ করুন
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="kanban">
          {PRODUCT_STATUSES.map((st) => {
            const items = products.filter((p) => p.status === st.key);
            return (
              <div className="kanbanCol" key={st.key}>
                <div className="kanbanHead">
                  <strong>{st.label}</strong>
                  <span className="count">{items.length}</span>
                </div>
                <small className="kanbanHint">{st.hint}</small>
                {items.map((p) => {
                  const uniqueDone = Object.values(p.unique).filter(Boolean).length;
                  return (
                    <div className="prodCard" key={p.id} onClick={() => openEdit(p)}>
                      <div className="prodTitle">{p.title || '(শিরোনাম নেই)'}</div>
                      {p.subtitle && <div className="prodSub">{p.subtitle}</div>}
                      <div className="prodMeta">
                        <Chip tone="gray">{nicheName(p.nicheId)}</Chip>
                      </div>
                      <div className="uniqueDots" title={`Uniqueness ${uniqueDone}/5`}>
                        {UNIQUENESS_LABELS.map((u) => (
                          <i key={u.key} className={p.unique[u.key] ? 'on' : ''} title={u.label} />
                        ))}
                        <span>{uniqueDone}/5 ইউনিক</span>
                      </div>
                      <div className="prodFlow" onClick={(e) => e.stopPropagation()}>
                        {st.key !== 'research' && (
                          <button className="btn tiny" onClick={() => tryMove(p, PRODUCT_STATUSES[PRODUCT_STATUSES.findIndex((s) => s.key === st.key) - 1].key)} title="এক ধাপ পিছনে">
                            ←
                          </button>
                        )}
                        {st.key !== 'live' && (
                          <button
                            className="btn tiny accent"
                            onClick={() => tryMove(p, PRODUCT_STATUSES[PRODUCT_STATUSES.findIndex((s) => s.key === st.key) + 1].key)}
                          >
                            পরের ধাপ →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'প্রোডাক্ট এডিট' : 'নতুন প্রোডাক্ট'} onClose={() => setModal(false)} wide>
          <div className="modalGrid">
            <div>
              <Field label="কোন niche-এ?">
                <select className="input" value={form.nicheId} onChange={(e) => setForm({ ...form, nicheId: e.target.value })}>
                  {niches.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="টাইটেল" hint="অবশ্যই ইউনিক — কপি না">
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="যেমন: Yoga Anatomy Coloring Book — Illustrated Asanas" />
              </Field>
              <Field label="সাবটাইটেল">
                <input className="input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="যেমন: 50 Unique Muscle-Mapped Poses" />
              </Field>
              <Field label="কিওয়ার্ড (কমা দিয়ে)">
                <input className="input" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="yoga anatomy coloring book, asana guide" />
              </Field>
              <Field label="স্টেটাস">
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}>
                  {PRODUCT_STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div>
              <span className="fieldLabel">Uniqueness চেকলিস্ট (anti copy-paste)</span>
              <p className="muted small">ভিডিওর নিয়ম: নতুন প্রোডাক্ট = নতুন লিস্টিং, নতুন এক্সপেরিমেন্ট, নতুন লুক। এক ডিজাইন ১০ বার আপলোড করলে একাউন্টও নষ্ট হয়, মার্কেটও।</p>
              <div className="checkList">
                {UNIQUENESS_LABELS.map((u) => (
                  <label className="checkItem" key={u.key}>
                    <input
                      type="checkbox"
                      checked={form.unique[u.key]}
                      onChange={(e) => setForm({ ...form, unique: { ...form.unique, [u.key]: e.target.checked } })}
                    />
                    <span>{u.label}</span>
                  </label>
                ))}
              </div>
              {editing && (
                <button className="iconBtn danger delProduct" onClick={() => { actions.removeProduct(editing.id); setModal(false); }} aria-label="ডিলিট">
                  <Trash2 size={14} /> প্রোডাক্ট মুছুন
                </button>
              )}
            </div>
          </div>
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

      {warnProduct && (
        <Modal title="⚠️ ইউনিকনেস চেক ফেল!" onClose={() => setWarnProduct(null)}>
          <div className="warnBox">
            <AlertTriangle size={22} color="var(--amber)" />
            <p>
              <b>{warnProduct.title}</b> — এই প্রোডাক্টের সব uniqueness চেক এখনো পূরণ হয়নি। ভিডিওতে হাত জোড় করে বলা হয়েছে: কপি-পেস্ট করে মার্কেট নষ্ট করবেন না — নিজের একাউন্টও সাসপেন্ড হতে পারে।
            </p>
          </div>
          <ul className="adviceList">
            {UNIQUENESS_LABELS.filter((u) => !warnProduct.unique[u.key]).map((u) => (
              <li key={u.key}>এখনো বাকি: {u.label}</li>
            ))}
          </ul>
          <div className="modalActions">
            <button className="btn ghost" onClick={() => setWarnProduct(null)}>
              ঠিক আছে, আগে ঠিক করব
            </button>
            <button
              className="btn amber"
              onClick={() => {
                actions.updateProduct(warnProduct.id, { status: 'upload' });
                setWarnProduct(null);
              }}
            >
              জানি যা করছি — এগিয়ে যান
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
