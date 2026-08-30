import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppState, Competitor, Niche, NicheMetrics, Product, SaleLog, Settings } from './types';
import { PRODUCT_STATUSES } from './types';
import { currentMonthKey, todayStr, uid } from './utils';

const KEY = 'kdp-command-center-v1';

export const defaultSettings: Settings = {
  creatorName: 'KDP Publisher',
  monthlyGoalBDT: 30000,
  usdRate: 125,
  profitPerBookUSD: 4,
  uploadsPerWeek: 10,
  productsPerNiche: 10,
  dominationTarget: 300,
  planMonths: 6,
  planStart: todayStr(),
};

export const emptyState: AppState = {
  version: 1,
  settings: defaultSettings,
  niches: [],
  competitors: [],
  products: [],
  sales: [],
  manualUploads: {},
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...emptyState,
      ...parsed,
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      manualUploads: parsed.manualUploads || {},
    };
  } catch {
    return emptyState;
  }
}

/** ভিডিওর উদাহরণ ডেটা — ইউনিকর্ন (ocean) বনাম Yoga Anatomy (pond) */
export function demoState(): AppState {
  const now = new Date().toISOString();
  const mk = (id: string): Niche => {
    if (id === 'unicorn')
      return {
        id,
        name: 'Unicorn Coloring Book',
        status: 'paused',
        metrics: { searchResults: 500, topBSR: 2000, avgPriceUSD: 6.99, topReviews: 22000 },
        notes: 'ভিডিওর ocean উদাহরণ — ৫০০ বই, ২২,০০০ রিভিউ, $6.99 প্রাইস। এখানে ঢোকা মানেই সেল পাওয়া impossible।',
        createdAt: now,
      };
    if (id === 'yoga')
      return {
        id,
        name: 'Yoga Anatomy Coloring Book',
        status: 'active',
        metrics: { searchResults: 200, topBSR: 9000, avgPriceUSD: 18, topReviews: 150 },
        notes: 'ভিডিওর pond উদাহরণ — মাত্র ~২০০ প্রোডাক্ট, BSR ৯,০০০ ও ৮৭,০০০, $18 প্রাইস। বর্তমান active নিশ।',
        createdAt: now,
      };
    return {
      id,
      name: 'Dance Anatomy Coloring Book',
      status: 'researching',
      metrics: { searchResults: 250, topBSR: 15000, avgPriceUSD: 24.99, topReviews: 90 },
      notes: 'ভিডিওতে দেখানো আরেকটা সুন্দর হাই-টিকেট নিশ — $31 পর্যন্ত প্রাইস। রিসার্চ চলছে।',
      createdAt: now,
    };
  };

  const competitors: Competitor[] = [
    { id: uid(), nicheId: 'yoga', name: 'Anatomy of Yoga — Premium Edition', priceUSD: 18.99, bsr: 9000, reviews: 150, notes: 'প্রেজেন্টেশন খুব পরিষ্কার, premium interior, A+ content-এ ইলাস্ট্রেটেড প্রিভিউ আছে।', createdAt: now },
    { id: uid(), nicheId: 'yoga', name: 'Yoga Poses Anatomy Workbook', priceUSD: 17.49, bsr: 87000, reviews: 42, notes: 'সেকেন্ড প্লেয়ার — interior weak, এখানেই আমরা এগিয়ে যেতে পারি।', createdAt: now },
    { id: uid(), nicheId: 'unicorn', name: 'Magical Unicorn Coloring (Top Seller)', priceUSD: 6.99, bsr: 2000, reviews: 22000, notes: '২২,০০০ রিভিউ — এই মার্কেটে নতুন কারো জায়গা নেই।', createdAt: now },
  ];

  const products: Product[] = [
    { id: uid(), nicheId: 'yoga', title: 'Yoga Anatomy Coloring Book — Illustrated Asanas', subtitle: '50 Unique Muscle-Mapped Poses', keywords: 'yoga anatomy coloring book, muscle illustration, asana guide', status: 'live', unique: { uniqueTitle: true, uniqueSubtitle: true, newKeywords: true, newInterior: true, newDesign: true }, uploadedAt: todayStr(), createdAt: now },
    { id: uid(), nicheId: 'yoga', title: 'Functional Yoga Anatomy for Beginners', subtitle: 'A Guided Movement & Coloring Journey', keywords: 'functional yoga, beginner anatomy, movement guide', status: 'upload', unique: { uniqueTitle: true, uniqueSubtitle: true, newKeywords: true, newInterior: true, newDesign: true }, createdAt: now },
    { id: uid(), nicheId: 'yoga', title: 'The Deep Stretch Anatomy Workbook', subtitle: 'Sciatica-Free Hips & Hamstrings', keywords: 'stretching anatomy, hip mobility, sciatica relief', status: 'listing', unique: { uniqueTitle: true, uniqueSubtitle: true, newKeywords: true, newInterior: false, newDesign: true }, createdAt: now },
    { id: uid(), nicheId: 'yoga', title: 'Chakra & Anatomy Dual Coloring', subtitle: 'Energy Meets Science — 40 Plates', keywords: 'chakra coloring, energy anatomy, holistic health', status: 'design', unique: { uniqueTitle: true, uniqueSubtitle: true, newKeywords: true, newInterior: false, newDesign: false }, createdAt: now },
    { id: uid(), nicheId: 'yoga', title: 'Prenatal Yoga Anatomy Guide', subtitle: 'Safe Trimester-Based Poses', keywords: 'prenatal yoga, pregnancy anatomy, safe poses', status: 'research', unique: { uniqueTitle: true, uniqueSubtitle: false, newKeywords: false, newInterior: false, newDesign: false }, createdAt: now },
  ];

  const sales: SaleLog[] = [
    { id: uid(), date: todayStr(), units: 2, profitUSD: 8, note: 'Yoga Anatomy #1' },
  ];

  return { ...emptyState, niches: [mk('unicorn'), mk('yoga'), mk('dance')], competitors, products, sales, manualUploads: {} };
}

