import { useState } from 'react';
import { Flame, ListChecks, Plus, Target, TrendingUp, Upload, Wallet, Crown, Waves, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import type { Store } from '../store';
import { scoreNiche, GOLDEN_RULES } from '../scoring';
import { PRODUCT_STATUSES } from '../types';
import { Chip, EmptyState, ProgressBar, Ring, SectionHead } from '../components/ui';
import { fmtBDT, fmtDate, fmtNum, todayStr } from '../utils';

export default function Dashboard({ store, goto }: { store: Store; goto: (tab: string) => void }) {
  const { state, stats, actions, statusCounts } = store;
  const [units, setUnits] = useState(2);
  const [profit, setProfit] = useState(state.settings.profitPerBookUSD);

  const goalUSD = state.settings.monthlyGoalBDT / Math.max(1, state.settings.usdRate);
  const scoredNiches = state.niches
    .map((n) => ({ niche: n, score: scoreNiche(n.metrics) }))
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 4);

  const todaySales = state.sales.filter((s) => s.date === todayStr());
  const todayUnits = todaySales.reduce((sum, s) => sum + s.units, 0);
  const recentSales = [...state.sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const activeNiche = state.niches.find((n) => n.status === 'active');
  const bestNiche = scoredNiches[0];


  return (
    <div className="view">
      <div className="dashHero">
        <div className="goalCard">
          <Ring percent={stats.goalProgressPct} size={148}>
            <strong>{Math.round(stats.goalProgressPct)}%</strong>
            <span>মাসের টার্গেট</span>
          </Ring>
          <div className="goalInfo">
            <span className="eyebrow">এই মাসের আয় (profit)</span>
            <h2>
              {fmtBDT(stats.monthEarningsBDT)} <em>/ {fmtBDT(state.settings.monthlyGoalBDT)}</em>
            </h2>
            <p>
              টার্গেট পূরণে দরকার <b>{fmtNum(stats.salesNeededPerMonth)} সেল/মাস</b> — মানে দিনে মাত্র <b>{stats.salesNeededPerDay}টা সেল</b> 😎
            </p>
            <div className="quickSale">
              <span>আজকের সেল যোগ করুন:</span>
              <input type="number" min={0} value={units} onChange={(e) => setUnits(Math.max(0, parseInt(e.target.value) || 0))} aria-label="Units" />
              <div className="usdWrap">
                <b>$</b>
                <input type="number" min={0} step={0.5} value={profit} onChange={(e) => setProfit(Math.max(0, parseFloat(e.target.value) || 0))} aria-label="Profit per unit" />
              </div>
              <button
                className="btn accent"
                onClick={() => {
                  if (units <= 0) return;
                  actions.logSale(units, units * profit);
                }}
              >
                <Plus size={14} /> যোগ
              </button>
            </div>
            <small>
              আজ পর্যন্ত: <b>{todayUnits}টা সেল</b> · ${todaySales.reduce((s, x) => s + x.profitUSD, 0).toFixed(0)} profit
            </small>
          </div>
        </div>

        <div className="statGrid">
          <div className="statCard">
            <div className="statIcon green">
              <TrendingUp size={17} />
            </div>
            <div>
              <span>Live Products</span>
              <strong>{fmtNum(stats.liveProducts)}</strong>
              <small>domination টার্গেট: {fmtNum(state.settings.dominationTarget)}</small>
            </div>
          </div>
          <div className="statCard">
            <div className="statIcon accent">
              <Upload size={17} />
            </div>
            <div>
              <span>এই সপ্তাহের আপলোড</span>
              <strong>
                {stats.thisWeekUploads}/{state.settings.uploadsPerWeek}
              </strong>
              <ProgressBar value={stats.thisWeekUploads} max={state.settings.uploadsPerWeek} />
            </div>
          </div>
          <div className="statCard">
            <div className="statIcon amber">
              <Flame size={17} />
            </div>
            <div>
              <span>Consistency Streak</span>
              <strong>{stats.weekStreak} সপ্তাহ</strong>
              <small>টানা weekly target পূরণ</small>
            </div>
          </div>
          <div className="statCard">
            <div className="statIcon blue">
              <Target size={17} />
            </div>
            <div>
              <span>মাসিক সেল</span>
              <strong>{fmtNum(stats.monthUnits)}</strong>
              <small>দরকার {fmtNum(stats.salesNeededPerMonth)}টা</small>
            </div>
          </div>
        </div>
      </div>

      <div className="dashCols">
        <div className="dashMain">
          <div className="card">
            <SectionHead
              eyebrow="ভিডিওর সিস্টেম"
              title="৭টি Golden Rule"
              sub="Amazon KDP-তে ০ থেকে ৩০,০০০+ টাকার রোডম্যাপের মূল নিয়মগুলো"
            />
            <div className="rulesList">
              {GOLDEN_RULES.map((r, i) => (
                <div className="ruleItem" key={r.title}>
                  <span className="ruleNum">{i + 1}</span>
                  <div>
                    <strong>{r.title}</strong>
                    <p>{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <SectionHead
              eyebrow="NICHE SCOREBOARD"
              title="Niche স্কোরবোর্ড"
              sub="King of the Pond নিশ খুঁজে নিন — ocean এড়িয়ে যান"
              action={
                <button className="btn ghost" onClick={() => goto('niches')}>
                  সব দেখুন <ArrowRight size={14} />
                </button>
              }
            />
            {scoredNiches.length === 0 ? (
              <EmptyState
                icon={<Waves size={26} />}
                title="এখনো কোনো niche যোগ করা হয়নি"
                detail="Niche Research ট্যাবে গিয়ে ৫০০-এর নিচে প্রতিযোগিতা + ভালো BSR-এর নিশ যোগ করুন।"
                action={
                  <button className="btn accent" onClick={() => goto('niches')}>
                    <Plus size={14} /> Niche যোগ করুন
                  </button>
                }
              />
            ) : (
              <div className="scoreList">
                {scoredNiches.map(({ niche, score }) => (
                  <button className="scoreRow" key={niche.id} onClick={() => goto('niches')}>
                    <div className="scoreTotal">
                      <strong style={{ color: score.verdict === 'pond' ? 'var(--green)' : score.verdict === 'potential' ? 'var(--amber)' : 'var(--red)' }}>{score.total}</strong>
                      <span>/100</span>
                    </div>
                    <div className="scoreInfo">
                      <div className="scoreTitle">
                        <strong>{niche.name}</strong>
                        {niche.status === 'active' && <Chip tone="green">Active</Chip>}
                      </div>
                      <span className="scoreHeadline">{score.headline}</span>
                    </div>
                    {score.verdict === 'pond' ? <Crown size={18} color="var(--green)" /> : score.verdict === 'ocean' ? <Waves size={18} color="var(--red)" /> : <AlertTriangle size={18} color="var(--amber)" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dashSide">
          <div className="card">
            <SectionHead eyebrow="PIPELINE" title="প্রোডাক্ট ফানেল" />
            <div className="funnel">
              {PRODUCT_STATUSES.map((st) => (
                <div className="funnelRow" key={st.key}>
                  <span className="funnelLabel">{st.label}</span>
                  <ProgressBar value={statusCounts[st.key] || 0} max={Math.max(1, state.products.length)} height={8} />
                  <b>{fmtNum(statusCounts[st.key] || 0)}</b>
                </div>
              ))}
            </div>
            <button className="btn ghost full" onClick={() => goto('pipeline')}>
              <ListChecks size={14} /> Pipeline খুলুন
            </button>
          </div>

          {activeNiche && (
            <div className="card focusCard">
              <span className="eyebrow">এখন ফোকাস করুন</span>
              <h3>{activeNiche.name}</h3>
              <p>এই নিশে {state.products.filter((p) => p.nicheId === activeNiche.id).length}টা প্রোডাক্ট প্ল্যান করা আছে — ভিডিওর মতো dominate করতে {fmtNum(state.settings.productsPerNiche)}টা ইউনিক প্রোডাক্ট লাগবে।</p>
              {bestNiche && bestNiche.niche.id !== activeNiche.id && bestNiche.score.verdict === 'pond' && (
                <p className="hint">
                  💡 <b>{bestNiche.niche.name}</b> স্কোরে এগিয়ে আছে ({bestNiche.score.total}/100) — রিসার্চ শেষ হলে এটাও ট্রাই করুন।
                </p>
              )}
            </div>
          )}

          <div className="card">
            <SectionHead eyebrow="SALES LOG" title="সাম্প্রতিক সেল" />
            {recentSales.length === 0 ? (
              <p className="muted">এখনো সেল লগ করা হয়নি — প্রথম সেল এলেই উপরে যোগ করুন! 🚀</p>
            ) : (
              <div className="salesList">
                {recentSales.map((s) => (
                  <div className="saleRow" key={s.id}>
                    <div className="saleIcon">
                      <Wallet size={14} />
                    </div>
                    <div>
                      <strong>
                        {s.units} × ${s.profitUSD / Math.max(1, s.units)} → {fmtBDT(s.profitUSD * state.settings.usdRate)}
                      </strong>
                      <small>{fmtDate(s.date)}{s.note ? ` · ${s.note}` : ''}</small>
                    </div>
                    <button className="iconBtn" onClick={() => actions.removeSale(s.id)} aria-label="মুছুন">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="muted small">
              টার্গেট ${goalUSD.toFixed(0)} ≈ {fmtBDT(state.settings.monthlyGoalBDT)} · ডলার রেট ৳{state.settings.usdRate} (Settings-এ বদলান)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
