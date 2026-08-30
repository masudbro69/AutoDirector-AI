/**
 * YouTube video analysis — no API key required.
 *
 * কীভাবে কাজ করে:
 *  1. URL থেকে videoId বের করা হয় (watch, youtu.be, shorts, embed সব ফরম্যাট)।
 *  2. Watch page fetch করে ytInitialPlayerResponse থেকে caption track আর
 *     videoDetails বের করা হয়; ব্যর্থ হলে innertube player API fallback।
 *  3. Caption track (fmt=json3) ডাউনলোড করে transcript বানানো হয়।
 *  4. Ollama দিয়ে structure/style analysis + একই স্টাইলের মৌলিক (original)
 *     production plan তৈরি হয় — কপি না করে।
 */

import { config, ollamaJSON } from './providers.js';

export interface TranscriptSegment {
  start: number;
  text: string;
}

export interface YouTubeData {
  videoId: string;
  url: string;
  title: string;
  author: string;
  lengthSeconds: number;
  captionLanguage: string;
  transcriptSource: 'captions' | 'manual';
  transcript: string;
  segments: TranscriptSegment[];
}

export interface ScenePlan {
  title: string;
  narration: string;
  visual_prompt: string;
  mood: string;
}

export interface YouTubeAnalysis {
  source: {
    title: string;
    author: string;
    language: string;
    topic: string;
    target_audience: string;
    style: string;
    tone: string;
    structure: { section: string; summary: string }[];
    key_points: string[];
    cta: string;
  };
  production: {
    title: string;
    angle: string;
    summary: string;
    why_this_works: string;
    scenes: ScenePlan[];
  };
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export function parseVideoId(input: string): string | null {
  const s = (input || '').trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v');
      if (v) return v;
      const m = u.pathname.match(/\/(shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/);
      if (m) return m[2];
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

/** Balanced-brace JSON extractor — ytInitialPlayerResponse = {...}; থেকে নিরাপদে বের করার জন্য */
function extractJsonAfter(body: string, marker: string): any | null {
  const idx = body.indexOf(marker);
  if (idx === -1) return null;
  const start = body.indexOf('{', idx);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(body.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function fetchPlayerResponse(videoId: string): Promise<any | null> {
  // 1) Watch page
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en&bpctr=9999999999&has_verified=1`, {
      headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const body = await res.text();
      const player = extractJsonAfter(body, 'ytInitialPlayerResponse');
      if (player?.captions || player?.videoDetails) return player;
    }
  } catch {
    /* try fallback */
  }

  // 2) Innertube player API (public ANDROID client)
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11)' },
      body: JSON.stringify({
        videoId,
        context: { client: { clientName: 'ANDROID', clientVersion: '19.09.37', androidSdkVersion: 30, hl: 'en' } },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const player = await res.json();
      if (player?.captions || player?.videoDetails) return player;
    }
  } catch {
    /* both failed */
  }
  return null;
}

export async function fetchYouTubeData(videoId: string): Promise<YouTubeData> {
  const player = await fetchPlayerResponse(videoId);
  if (!player) throw new Error('YouTube data আনা গেল না — নেটওয়ার্ক চেক করুন বা transcript manually পেস্ট করুন');

  const details = player.videoDetails || {};
  const tracks: any[] = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

  let best: any = null;
  if (tracks.length > 0) {
    // prefer non-auto-generated track, then Bengali/English, then first
    best =
      tracks.find((t) => t.kind !== 'asr' && t.languageCode?.startsWith('bn')) ||
      tracks.find((t) => t.kind !== 'asr' && t.languageCode?.startsWith('en')) ||
      tracks.find((t) => t.kind !== 'asr') ||
      tracks.find((t) => t.languageCode?.startsWith('bn')) ||
      tracks.find((t) => t.languageCode?.startsWith('en')) ||
      tracks[0];
  }

  let transcript = '';
  const segments: TranscriptSegment[] = [];
  if (best?.baseUrl) {
    try {
      const url = best.baseUrl + (best.baseUrl.includes('fmt=') ? '' : '&fmt=json3');
      const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20_000) });
      if (res.ok) {
        const data = await res.json();
        for (const ev of data.events || []) {
          const text = (ev.segs || []).map((s: any) => s.utf8).join('').replace(/\n+/g, ' ').trim();
          if (text) segments.push({ start: ev.tStartMs ? ev.tStartMs / 1000 : 0, text });
        }
        transcript = segments.map((s) => s.text).join(' ').replace(/\s+/g, ' ').trim();
      }
    } catch {
      /* captions fetch failed */
    }
  }

  if (!transcript) {
    throw new Error('এই ভিডিওতে captions পাওয়া যায়নি — transcript manually পেস্ট করার অপশন ব্যবহার করুন');
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: details.title || 'Unknown title',
    author: details.author || 'Unknown channel',
    lengthSeconds: Number(details.lengthSeconds || 0),
    captionLanguage: best?.languageCode?.split('.')[0] || 'en',
    transcriptSource: 'captions',
    transcript,
    segments,
  };
}

const ANALYSIS_PROMPT = (data: YouTubeData, outLanguage: string, durationMin: number, style: string) => `You are an expert video strategist and script writer. A creator wants a NEW original video inspired by the structure and teaching style of an existing YouTube video (its auto-generated transcript is below).

SOURCE VIDEO
Title: ${data.title}
Channel: ${data.author}
Language: ${data.captionLanguage}
Transcript (may be partial, auto-generated):
"""
${data.transcript.slice(0, 9000)}
"""

TASK — return STRICT JSON with two parts:

1) "source": analyze the existing video:
{title, author, language, topic, target_audience, style, tone, structure:[{section, summary}] (hook, main sections, CTA — in order), key_points:[6-10 concise points], cta}

2) "production": design an ORIGINAL video in the SAME style/structure but with fresh wording — about the same topic or a closely related angle that would work for the same audience. Output language: ${outLanguage}. Target duration: ${durationMin} minutes. Style: ${style}.
{title, angle, summary, why_this_works, scenes:[{title, narration, visual_prompt, mood}]}

Rules:
- 6-12 scenes, strong hook in scene 1, clear payoff at the end.
- narration: natural spoken sentences for one scene, written in ${outLanguage}.
- visual_prompt: cinematic, production-ready image prompt in English (documentary style).
- NEVER copy sentences from the transcript — the production must be 100% original content.
- Keep key_points/summaries informative and specific to the topic.`;

export async function analyzeYouTube(opts: {
  url: string;
  transcript?: string;
  language?: string;
  duration?: number;
  style?: string;
}): Promise<{ data: YouTubeData; analysis: YouTubeAnalysis | null }> {
  const videoId = parseVideoId(opts.url);
  if (!videoId) throw new Error('সঠিক YouTube URL দিন — যেমন https://youtu.be/VIDEO_ID');

  let data: YouTubeData;
  if (opts.transcript && opts.transcript.trim().length > 100) {
    data = {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: 'Manually provided transcript',
      author: '—',
      lengthSeconds: 0,
      captionLanguage: 'unknown',
      transcriptSource: 'manual',
      transcript: opts.transcript.trim(),
      segments: [],
    };
  } else {
    data = await fetchYouTubeData(videoId);
  }

  const outLanguage = opts.language || 'English';
  const duration = opts.duration || 3;
  const style = opts.style || 'Documentary';

  let analysis: YouTubeAnalysis | null = null;
  try {
    analysis = await ollamaJSON(ANALYSIS_PROMPT(data, outLanguage, duration, style), { num_ctx: 8192 });
    if (analysis && !Array.isArray(analysis.production?.scenes)) analysis = null;
  } catch {
    // Ollama অফলাইন হলে transcript + metadata রিটার্ন করব — production পরে pipeline বানাবে
    analysis = null;
  }

  return { data, analysis };
}

export function truncateTranscript(data: YouTubeData, max = 1200): string {
  return data.transcript.length > max ? data.transcript.slice(0, max) + '…' : data.transcript;
}

export { config };
