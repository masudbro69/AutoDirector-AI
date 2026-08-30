import type { NicheMetrics } from './types';
import { fmtNum } from './utils';

/**
 * Niche Scoring Engine — ভিডিওর নিয়ম থেকে নেওয়া:
 *
 * 1. "Don't Enter the Ocean" — স্যাচুরেটেড নিশ (ইউনিকর্ন কালারিং, মারমেইড, টি-রেক্স)
 *    এড়িয়ে চলুন: ৫০০+ প্রতিযোগী আর ২২,০০০ রিভিউ = সমুদ্র, সেখানে ঢুকলে সেল পাওয়া
 *    "শূন্যের থেকেও কম"।
 * 2. "Become King of the Pond" — ছোট পুকুরের বড় মাছ হন: ৫০০-এর নিচে প্রতিযোগিতা,
 *    কিন্তু ভালো সেল হওয়া (Yoga Anatomy: ~২০০ প্রোডাক্ট, BSR ৯,০০০)।
 * 3. High-ticket — $১৮–৩১ প্রাইসের নিশ, $৪-এর নিচে প্রফিটে কাজ করে না।
 */

export type Verdict = 'pond' | 'potential' | 'ocean';

export interface ScoreItem {
  key: string;
  label: string;
  score: number;
  max: number;
  note: string;
}

export interface NicheScore {
  total: number;
  verdict: Verdict;
  headline: string;
  summary: string;
  breakdown: ScoreItem[];
  advice: string[];
}

function competitionScore(n: number): ScoreItem {
  if (n <= 200) return { key: 'competition', label: 'Competition (প্রতিযোগিতা)', score: 30, max: 30, note: `${fmtNum(n)} প্রোডাক্ট — খুবই কম, perfect pond 🎯` };
  if (n <= 500) return { key: 'competition', label: 'Competition (প্রতিযোগিতা)', score: 24, max: 30, note: `${fmtNum(n)} প্রোডাক্ট — ভিডিওর rule মাফিক ৫০০-এর নিচে ✅` };
  if (n <= 1000) return { key: 'competition', label: 'Competition (প্রতিযোগিতা)', score: 12, max: 30, note: `${fmtNum(n)} প্রোডাক্ট — মাঝারি ভিড়, সাবধানে ঢুকুন` };
  if (n <= 3000) return { key: 'competition', label: 'Competition (প্রতিযোগিতা)', score: 4, max: 30, note: `${fmtNum(n)} প্রোডাক্ট — ভীড় বেশি` };
  return { key: 'competition', label: 'Competition (প্রতিযোগিতা)', score: 0, max: 30, note: `${fmtNum(n)} প্রোডাক্ট — সমুদ্রের দিকে যাচ্ছে 🌊` };
}

function demandScore(bsr: number): ScoreItem {
  if (bsr <= 10000) return { key: 'demand', label: 'Demand (BSR)', score: 30, max: 30, note: `BSR ${fmtNum(bsr)} — দারুণ সেল হচ্ছে 🔥` };
  if (bsr <= 30000) return { key: 'demand', label: 'Demand (BSR)', score: 24, max: 30, note: `BSR ${fmtNum(bsr)} — ভালো demand` };
  if (bsr <= 60000) return { key: 'demand', label: 'Demand (BSR)', score: 18, max: 30, note: `BSR ${fmtNum(bsr)} — মোটামুটি demand` };
  if (bsr <= 100000) return { key: 'demand', label: 'Demand (BSR)', score: 11, max: 30, note: `BSR ${fmtNum(bsr)} — demand দুর্বলের দিকে` };
  return { key: 'demand', label: 'Demand (BSR)', score: 3, max: 30, note: `BSR ${fmtNum(bsr)} — demand খুবই কম` };
}

