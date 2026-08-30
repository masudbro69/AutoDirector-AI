/** KDP Command Center — core data model.
 *  ভিডিওর সিস্টেমটাকে সফটওয়্যারে রূপ দেওয়া হয়েছে:
 *  Income Goal → Niche Research (King of the Pond) → Competitor Analysis
 *  → Product Pipeline (Dominate the Niche) → Consistency Roadmap (৬ মাস)।
 */

export type NicheStatus = 'researching' | 'active' | 'dominated' | 'paused';

export interface NicheMetrics {
  /** Amazon-এ সার্চ দিলে কতটা competing product আসে (ভিডিওর rule: 500-এর নিচে) */
  searchResults: number;
  /** নিশের #1 প্রোডাক্টের Best Seller Rank (কম = ভালো সেল হচ্ছে) */
  topBSR: number;
  /** Top sellers-দের average price (high-ticket = $12+, premium = $18+) */
  avgPriceUSD: number;
  /** সবচেয়ে শক্তিশালী প্রতিযোগীর review সংখ্যা */
  topReviews: number;
}

export interface Niche {
  id: string;
  name: string;
  status: NicheStatus;
  metrics: NicheMetrics;
  notes: string;
  createdAt: string;
}

export interface Competitor {
  id: string;
  nicheId: string;
  name: string;
  priceUSD: number;
  bsr: number;
  reviews: number;
  /** Presentation, interior structure, A+ content — যা ভিডিওতে বলা হয়েছে ডিপলি দেখার জন্য */
  notes: string;
  url?: string;
  createdAt: string;
}

export type ProductStatus = 'research' | 'design' | 'interior' | 'listing' | 'upload' | 'live';

export const PRODUCT_STATUSES: { key: ProductStatus; label: string; hint: string }[] = [
  { key: 'research', label: 'Research', hint: 'নিশ ও কিওয়ার্ড রিসার্চ' },
  { key: 'design', label: 'Design', hint: 'কভার ও ইউনিক ডিজাইন' },
  { key: 'interior', label: 'Interior', hint: 'নতুন interior স্ট্রাকচার' },
  { key: 'listing', label: 'Listing', hint: 'টাইটেল, সাবটাইটেল, কিওয়ার্ড' },
  { key: 'upload', label: 'Upload', hint: 'KDP-তে আপলোড হচ্ছে' },
  { key: 'live', label: 'Live', hint: 'মার্কেটে লাইভ ✅' },
];

/** ভিডিওর anti copy-paste rule: প্রতিটা প্রোডাক্ট অবশ্যই ইউনিক হতে হবে */
export interface UniquenessChecks {
  uniqueTitle: boolean;
  uniqueSubtitle: boolean;
  newKeywords: boolean;
  newInterior: boolean;
  newDesign: boolean;
}

export interface Product {
  id: string;
  nicheId: string;
  title: string;
  subtitle: string;
  keywords: string;
  status: ProductStatus;
  unique: UniquenessChecks;
  /** যেদিন live/upload হয়েছে (consistency tracking-এর জন্য) */
  uploadedAt?: string;
  createdAt: string;
}

export interface SaleLog {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  units: number;
  profitUSD: number;
  note?: string;
}

export interface Settings {
  creatorName: string;
  monthlyGoalBDT: number;
  usdRate: number;
  profitPerBookUSD: number;
  uploadsPerWeek: number;
  productsPerNiche: number;
  dominationTarget: number;
  planMonths: number;
  /** রোডম্যাপ শুরুর তারিখ (YYYY-MM-DD) */
  planStart: string;
}

export interface AppState {
  version: number;
  settings: Settings;
  niches: Niche[];
  competitors: Competitor[];
  products: Product[];
  sales: SaleLog[];
  /** ম্যানুয়াল আপলোড গণনা: date → count (প্রোডাক্ট ছাড়া বাল্ক আপলোডের জন্য) */
  manualUploads: Record<string, number>;
}

export const UNIQUENESS_LABELS: { key: keyof UniquenessChecks; label: string }[] = [
  { key: 'uniqueTitle', label: 'ইউনিক টাইটেল' },
  { key: 'uniqueSubtitle', label: 'ইউনিক সাবটাইটেল' },
  { key: 'newKeywords', label: 'নতুন কিওয়ার্ড এক্সপেরিমেন্ট' },
  { key: 'newInterior', label: 'নতুন ইন্টেরিয়র' },
  { key: 'newDesign', label: 'নতুন ডিজাইন' },
];
