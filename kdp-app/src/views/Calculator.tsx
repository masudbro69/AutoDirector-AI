import { useState } from 'react';
import { Calculator as CalcIcon, Save, Info } from 'lucide-react';
import type { Store } from '../store';
import { Chip, Field, SectionHead } from '../components/ui';
import { fmtBDT, fmtNum } from '../utils';

export default function Calculator({ store }: { store: Store }) {
  const { state, actions, stats } = store;
  const [goal, setGoal] = useState(state.settings.monthlyGoalBDT);
  const [rate, setRate] = useState(state.settings.usdRate);
  const [profit, setProfit] = useState(state.settings.profitPerBookUSD);
  const [saved, setSaved] = useState(false);

  const goalUSD = goal / Math.max(1, rate);
  const salesPerMonth = profit > 0 ? Math.ceil(goalUSD / profit) : 0;
  const salesPerDay = Math.ceil(salesPerMonth / 30);
  const liveProducts = state.products.filter((p) => p.status === 'live').length;
  const perProductMonthly = liveProducts > 0 && salesPerMonth > 0 ? salesPerMonth / liveProducts : 0;
  const soldThisMonth = stats.monthUnits;

  return (
    <div className="view">
      <SectionHead
        eyebrow="STEP 1 — GOAL SETUP"
        title="Income Goal ক্যালকুলেটর"
        sub="ভিডিওর ম্যাথ: ৩০,০০০৳ ÷ ১২৫ = $২৪০ → $৪ প্রফিট × ৬০ সেল = দিনে মাত্র ২টা সেল। সংখ্যা বদলে নিজের প্ল্যান বানান।"
      />

      <div className="calcGrid">
        <div className="card">
          <h3 className="cardTitle">
            <CalcIcon size={16} /> আপনার সংখ্যা
          </h3>
          <div className="calcFields">
            <Field label="মাসিক ইনকাম টার্গেট (৳)" hint="৩০,০০০ হলো ভিডিওর minimum">
              <input type="range" min={10000} max={200000} step={5000} value={goal} onChange={(e) => { setGoal(+e.target.value); setSaved(false); }} />
              <div className="rangeVal">{fmtBDT(goal)}</div>
            </Field>
            <Field label="ডলার রেট (৳/$)" hint="বাংলাদেশের বর্তমান রেট">
              <input type="range" min={100} max={160} step={1} value={rate} onChange={(e) => { setRate(+e.target.value); setSaved(false); }} />
              <div className="rangeVal">৳{rate} = $1</div>
            </Field>
            <Field label="প্রতি বইয়ে প্রফিট ($)" hint="ভিডিওর rule: $৪-এর নিচে প্রফিট কাজ করে না">
              <input type="range" min={1} max={15} step={0.5} value={profit} onChange={(e) => { setProfit(+e.target.value); setSaved(false); }} />
              <div className="rangeVal">${profit.toFixed(2)}</div>
            </Field>
          </div>
          <button
            className="btn accent full"
            onClick={() => {
              actions.updateSettings({ monthlyGoalBDT: goal, usdRate: rate, profitPerBookUSD: profit });
              setSaved(true);
            }}
          >
            <Save size={14} /> {saved ? 'সেভ হয়েছে ✅' : 'সিস্টেমে সেভ করুন'}
          </button>
        </div>

        <div className="card calcResult">
          <h3 className="cardTitle">আপনার প্ল্যান নম্বর</h3>
          <div className="calcBig">
            <div className="calcBigItem">
              <span>মাসের টার্গেট</span>
              <strong>{fmtBDT(goal)}</strong>
              <em>= ${goalUSD.toFixed(0)}</em>
            </div>
            <div className="calcBigItem accent">
              <span>মাসে সেল লাগবে</span>
              <strong>{fmtNum(salesPerMonth)}টা</strong>
              <em>${profit.toFixed(2)} প্রফিট ধরে</em>
            </div>
            <div className="calcBigItem green">
              <span>দিনে মাত্র</span>
              <strong>{salesPerDay}টা সেল</strong>
              <em>এটুকুই টার্গেট পূরণ 🎯</em>
            </div>
          </div>

          <div className="salesDots">
            <span className="dotsLabel">
              এই মাসে দরকার {fmtNum(salesPerMonth)} সেল — এখন পর্যন্ত {fmtNum(soldThisMonth)}টা
            </span>
            <div className="dots">
              {Array.from({ length: Math.min(salesPerMonth, 90) }).map((_, i) => (
                <i key={i} className={i < soldThisMonth ? 'on' : ''} />
              ))}
            </div>
            {salesPerMonth > 90 && <small>…মোট {fmtNum(salesPerMonth)}টা</small>}
          </div>

          <div className="calcNote">
            <Info size={15} />
            <p>
              {liveProducts > 0 ? (
                <>
                  আপনার এখন <b>{liveProducts}টা live প্রোডাক্ট</b> আছে — প্রতি প্রোডাক্ট থেকে মাসে গড়ে <b>{perProductMonthly.toFixed(1)}টা সেল</b> পেলেই টার্গেট পূরণ হয়ে যাবে।
                </>
              ) : (
                <>এখনো কোনো প্রোডাক্ট live নেই — Pipeline ট্যাবে প্রথম প্রোডাক্ট আপলোডের প্ল্যান করুন।</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <SectionHead eyebrow="ভিডিওর ইনসাইট" title="কেন এই ম্যাথটা কাজ করে" />
        <div className="insightGrid">
          <div className="insightItem">
            <Chip tone="green">✅ সহজ সমীকরণ</Chip>
            <p>
              ৩০,০০০৳ ≈ $২৪০। ধরুন প্রতি বইয়ে $৪ প্রফিট — তাহলে মাসে ৬০ সেল, মানে ৩০ দিনে ভাগ করলে <b>দিনে মাত্র ২টা সেল</b>। এই দুইটা সেল যেকোনোভাবে জেনারেট করতে পারলেই টার্গেট পূরণ।
            </p>
          </div>
          <div className="insightItem">
            <Chip tone="amber">📈 High-ticket = কম সেলে বেশি আয়</Chip>
            <p>
              $4 প্রফিটে ৬০ সেল লাগলেও, $18–31 প্রাইসের high-ticket প্রোডাক্টে প্রফিট $8–12 হলে সেল লাগবে মাত্র ২০–৩০টা। তাই নিশ সিলেকশনে প্রাইসটা সবচেয়ে বড় ফ্যাক্টর।
            </p>
          </div>
          <div className="insightItem">
            <Chip tone="blue">💼 চাকরি vs KDP</Chip>
            <p>
              ভিডিওর হিসাবে নতুন অবস্থায় দেশে হাইয়েস্ট স্যালারিও ~২০,০০০৳। মার্কেটপ্লেস থেকে ৩০,০০০৳+ আসা শুরু হলে এখানেই সময় দেওয়া লজিক্যাল — আর এটা <b>minimum</b>, unlimited সম্ভব।
            </p>
          </div>
          <div className="insightItem">
            <Chip tone="red">⚠️ একটাই সাবধানবাণী</Chip>
            <p>
              ৩০,০০০৳ পেতে ৩০টা লো-কোয়ালিটি বই আপলোড করা মানে সময় নষ্ট — কোয়ালিটি + প্রপার রিসার্চ + লং-টার্ম স্ট্র্যাটেজি লাগবেই। সহজে আর্নিং হয় না, আর হলেও তা টেকে না।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