function priceScore(p: number): ScoreItem {
  if (p >= 25) return { key: 'price', label: 'Price (High-Ticket)', score: 25, max: 25, note: `$${p} — premium high-ticket 👑` };
  if (p >= 18) return { key: 'price', label: 'Price (High-Ticket)', score: 22, max: 25, note: `$${p} — high-ticket, ভিডিওর উদাহরণের মতো ($18+)` };
  if (p >= 12) return { key: 'price', label: 'Price (High-Ticket)', score: 16, max: 25, note: `$${p} — $4+ প্রফিট সম্ভব` };
  if (p >= 8) return { key: 'price', label: 'Price (High-Ticket)', score: 8, max: 25, note: `$${p} — প্রফিট মার্জিন কম` };
  return { key: 'price', label: 'Price (High-Ticket)', score: 2, max: 25, note: `$${p} — $4 প্রফিটই হবে না, ভিডিওতে স্পষ্ট বলা আছে ❌` };
}

function reviewBarrierScore(r: number): ScoreItem {
  if (r < 100) return { key: 'reviews', label: 'Review Barrier', score: 15, max: 15, note: `${fmtNum(r)} রিভিউ — কেউ dominate করেনি, সুযোগ আছে!` };
  if (r < 300) return { key: 'reviews', label: 'Review Barrier', score: 12, max: 15, note: `${fmtNum(r)} রিভিউ — জায়গা আছে` };
  if (r < 1000) return { key: 'reviews', label: 'Review Barrier', score: 8, max: 15, note: `${fmtNum(r)} রিভিউ — কিছু বড় প্লেয়ার আছে` };
  if (r < 5000) return { key: 'reviews', label: 'Review Barrier', score: 3, max: 15, note: `${fmtNum(r)} রিভিউ — শক্তিশালী প্রতিযোগী` };
  return { key: 'reviews', label: 'Review Barrier', score: 0, max: 15, note: `${fmtNum(r)} রিভিউ — সমুদ্র! (ভিডিওর ইউনিকর্ন উদাহরণ: ২২,০০০ রিভিউ) 🌊` };
}

export function scoreNiche(m: NicheMetrics): NicheScore {
  const breakdown = [competitionScore(m.searchResults), demandScore(m.topBSR), priceScore(m.avgPriceUSD), reviewBarrierScore(m.topReviews)];
  let total = breakdown.reduce((sum, b) => sum + b.score, 0);

  // Hard rules — ভিডিওর স্পষ্ট নির্দেশনা
  const hardBlocks: string[] = [];
  if (m.topReviews >= 5000) hardBlocks.push('সবচেয়ে বড় প্রতিযোগীর রিভিউ ৫,০০০+ — এটা ocean, ঢোকা মানেই সেল পাওয়া প্রায় impossible।');
  if (m.searchResults > 2000) hardBlocks.push('প্রতিযোগী ২,০০০+ — এই ভিড়ে নতুন প্রোডাক্ট কেউ খুঁজে পাবে না।');
  if (m.avgPriceUSD < 6) hardBlocks.push('Average price $৬-এর নিচে — $৪ প্রফিট হওয়া অসম্ভব, ভিডিওতে বলা হয়েছে এটা কাজ করে না।');
  if (hardBlocks.length > 0) total = Math.min(total, 45);

  const verdict: Verdict = total >= 75 ? 'pond' : total >= 50 ? 'potential' : 'ocean';

  const headline =
    verdict === 'pond' ? '👑 King of the Pond' : verdict === 'potential' ? '⚠️ Potential Niche' : '🌊 Ocean — Avoid';
  const summary =
    verdict === 'pond'
      ? `Score ${total}/100 — এই নিশে dominate করুন! প্রতিযোগিতা কম, সেল হচ্ছে, প্রাইসও ভালো। ভিডিওর মতো এখানেই আপনি বড় মাছ হতে পারবেন।`
      : verdict === 'potential'
        ? `Score ${total}/100 — সম্ভাবনা আছে, কিন্তু আরেকটু premium research দরকার। আরও data যোগ করুন বা ভিন্ন sub-niche খুঁজুন।`
        : `Score ${total}/100 — এড়িয়ে যান! এই নিশে ঢুকলে সেল আসবে না, সময় আর এনার্জি নষ্ট হবে।`;

  const advice: string[] = [];
  if (m.searchResults > 500) advice.push('৫০০-এর নিচে sub-niche খুঁজুন — যেমন "Coloring Book" না দিয়ে "Yoga Anatomy Coloring Book"।');
  if (m.avgPriceUSD < 12) advice.push('High-ticket ($১২–৩১) প্রোডাক্ট টার্গেট করুন — কম সেলেও টার্গেট পূরণ হবে।');
  if (m.topBSR > 60000) advice.push('BSR ৬০,০০০-এর নিচে প্রোডাক্ট আছে এমন নিশ খুঁজুন — নাহলে demand-ই নেই।');
  if (m.topReviews >= 1000) advice.push('রিভিউ ব্যারিয়ার বেশি — "All Departments" সার্চ করে কম-রিভিউ প্রতিযোগীর sub-niche বের করুন।');
  if (verdict === 'pond') advice.push('এই নিশে ১০–৩০টা ইউনিক প্রোডাক্ট প্ল্যান করুন — প্রতিটার নতুন টাইটেল, কিওয়ার্ড আর ইন্টেরিয়র।');
  if (advice.length === 0) advice.push('নিশটা ঠিক আছে — এখন প্রতিযোগীদের presentation, interior আর A+ content ডিপলি অ্যানালাইজ করুন।');

  return { total, verdict, headline, summary, breakdown, advice: [...hardBlocks, ...advice] };
}

