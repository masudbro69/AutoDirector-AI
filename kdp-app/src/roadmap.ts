import type { Settings } from './types';
import { addDays, parseDate, toDateStr } from './utils';

export interface Phase {
  kind: 'learn' | 'dominate' | 'scale';
  title: string;
  startWeek: number;
  weeks: number;
  items: string[];
}

/**
 * ৬ মাসের Roadmap জেনারেটর — ভিডিওর প্ল্যান অনুযায়ী:
 * প্রথমে ২ সপ্তাহ শেখা + premium research, তারপর একে একে নিশ dominate করা,
 * শেষে Amazon Ads দিয়ে scale।
 */
export function buildRoadmap(settings: Settings): Phase[] {
  const phases: Phase[] = [];
  let week = 1;

  phases.push({
    kind: 'learn',
    title: 'Phase 0 — Learn Deeply & Premium Research',
    startWeek: week,
    weeks: 2,
    items: [
      'Complete product making শিখুন — ম্যানুয়াল স্কিল + AI ইন্টিগ্রেশন',
      'Premium research: ৫০০-এর নিচে প্রতিযোগিতা + high-ticket নিশ খুঁজুন',
      'Competitor deep analysis — price, interior, presentation, A+ content',
      'Niche Research ট্যাবে স্কোর চেক করে ১টা pond নিশ lock করুন',
    ],
  });
  week += 2;

  const totalWeeks = settings.planMonths * 4;
  let produced = 0;
  let nicheIdx = 1;

  while (produced < settings.dominationTarget && week <= totalWeeks + 2) {
    const count = Math.min(settings.productsPerNiche, settings.dominationTarget - produced);
    const weeks = Math.max(1, Math.ceil(count / settings.uploadsPerWeek));
    phases.push({
      kind: 'dominate',
      title: `Niche #${nicheIdx} — Dominate (${count}টা প্রোডাক্ট)`,
      startWeek: week,
      weeks,
      items: [
        `${count}টা ইউনিক প্রোডাক্ট — প্রতিটার নতুন টাইটেল, সাবটাইটেল, কিওয়ার্ড, ইন্টেরিয়র`,
        `সপ্তাহে ${settings.uploadsPerWeek}টা আপলোড (মোট ${weeks} সপ্তাহ)`,
        'কপি-পেস্ট কখনো না — নিজের একাউন্ট আর মার্কেট দুটোই নষ্ট হয়',
        'দরকার লাগলে গ্রুপে পোস্ট করে লিস্টিং রিভিউ নিন',
      ],
    });
    produced += count;
    week += weeks;
    nicheIdx++;
  }

  phases.push({
    kind: 'scale',
    title: 'Scale — Amazon Ads (ভিডিওর Part 2)',
    startWeek: week,
    weeks: 2,
    items: [
      '৩০,০০০৳+ স্টেবল হলে Amazon Ads দিয়ে ট্রাফিক বাড়ান',
      'Winner প্রোডাক্টে ad budget দিন, loser বন্ধ করুন',
      'লক্ষ্য: ৩০,০০০ → ১,০০,০০০৳+ (scale roadmap)',
    ],
  });

  return phases;
}

/** প্ল্যান শুরু থেকে আজ পর্যন্ত কত সপ্তাহ গেছে */
export function elapsedWeeks(planStart: string): number {
  const start = parseDate(planStart);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return Math.max(0, Math.floor(diffDays / 7) + 1);
}

export function weekDateRange(planStart: string, weekNumber: number): string {
  const start = parseDate(planStart);
  const from = addDays(start, (weekNumber - 1) * 7);
  const to = addDays(from, 6);
  return `${toDateStr(from) === toDateStr(to) ? toDateStr(from) : `${toDateStr(from)} → ${toDateStr(to)}`}`;
}
