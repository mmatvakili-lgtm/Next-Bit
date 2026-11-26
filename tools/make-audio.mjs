// Generate neural Persian MP3 podcasts with Persian TTS normalization (Windows-friendly)
// Usage:
//   node tools/make-audio.mjs                                    (all chapters, Dilara)
//   node tools/make-audio.mjs farid                              (all chapters, Farid)
//   node tools/make-audio.mjs --only before-computers --force    (test 1 chapter, Dilara)
//   node tools/make-audio.mjs --only before-computers farid --force (test 1 chapter, Farid)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const force = args.includes("--force");
const voice = args.includes("farid")
  ? "fa-IR-FaridNeural"
  : "fa-IR-DilaraNeural";
const onlyIdx = args.indexOf("--only");
const onlySlug = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

const srcDir = "content/issue-01/audio-src";
const outDir = "content/issue-01/audio";

// Persian-specific phonetic fixes for edge-tts (applied only to spoken script, never to site text)
const FA_FIXES = [
  [/چرتکه/g, "چُرتکه"],
  [/چوب\s*خط/g, "چوب خَط"],
  [/یک\s*خطی/g, "یک خَطی"],
  [/عددها/g, "عَدَدها"],
  [/مدار\s*مجتمع/g, "مدارِ مُجتَمَع"],
  [/ذهنت\s+اجرا/g, "ذِهنَت، اجرا"],
  [/در\s+ذهنت/g, "در ذِهنَت"],
  [/به\s+ذهنت/g, "به ذِهنَت"],
  [/در\s+ذهن\s+نگه/g, "در ذِهن نگه"],
  [/دست\s*کم/g, "دستِ کم"],
  [/لامپ\s*خلأ/g, "لامپِ خَلا"],
  [/لامپ\s*های\s*خلأ/g, "لامپ های خَلا"],
  [/خلأ/g, "خَلا"],
  [/برنولی/g, "بِرنولی"],
  [/ببیج/g, "بَبیج"],
  [/گیت\s+های/g, "گِیت های"],
  [/گیت\s+منطقی/g, "گِیتِ منطقی"],
  [/گیت(?=\s)/g, "گِیت"],
  [/باگ/g, "باگ"],
  [/جمع\s*بندی/g, "جمع بندی"],
];

function normalizeForEdgeTTS(raw) {
  let t = raw.replace(/\r/g, "");
  // 1) Fix ZWNJ around 'و' (e.g. حساب‌وکتاب -> حساب و کتاب)
  t = t.replace(/\u200cو\u200c|\u200cو(?=[آ-ی])|(?<=[آ-ی])و\u200c/g, " و ");
  // 2) Protect می\u200c and نمی\u200c (edge-tts reads them well), convert all other ZWNJ to space
  t = t.replace(/(^|[\s«(])(ن?می)\u200c/g, "$1$2__Z__");
  t = t.replace(/\u200c/g, " ");
  t = t.replace(/__Z__/g, "\u200c");
  // 3) Apply Persian phonetic/diacritic fixes
  for (const [re, rep] of FA_FIXES) t = t.replace(re, rep);
  // 4) Improve pauses: ensure each line ends with punctuation and separate paragraphs with blank lines
  const lines = t
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
  const formatted = lines.map((l) => {
    if (!/[.!؟…:]$/.test(l)) return l + ".";
    return l;
  });
  return formatted.join("\n\n") + "\n";
}

console.log("1) Building clean audio transcripts...");
execFileSync(process.execPath, ["build.mjs"], { stdio: "inherit" });

fs.mkdirSync(outDir, { recursive: true });
let files = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith(".txt") && !f.endsWith(".tts.txt"))
  .sort();
if (onlySlug) {
  files = files.filter((f) => f === `${onlySlug}.txt`);
  if (!files.length) {
    console.error(`Slug not found: ${onlySlug}`);
    process.exit(1);
  }
}

console.log(`2) Generating ${files.length} podcast(s) with ${voice}...`);

let done = 0;
for (const f of files) {
  const slug = f.replace(/\.txt$/, "");
  const inFile = path.join(srcDir, f);
  const ttsFile = path.join(srcDir, `${slug}.tts.txt`);
  const outFile = path.join(outDir, `${slug}.mp3`);

  if (!force && fs.existsSync(outFile) && fs.statSync(outFile).size > 5000) {
    console.log(`   [skip] ${slug}.mp3 (already exists)`);
    done++;
    continue;
  }

  const rawText = fs.readFileSync(inFile, "utf8");
  fs.writeFileSync(ttsFile, normalizeForEdgeTTS(rawText), "utf8");

  console.log(`   [tts]  ${slug}.mp3 ...`);
  execFileSync(
    "python",
    [
      "-m",
      "edge_tts",
      "--voice",
      voice,
      "--rate=-4%",
      "--file",
      ttsFile,
      "--write-media",
      outFile,
    ],
    { stdio: "inherit" },
  );
  done++;
}

console.log(`3) Rebuilding site...`);
execFileSync(process.execPath, ["build.mjs"], { stdio: "inherit" });
console.log("ALL DONE!");