export const VERDICT_COLORS: Record<Verdict, string> = {
  pond: 'var(--green)',
  potential: 'var(--amber)',
  ocean: 'var(--red)',
};

/** ভিডিওর মূল ৭টি Golden Rule — ড্যাশবোর্ডে দেখানোর জন্য */
export const GOLDEN_RULES: { title: string; detail: string }[] = [
  { title: 'Income Goal ক্যালকুলেট করুন', detail: '৩০,০০০৳ ≈ $240/মাস। $4 প্রফিটে ৬০ সেল = দিনে মাত্র ২ সেল। ৩০,০০০ তো মিনিমাম — unlimited সম্ভব।' },
  { title: "Don't Enter the Ocean", detail: 'ইউনিকর্ন কালারিং, মারমেইড, টি-রেক্স — ৫০০+ প্রতিযোগী, হাজারো রিভিউ। ওখানে নতুনের সেল আসা প্রায় impossible।' },
  { title: 'Become King of the Pond', detail: '৫০০-এর নিচে প্রতিযোগিতা + ভালো সেল + high-ticket প্রাইস ($18–31) — এমন নিশেই বড় মাছ হন।' },
  { title: 'Learn Deeply Before You Scale', detail: 'ম্যানুয়াল স্কিল শিখুন, তার সাথে AI ইন্টিগ্রেট করুন। শুধু AI-নির্ভর হলে quality হবে না।' },
  { title: "Don't Chase, Dominate the Niche", detail: 'আজ ইউনিকর্ন, কাল মারমেইড না — একটা নিশেই ১০–৩০টা (শেষে ১৫০–৩০০টা) ইউনিক প্রোডাক্ট দিন।' },
  { title: 'Competitor-দের Deeply Analyze করুন', detail: 'প্রাইস, প্রেজেন্টেশন, ইন্টেরিয়র, A+ content, রিভিউ — সব মার্ক করে ঢুকুন। ইংরেজি না বুঝলে স্ক্রিনশট AI-কে দেখান।' },
  { title: 'Consistency-ই আসল সিক্রেট', detail: 'সপ্তাহে ৫–১০টা আপলোড, ২ সপ্তাহে ১ নিশ কমপ্লিট, ৬ মাস লেগে থাকুন। দিনে ২ সেল পেলেই টার্গেট পূরণ।' },
];
