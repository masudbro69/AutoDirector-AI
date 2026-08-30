# AutoDirector AI

**Give it a topic. Get a professionally assembled video.**

AutoDirector AI is a local-first, zero-API-cost production system. The Android app is a controller; AI and rendering run on your own PC so provider keys never ship inside the APK.

## What currently works

1. Topic **or a YouTube URL** and production settings are submitted from web/Android.
2. Ollama creates strategy, script, scene narration, and cinematic prompts. For a YouTube source, the engine fetches the video transcript (no API key), analyzes its structure/style/key points, and writes an **original** video in the same format — it never copies the source script.
3. ComfyUI + SDXL generates a unique visual for every scene.
4. Piper creates scene-level neural narration.
5. FFmpeg synchronizes narration, applies cinematic motion, encodes clips, and creates the final MP4.
6. Project state, logs, scene assets, the saved source transcript, and the export are persisted locally.

The architecture is provider-neutral. See [FREE_MODELS.md](FREE_MODELS.md). A second tool lives in this repo: [kdp-app](kdp-app/README.md) — the **KDP Command Center**, a Bangla/English business-planning web app built from the Amazon KDP roadmap video.

## Requirements (local engine PC)

- Node.js 20+
- FFmpeg on PATH
- Ollama with `qwen2.5:7b`
- ComfyUI on port `8188`, with `sd_xl_base_1.0.safetensors`
- Piper CLI and an English voice model at `models/en_US-lessac-medium.onnx`
- Recommended: NVIDIA GPU with 8 GB+ VRAM; 12 GB+ is better

## Start

```bash
ollama pull qwen2.5:7b
# Start Ollama and ComfyUI separately
cd server && npm install && npm start
# In another terminal
cd .. && npm install && npm run dev
```

Engine API: `http://YOUR_PC_LAN_IP:8787`. Enter that address and the six-digit pairing code printed by the engine in the New Production screen. Android emulator may use `http://10.0.2.2:8787`. Phone and PC must be on the same trusted network; allow TCP 8787 through the PC firewall. Sessions use random 256-bit bearer tokens and are invalidated when the engine restarts. See [server/SECURITY.md](server/SECURITY.md).

## YouTube → original video workflow

1. In **New production**, paste a YouTube link (watch/shorts/youtu.be — any format).
2. The controller shows a YouTube badge; press **Analyze video** — the engine fetches captions (`ytInitialPlayerResponse` → timedtext, with an innertube fallback; no API key), then Ollama returns: structure breakdown, key points, tone, CTA, plus an **original** scene-by-scene production plan in your chosen language.
3. Review the plan in the modal, then **Generate production** — the normal pipeline renders it (SDXL visuals → Piper voice → FFmpeg edit). The source transcript is saved to the project folder as `source-transcript.txt`.
4. If a video has no captions, paste the transcript manually in the modal — everything else works the same.

Notes: analysis quality depends on `OLLAMA_MODEL` (qwen2.5:7b handles Bangla transcripts well); long transcripts are truncated for the 8k context. The generated script is always original wording inspired by the source's structure — never a copy.

## KDP Command Center (separate tool)

`kdp-app/` is a standalone local-first web app (React + Vite, no backend) that turns the Amazon KDP roadmap video into a working business system: income-goal calculator, niche scoring ("King of the Pond" rules), competitor analysis, a product pipeline with anti-copy-paste uniqueness checks, and a 6-month consistency roadmap. UI is Bangla + English.

```bash
cd kdp-app && npm install && npm run dev   # http://localhost:5174
```

See [kdp-app/README.md](kdp-app/README.md).

## Controller API

- `POST /api/pair`
- `POST /api/youtube/analyze` — `{ url, transcript?, language?, duration?, style? }` → source metadata + transcript + Ollama analysis (structure, key points, original production plan). Use `transcript` when a video has no captions.
- `POST /api/projects` — `{ topic?, settings, source? }`; `source.type = 'youtube'` carries the analyzed video so the pipeline scripts from it
- `POST /api/projects/:id/generate`
- `GET /api/projects/:id`
- `GET /api/projects/:id/progress`
- `GET /api/projects/:id/logs`
- `POST /api/projects/:id/cancel`
- `GET /api/providers/health`
- `GET /api/assets/:projectId/*`
- `GET /api/projects/:id/export`

Run `cd server && npm run smoke` while the engine is running to validate the engine endpoint, authenticated provider health, and a one-second FFmpeg render.

Configuration: `OLLAMA_URL`, `OLLAMA_MODEL`, `COMFYUI_URL`, `COMFY_CHECKPOINT`, `PIPER_MODEL`, and `PROJECTS_DIR` environment variables.

## Build Android APK

```bash
npm ci
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`. GitHub Actions also publishes it as a downloadable workflow artifact on every push.

## Important scope notes

The included production path makes image-based documentary/explainer video with AI visuals, voice, motion, and deterministic editing. True diffusion-based text-to-video is optional because local video models require substantially stronger GPUs. It can be added through ComfyUI without changing the mobile app. Factual scripts and generated media should be human-reviewed before publishing.
