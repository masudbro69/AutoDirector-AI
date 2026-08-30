/**
 * YouTube transcript fetcher-এর standalone টেস্ট।
 * Run: npx tsx scripts/youtube-test.ts [videoUrlOrId]
 * Ollama/ComfyUI লাগে না — শুধু transcript আনাটা যাচাই করে।
 */
import { fetchYouTubeData, parseVideoId } from '../src/youtube.js';

async function main() {
  const input = process.argv[2] || 'https://youtu.be/KomTv95e_Bk?si=wdXlwJWEupx0o5A9';
  const videoId = parseVideoId(input);
  console.log(`Input:    ${input}`);
  console.log(`Video ID: ${videoId || '(NOT PARSED — FAIL)'}`);
  if (!videoId) process.exit(1);

  const data = await fetchYouTubeData(videoId);
  console.log(`Title:    ${data.title}`);
  console.log(`Author:   ${data.author}`);
  console.log(`Length:   ${Math.floor(data.lengthSeconds / 60)}m ${data.lengthSeconds % 60}s`);
  console.log(`Language: ${data.captionLanguage} (${data.transcriptSource})`);
  console.log(`Segments: ${data.segments.length}`);
  console.log(`Chars:    ${data.transcript.length}`);
  console.log('\n--- first 400 chars of transcript ---');
  console.log(data.transcript.slice(0, 400));
  console.log('\n✅ Transcript fetch OK');
}

main().catch((e) => {
  console.error('❌ FAILED:', e.message);
  process.exit(1);
});
