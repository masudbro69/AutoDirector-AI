# AutoDirector AI

**Give it a topic. Get a professionally assembled video.**

AutoDirector AI is a local-first, zero-API-cost production system. The Android app is a controller; AI and rendering run on your own PC so provider keys never ship inside the APK.

## What currently works

1. Topic and production settings are submitted from web/Android.
2. Ollama creates strategy, script, scene narration, and cinematic prompts.
3. ComfyUI + SDXL generates a unique visual for every scene.
4. Piper creates scene-level neural narration.
5. FFmpeg synchronizes narration, applies cinematic motion, encodes clips, and creates the final MP4.
6. Project state, logs, scene assets, and the export are persisted locally.

The architecture is provider-neutral. See [FREE_MODELS.md](FREE_MODELS.md).

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

Engine API: `http://YOUR_PC_LAN_IP:8787`. Enter that address in the New Production screen. Android emulator may use `http://10.0.2.2:8787`. Phone and PC must be on the same network; allow TCP 8787 through the PC firewall.

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
