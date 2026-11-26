// Generate natural Persian MP3 podcasts for ALL Issue 01 articles using Gemini 2.5 Flash TTS
// Usage:
//   $env:GEMINI_API_KEY="YOUR_KEY"
//   node tools/make-audio-gemini.mjs
// Options:
//   --only <slug>   generate only one chapter
//   --voice <name>  default: Aoede (options: Aoede, Kore, Puck, Charon, Fenrir, Zephyr)
//   --force         regenerate even if already built by Gemini
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    'Error: Set GEMINI_API_KEY first.\nExample: $env:GEMINI_API_KEY="AIza..."',
  );
  process.exit(1);
}

const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};
const onlySlug = getArg("--only", null);
const voice = getArg("--voice", "Aoede");
const force = args.includes("--force");
const MODEL = "gemini-2.5-flash-preview-tts";
const srcDir = "content/issue-01/audio-src";
const outDir = "content/issue-01/audio";
const stateFile = path.join(outDir, ".gemini-done.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findFfmpeg() {
  try {
    const p = execFileSync(
      "python",
      ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (p && fs.existsSync(p)) return p;
  } catch {}
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return "ffmpeg";
  } catch {}
  console.error(
    "Error: ffmpeg not found. Run this once:\n  python -m pip install imageio-ffmpeg",
  );
  process.exit(1);
}

function chunkText(text, maxLen = 2400) {
  const paras = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks = [];
  let cur = "";
  for (const p of paras) {
    if (cur && cur.length + p.length + 2 > maxLen) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? `${cur}\n\n${p}` : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

function pcmToWav(
  pcmBuffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16,
) {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

function wavToMp3(ffmpeg, wavPath, mp3Path) {
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      wavPath,
      "-ar",
      "24000",
      "-ac",
      "1",
      "-b:a",
      "64k",
      "-loglevel",
      "error",
      mp3Path,
    ],
    { stdio: "inherit" },
  );
}

async function synthChunk(text, idx, total) {
  const prompt = [
    "متن زیر بخش یک مجلهٔ علمی دانشجویی به زبان فارسی محاوره‌ای است.",
    "آن را با لحن گرم، صمیمی، طبیعی و حرفه‌ایِ یک مجری پادکست فارسی بخوان.",
    "بین تیترها و بندها مکث طبیعی بگذار، جملات پرسشی و شوخی‌ها را با لحن مناسب ادا کن، اصطلاحات انگلیسی را روان تلفظ کن و دقیقاً فقط خود متن را بدون اضافه یا کم کردن بخوان:",
    "",
    text,
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const waitSecs = [15, 30, 45, 60, 60];

  for (let attempt = 0; attempt <= waitSecs.length; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const b64 =
          data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!b64) throw new Error(`Empty audio in chunk ${idx + 1}/${total}`);
        return Buffer.from(b64, "base64");
      }

      const errText = await res.text();
      if (
        [429, 500, 502, 503, 504].includes(res.status) &&
        attempt < waitSecs.length
      ) {
        console.log(
          `   [wait] API ${res.status} — retrying in ${waitSecs[attempt]}s...`,
        );
        await sleep(waitSecs[attempt] * 1000);
        continue;
      }
      throw new Error(`API ${res.status}: ${errText.slice(0, 300)}`);
    } catch (err) {
      if (
        attempt < waitSecs.length &&
        !String(err.message).startsWith("API 40")
      ) {
        console.log(
          `   [retry] ${err.message} — waiting ${waitSecs[attempt]}s...`,
        );
        await sleep(waitSecs[attempt] * 1000);
        continue;
      }
      throw err;
    }
  }
}

const ffmpeg = findFfmpeg();
console.log("1) Building fresh transcripts...");
execFileSync(process.execPath, ["build.mjs"], { stdio: "inherit" });

fs.mkdirSync(outDir, { recursive: true });
const doneMap = fs.existsSync(stateFile)
  ? JSON.parse(fs.readFileSync(stateFile, "utf8"))
  : {};
const saveState = () =>
  fs.writeFileSync(stateFile, JSON.stringify(doneMap, null, 2));

let files = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith(".txt") && !f.endsWith(".tts.txt"))
  .sort();
if (onlySlug) files = files.filter((f) => f === `${onlySlug}.txt`);
if (!files.length) {
  console.error("No transcript files found.");
  process.exit(1);
}

console.log(
  `2) Generating Gemini podcasts (${files.length} chapters, voice=${voice})...`,
);

for (const f of files) {
  const slug = f.replace(/\.txt$/, "");
  const mp3Path = path.join(outDir, `${slug}.mp3`);
  const existingTestWav = path.join(outDir, `${slug}-gemini.wav`);

  if (
    !force &&
    doneMap[slug] === voice &&
    fs.existsSync(mp3Path) &&
    fs.statSync(mp3Path).size > 5000
  ) {
    console.log(`   [skip] ${slug}.mp3 (already built with ${voice})`);
    continue;
  }

  // Reuse already-approved test WAV if present
  if (
    !force &&
    fs.existsSync(existingTestWav) &&
    fs.statSync(existingTestWav).size > 50000
  ) {
    console.log(`   [convert] Reusing ${slug}-gemini.wav -> ${slug}.mp3`);
    wavToMp3(ffmpeg, existingTestWav, mp3Path);
    fs.unlinkSync(existingTestWav);
    doneMap[slug] = voice;
    saveState();
    continue;
  }

  const text = fs.readFileSync(path.join(srcDir, f), "utf8").trim();
  const chunks = chunkText(text);
  console.log(`\n[Gemini TTS] ${slug} (${chunks.length} parts)...`);

  const pcmParts = [];
  const pauseBuf = Buffer.alloc(24000 * 2 * 0.5);
  for (let i = 0; i < chunks.length; i++) {
    console.log(`   part ${i + 1}/${chunks.length}...`);
    const pcm = await synthChunk(chunks[i], i, chunks.length);
    pcmParts.push(pcm);
    if (i < chunks.length - 1) {
      pcmParts.push(pauseBuf);
      await sleep(3500);
    }
  }

  const tmpWav = path.join(outDir, `${slug}.tmp.wav`);
  fs.writeFileSync(tmpWav, pcmToWav(Buffer.concat(pcmParts)));
  wavToMp3(ffmpeg, tmpWav, mp3Path);
  fs.unlinkSync(tmpWav);

  const kb = Math.round(fs.statSync(mp3Path).size / 1024);
  console.log(`   ✓ Saved ${slug}.mp3 (${kb} KB)`);
  doneMap[slug] = voice;
  saveState();
  await sleep(3500);
}

console.log("\n3) Rebuilding site with all Gemini podcasts...");
execFileSync(process.execPath, ["build.mjs"], { stdio: "inherit" });
console.log("ALL 14 PODCASTS READY!");
