# KDP Command Center

**Amazon Kindle Domination System** — "Amazon Kindle Business: ০ থেকে মাসে ৩০,০০০+ টাকা" (Shovan Graphics) ভিডিওর সম্পূর্ণ রোডম্যাপকে একটা কার্যকর সফটওয়্যার সিস্টেমে রূপ দেওয়া হয়েছে।

## যা যা আছে (ভিডিওর ৭ ধাপ → ৬টা টুল)

| ভিডিওর ধাপ | অ্যাপে |
|---|---|
| Income Goal Calculation (৩০,০০০৳ = দিনে ২ সেল) | **Income Calculator** — goal/rate/profit স্লাইডার, দরকারি সেলের হিসাব লাইভ |
| Don't Enter the Ocean | **Niche Scoring Engine** — competition, demand (BSR), price, review barrier মিলিয়ে ১০০-এর স্কোর; ocean হলে hard-block সতর্কতা |
| King of the Pond (৫০০-এর নিচে, হাই-টিকেট) | Niche card-এ verdict: 👑 Pond / ⚠️ Potential / 🌊 Ocean + বাংলা advice |
| Learn Deeply Before You Scale | ৭টি Golden Rule ড্যাশবোর্ডে সবসময় চোখের সামনে |
| Don't Chase, Dominate the Niche | **Product Pipeline** — কানবান বোর্ড, প্রতি প্রোডাক্টে ৫-পয়েন্ট uniqueness চেকলিস্ট (anti copy-paste enforcement), domination প্রোগ্রেস (১৫০–৩০০) |
| Deep Competitor Analysis | **Competitors** ট্যাব — price/BSR/reviews/notes ট্র্যাকিং + pricing insight |
| Consistency (সপ্তাহে ৫–১০ আপলোড, ৬ মাস) | **Roadmap** — auto-generated ৬ মাসের phase প্ল্যান, সাপ্তাহিক আপলোড চার্ট, ২৬ সপ্তাহের heatmap, streak |

## Run

```bash
cd kdp-app
npm install
npm run dev     # http://localhost:5174
npm run build   # production build → dist/
```

- **Local-first:** সব ডেটা ব্রাউজারের localStorage-এ থাকে — কোনো সার্ভার/অ্যাকাউন্ট লাগে না।
- Settings → *JSON এক্সপোর্ট* দিয়ে নিয়মিত ব্যাকআপ নিন।
- প্রথমবার খালি থাকলে Niche Research ট্যাবে **"ভিডিওর উদাহরণ লোড করুন"** চাপুন — ইউনিকর্ন (ocean) বনাম Yoga Anatomy (pond) উদাহরণ দেখতে পাবেন।

## Scoring rules (ভিডিও থেকে)

- **Competition ৩০** — ≤২০০ প্রোডাক্ট সেরা; ৫০০-এর নিচে acceptable
- **Demand ৩০** — top BSR ≤১০k সেরা (ভিডিওর Yoga Anatomy উদাহরণ: BSR ৯,০০০)
- **Price ২৫** — $১৮+ high-ticket সেরা; $৬-এর নিচে = $৪ প্রফিট অসম্ভব
- **Review Barrier ১৫** — ৫,০০০+ রিভিউ = ocean (ইউনিকর্নের ২২,০০০ রিভিউ)
- **Hard rules:** top review ≥৫,০০০ বা প্রতিযোগী >২,০০০ বা price <$৬ হলে স্কোর জোর করে কমিয়ে ocean করা হয়

⚠️ ডেমো ডেটা শেখার জন্য; আসল রিসার্চে Amazon-এর লাইভ ডেটা বসান। এটা একটা প্ল্যানিং টুল — আয়ের গ্যারান্টি নয়।