export interface DerivedStats {
  liveProducts: number;
  thisMonthUploads: number;
  thisWeekUploads: number;
  monthEarningsBDT: number;
  monthUnits: number;
  salesNeededPerMonth: number;
  salesNeededPerDay: number;
  goalProgressPct: number;
  weekStreak: number;
  uploadCountByDate: (date: string) => number;
}

export function useKdpStore() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full — চুপচাপ এগিয়ে যাই */
    }
  }, [state]);

  const actions = useMemo(
    () => ({
      updateSettings(patch: Partial<Settings>) {
        setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
      },
      addNiche(name: string, metrics: NicheMetrics, notes: string) {
        const niche: Niche = { id: uid(), name: name.trim(), status: 'researching', metrics, notes, createdAt: new Date().toISOString() };
        setState((s) => ({ ...s, niches: [...s.niches, niche] }));
        return niche.id;
      },
      updateNiche(id: string, patch: Partial<Niche>) {
        setState((s) => ({ ...s, niches: s.niches.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
      },
      removeNiche(id: string) {
        setState((s) => ({
          ...s,
          niches: s.niches.filter((n) => n.id !== id),
          competitors: s.competitors.filter((c) => c.nicheId !== id),
          products: s.products.filter((p) => p.nicheId !== id),
        }));
      },
      addCompetitor(c: Omit<Competitor, 'id' | 'createdAt'>) {
        setState((s) => ({ ...s, competitors: [...s.competitors, { ...c, id: uid(), createdAt: new Date().toISOString() }] }));
      },
      updateCompetitor(id: string, patch: Partial<Competitor>) {
        setState((s) => ({ ...s, competitors: s.competitors.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      },
      removeCompetitor(id: string) {
        setState((s) => ({ ...s, competitors: s.competitors.filter((c) => c.id !== id) }));
      },
      addProduct(p: Omit<Product, 'id' | 'createdAt' | 'uploadedAt'>) {
        setState((s) => ({ ...s, products: [...s.products, { ...p, id: uid(), createdAt: new Date().toISOString() }] }));
      },
      updateProduct(id: string, patch: Partial<Product>) {
        setState((s) => ({
          ...s,
          products: s.products.map((p) => {
            if (p.id !== id) return p;
            const next = { ...p, ...patch };
            if ((patch.status === 'upload' || patch.status === 'live') && !next.uploadedAt) next.uploadedAt = todayStr();
            return next;
          }),
        }));
      },
      removeProduct(id: string) {
        setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
      },
      logSale(units: number, profitUSD: number, note?: string) {
        setState((s) => ({ ...s, sales: [...s.sales, { id: uid(), date: todayStr(), units, profitUSD, note }] }));
      },
      removeSale(id: string) {
        setState((s) => ({ ...s, sales: s.sales.filter((x) => x.id !== id) }));
      },
      logManualUploads(count: number) {
        setState((s) => {
          const d = todayStr();
          return { ...s, manualUploads: { ...s.manualUploads, [d]: (s.manualUploads[d] || 0) + count } };
        });
      },
      importState(next: AppState) {
        setState({
          ...emptyState,
          ...next,
          settings: { ...defaultSettings, ...(next.settings || {}) },
          manualUploads: next.manualUploads || {},
        });
      },
      loadDemo() {
        setState(demoState());
      },
      reset() {
        setState({ ...emptyState, settings: { ...defaultSettings, planStart: todayStr() } });
      },
    }),
    [],
  );

  /** Derived stats — useMemo দিয়ে calculate */
  const stats: DerivedStats = useMemo(() => {
    const month = currentMonthKey();
    const liveProducts = state.products.filter((p) => p.status === 'live').length;

    const uploadCountByDate = (date: string) =>
      state.products.filter((p) => p.uploadedAt?.slice(0, 10) === date).length + (state.manualUploads[date] || 0);

    const thisMonthUploads = state.products.filter((p) => p.uploadedAt?.startsWith(month)).length +
      Object.entries(state.manualUploads).filter(([d]) => d.startsWith(month)).reduce((sum, [, c]) => sum + c, 0);

    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    const thisWeekUploads = weekDates.reduce((sum, d) => sum + uploadCountByDate(d), 0);

    const monthSales = state.sales.filter((s) => s.date.startsWith(month));
    const monthEarningsBDT = monthSales.reduce((sum, s) => sum + s.profitUSD * state.settings.usdRate, 0);
    const monthUnits = monthSales.reduce((sum, s) => sum + s.units, 0);

    const goalUSD = state.settings.monthlyGoalBDT / Math.max(1, state.settings.usdRate);
    const salesNeededPerMonth = Math.ceil(goalUSD / Math.max(0.5, state.settings.profitPerBookUSD));
    const salesNeededPerDay = Math.ceil(salesNeededPerMonth / 30);

    // Week streak — টানা কত সপ্তাহ ধরে weekly target পূরণ হয়েছে (current week-সহ)
    let weekStreak = 0;
    const cursor = new Date(monday);
    for (let w = 0; w < 104; w++) {
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(cursor);
        d.setDate(cursor.getDate() + i);
        dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }
      const uploads = dates.reduce((sum, d) => sum + uploadCountByDate(d), 0);
      if (uploads >= state.settings.uploadsPerWeek) weekStreak++;
      else if (w > 0) break; // current week আরেকটু সময় পেতে পারে
      cursor.setDate(cursor.getDate() - 7);
    }

    return {
      liveProducts,
      thisMonthUploads,
      thisWeekUploads,
      monthEarningsBDT,
      monthUnits,
      salesNeededPerMonth,
      salesNeededPerDay,
      goalProgressPct: Math.min(100, (monthEarningsBDT / Math.max(1, state.settings.monthlyGoalBDT)) * 100),
      weekStreak,
      uploadCountByDate,
    };
  }, [state]);

  const nicheNames = useCallback((id: string) => state.niches.find((n) => n.id === id)?.name || '—', [state.niches]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const st of PRODUCT_STATUSES) counts[st.key] = 0;
    for (const p of state.products) counts[p.status] = (counts[p.status] || 0) + 1;
    return counts;
  }, [state.products]);

  return { state, actions, stats, nicheNames, statusCounts };
}

export type Store = ReturnType<typeof useKdpStore>;
