import path from 'node:path';
import fs from 'node:fs/promises';
import { comfyImage, ffmpeg, ollamaJSON, piper } from './providers.js';
import { get, log, ROOT, update } from './store.js';

const negative = 'blurry, low quality, distorted, text, watermark, logo, duplicate, malformed anatomy';
const cancelled = new Set<string>();

export function cancelPipeline(id: string) {
  cancelled.add(id);
}

async function guard(id: string) {
  if (cancelled.has(id) || (await get(id)).status === 'cancelled') throw new Error('PRODUCTION_CANCELLED');
}

async function stage(id: string, stageName: string, progress: number, message: string) {
  await update(id, { status: 'running', stage: stageName, progress });
  await log(id, message);
}

/** সাধারণ টপিক থেকে প্ল্যান */
function topicPrompt(topic: string, settings: any) {
  return `You are an expert documentary researcher and script writer. Create a fact-conscious video plan about: ${topic}. Target duration ${settings.duration || 3} minutes, language ${settings.language || 'English'}, style ${settings.style || 'Documentary'}. Return strict JSON: {title,summary,sources_note,scenes:[{title,narration,visual_prompt,mood}]}. Use 6-12 scenes, strong hook, natural narration, no unsupported precise claims. Each visual_prompt must be cinematic and production ready.`;
}

/** YouTube সোর্স থেকে মৌলিক প্ল্যান — transcript দেখে, কিন্তু কপি না করে */
function youtubePrompt(topic: string, source: any, settings: any) {
  const excerpt = (source.transcript || '').slice(0, 8000);
  return `You are an expert documentary researcher and script writer. A creator watched this YouTube video: "${source.title || topic}" and wants an ORIGINAL video covering the same subject for the same audience.

Source transcript (auto-generated, for understanding only — NEVER copy sentences from it):
"""
${excerpt}
"""

Create a fact-conscious ORIGINAL video plan about: ${topic}. Target duration ${settings.duration || 3} minutes, language ${settings.language || 'English'}, style ${settings.style || 'Documentary'}. Return strict JSON: {title,summary,sources_note,scenes:[{title,narration,visual_prompt,mood}]}. Use 6-12 scenes, strong hook, natural narration, no unsupported precise claims. Each visual_prompt must be cinematic and production ready. All narration must be your own original writing.`;
}

export async function runPipeline(id: string) {
  cancelled.delete(id);
  try {
    const p = await get(id);
    await guard(id);
    await stage(id, 'Research & strategy', 8, 'Researching topic with local AI');

    // YouTube-সোর্সড প্রজেক্টে transcript সেভ করে রাখি (reference-এর জন্য)
    let plan: any;
    if (p.source?.type === 'youtube') {
      const dir = path.join(ROOT, id);
      if (p.source.transcript) {
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, 'source-transcript.txt'), p.source.transcript, 'utf8');
        await log(id, `YouTube source saved — "${p.source.title || p.source.videoId}"`);
      }
      if (Array.isArray(p.source.analysis?.production?.scenes) && p.source.analysis.production.scenes.length > 0) {
        plan = p.source.analysis.production;
        plan.summary = plan.summary || plan.angle || '';
        await log(id, 'Using the pre-built plan from YouTube analysis');
      } else {
        plan = await ollamaJSON(youtubePrompt(p.topic, p.source, p.settings), { num_ctx: 8192 });
      }
    } else {
      plan = await ollamaJSON(topicPrompt(p.topic, p.settings));
    }

    const scenes = (plan.scenes || []).map((s: any, i: number) => ({ ...s, id: `scene-${i + 1}`, status: 'waiting' }));
    await update(id, { scenes });
    await stage(id, 'Script', 22, `Script complete — ${scenes.length} scenes`);

    const dir = path.join(ROOT, id);
    const ratio = p.settings.aspectRatio === '9:16' ? [768, 1344] : [1344, 768];

    for (let i = 0; i < scenes.length; i++) {
      await guard(id);
      await stage(id, 'Images', 25 + Math.round((i / scenes.length) * 35), `Generating visual ${i + 1} of ${scenes.length}`);
      const image = await comfyImage(
        `${scenes[i].visual_prompt}, cinematic documentary, professional color grading, highly detailed, ${ratio[0]}x${ratio[1]}`,
        negative,
        ratio[0],
        ratio[1],
        path.join(dir, 'images')
      );
      scenes[i].image = image;
      scenes[i].status = 'image-ready';
      await update(id, { scenes });
    }

    await guard(id);
    await stage(id, 'Voice', 63, 'Generating local neural voiceover');
    for (let i = 0; i < scenes.length; i++) {
      await guard(id);
      const wav = path.join(dir, 'audio', `scene-${i+1}.wav`);
      await piper(scenes[i].narration, wav);
      scenes[i].audio = wav;
    }

    await stage(id, 'Editing', 77, 'Building professional timeline');
    await fs.mkdir(path.join(dir, 'clips'), { recursive: true });
    const clips = [] as string[];
    for (let i = 0; i < scenes.length; i++) {
      await guard(id);
      const clip = path.join(dir, 'clips', `scene-${i+1}.mp4`);
      await ffmpeg([
        '-loop', '1', '-i', scenes[i].image, '-i', scenes[i].audio,
        '-vf', `scale=${ratio[0]}:${ratio[1]}:force_original_aspect_ratio=increase,crop=${ratio[0]}:${ratio[1]},zoompan=z='min(zoom+0.0005,1.08)':d=9999:s=${ratio[0]}x${ratio[1]},fps=30,format=yuv420p`,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', '-shortest', clip,
      ]);
      clips.push(clip);
    }

    const concat = path.join(dir, 'clips', 'concat.txt');
    await fs.writeFile(concat, clips.map((c) => `file '${path.resolve(c).replaceAll("'", "'\\''")}'`).join('\n'));

    await stage(id, 'Rendering', 91, 'Rendering final MP4');
    const output = path.join(dir, 'exports', 'final.mp4');
    await fs.mkdir(path.dirname(output), { recursive: true });
    await ffmpeg(['-f', 'concat', '-safe', '0', '-i', concat, '-c', 'copy', '-movflags', '+faststart', output]);

    await update(id, { status: 'complete', progress: 100, stage: 'Ready', export: output, scenes });
    await log(id, 'Production complete — final video is ready');
  } catch (e: any) {
    if (e.message === 'PRODUCTION_CANCELLED') {
      await update(id, { status: 'cancelled', stage: 'Cancelled' });
      await log(id, 'Production cancelled by user', 'warning');
    } else {
      await update(id, { status: 'failed', error: e.message, stage: 'Needs attention' });
      await log(id, e.message, 'error');
    }
    cancelled.delete(id);
  }
}
