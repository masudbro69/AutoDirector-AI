# Free/local model stack

| Task | Default | License/cost note |
|---|---|---|
| Research, strategy, script, prompts | Ollama + Qwen 2.5 7B | Local inference; no API charge. Review the model license for your use. |
| Images | ComfyUI + SDXL | Local inference; no API charge. Use a checkpoint whose license permits your use. |
| Voice | Piper TTS | Local inference; voice models have individual model cards/licenses. |
| Editing/render | FFmpeg | Open-source deterministic media processing. |
| Video motion | FFmpeg Ken Burns pipeline | Included and works without a generative-video service. |

## Optional upgrades

ComfyUI can be extended with Stable Video Diffusion, AnimateDiff, or Wan models. These require significantly more VRAM and are intentionally not downloaded automatically. AutoDirector's provider layer is designed so a video provider can be added without exposing credentials in the APK.

“Free” means the software performs local inference without per-request API fees. Electricity, hardware, hosting, internet, and third-party content licensing are not free. Generated output must still be reviewed for accuracy, safety, and applicable copyright rights.
