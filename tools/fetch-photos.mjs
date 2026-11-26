// Fetch high-quality historical photos from Wikimedia Commons, measure real dimensions,
// update content/issue-01/enrichment.json (preserving all footnotes & text), and rebuild site.
// Usage: node tools/fetch-photos.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const photoDir = "content/issue-01/photos";
const enrPath = "content/issue-01/enrichment.json";
const UA =
  "NextBitMagazine/1.0 (https://mmatvakili-lgtm.github.io/Next-Bit/; educational magazine)";

const PHOTOS = [
  {
    id: "ph-abacus",
    slug: "before-computers",
    after: "اگر منظورمون ابزاری باشه که به محاسبه کمک می‌کنه",
    replacesFig: "abacus",
    file: "abacus.jpg",
    wikiFile: "File:Boulier1.JPG",
    fallbackQuery: "Chinese abacus suanpan wooden",
    alt: "یک چرتکهٔ چوبی سنتی با مهره‌های شمارش",
    caption:
      "چرتکه؛ یکی از قدیمی‌ترین ابزارهایی که محاسبه را از ذهن انسان به یک ساختار بیرونی منتقل کرد.",
    credit: "Wikimedia Commons",
  },
  {
    id: "ph-babbage",
    slug: "gears-and-dreams",
    after:
      "چارلز ببیج در قرن نوزدهم روی ایده ماشین‌های محاسباتی مکانیکی کار کرد.",
    file: "charles-babbage.jpg",
    wikiFile: "File:Charles_Babbage_-_1860.jpg",
    fallbackQuery: "Charles Babbage 1860 portrait",
    alt: "پرترهٔ تاریخی چارلز ببیج، ریاضی‌دان و طراح ماشین تحلیلی",
    caption: "چارلز ببیج (۱۷۹۱–۱۸۷۱)؛ طراح ماشین تفاضلی و ماشین تحلیلی.",
    credit: "Wikimedia Commons",
  },
  {
    id: "ph-engine",
    slug: "gears-and-dreams",
    after: "ماشین می‌تونست قرار باشه مجموعه‌ای از دستورها رو دنبال کنه.",
    replacesFig: "engine",
    file: "analytical-engine-trial.jpg",
    wikiFile: "File:Babbages_Analytical_Engine,_1834-1871._(9660574685).jpg",
    fallbackQuery: "Babbage Analytical Engine Science Museum",
    alt: "بخشی از مدل آزمایشی ماشین تحلیلی ببیج در موزهٔ علم لندن",
    caption:
      "بخشی از نمونهٔ آزمایشی ماشین تحلیلی چارلز ببیج؛ نگهداری‌شده در موزهٔ علم لندن.",
    credit: "Science Museum Group / Wikimedia Commons",
  },
  {
    id: "ph-ada",
    slug: "gears-and-dreams",
    after: "در یادداشت‌های او، الگوریتمی برای محاسبه اعداد برنولی",
    file: "ada-lovelace.jpg",
    wikiFile: "File:Ada_Lovelace_portrait.jpg",
    fallbackQuery: "Ada Lovelace portrait Chalon",
    alt: "پرترهٔ تاریخی آدا لاولیس",
    caption:
      "آدا لاولیس (۱۸۱۵–۱۸۵۲)؛ نویسندهٔ یادداشت‌های مشهور دربارهٔ ماشین تحلیلی و الگوریتم اعداد برنولی.",
    credit: "Wikimedia Commons",
  },
  {
    id: "ph-eniac",
    slug: "room-sized-computers",
    after:
      "ENIAC از هزاران لامپ خلأ استفاده می‌کرد و فضای بسیار زیادی اشغال می‌کرد.",
    file: "eniac.jpg",
    wikiFile: "File:Eniac.jpg",
    fallbackQuery: "ENIAC Penn1 computer",
    alt: "نمایی از کامپیوتر اتاق‌اندازهٔ ENIAC در دههٔ ۱۹۴۰",
    caption:
      "کامپیوتر ENIAC؛ یکی از نخستین کامپیوترهای الکترونیکی دیجیتال با هزاران لامپ خلأ.",
    credit: "U.S. Army / Wikimedia Commons",
  },
  {
    id: "ph-punchcard",
    slug: "room-sized-computers",
    after: "در نسل‌های اولیه کامپیوتر، برنامه‌ریزی می‌تونست به تنظیم کلیدها",
    replacesFig: "punchcard",
    file: "punch-card-real.jpg",
    wikiFile: "File:Used_Punchcard_(5151286161).jpg",
    fallbackQuery: "IBM 80 column punched card",
    alt: "یک کارت پانچ واقعی با ستون‌هایی از سوراخ‌های کدگذاری‌شده",
    caption:
      "کارت پانچ؛ الگوی سوراخ‌ها روی این کارت مقوایی، داده و دستور را به کامپیوترهای اولیه منتقل می‌کرد.",
    credit: "Wikimedia Commons",
  },
  {
    id: "ph-eniac-women",
    slug: "room-sized-computers",
    after: "گروهی از زنان به‌عنوان برنامه‌نویسان ENIAC فعالیت می‌کردن",
    file: "eniac-programmers.jpg",
    wikiFile: "File:Two_women_operating_ENIAC_(full_resolution).jpg",
    fallbackQuery: "Two women operating ENIAC",
    alt: "دو تن از برنامه‌نویسان زن در حال تنظیم کابل‌ها و کلیدهای ENIAC",
    caption:
      "برنامه‌نویسان ENIAC در حال تنظیم پنل‌ها و کابل‌های دستگاه؛ پیش از پیدایش ویرایشگرهای کد امروزی.",
    credit: "U.S. Army / Wikimedia Commons",
  },
  {
    id: "ph-transistor",
    slug: "transistor",
    after: "ترانزیستورها نسبت به لامپ‌های خلأ معمولاً کوچک‌تر و مناسب‌تر",
    replacesFig: "tube-vs-transistor",
    file: "first-transistor.jpg",
    wikiFile: "File:Replica-of-first-transistor.jpg",
    fallbackQuery: "Replica of first transistor Bell Labs 1947",
    alt: "نمونهٔ نخستین ترانزیستور ساخته‌شده در آزمایشگاه‌های بل در سال ۱۹۴۷",
    caption:
      "نمونهٔ نخستین ترانزیستور نقطه‌تماسی (آزمایشگاه‌های بل، ۱۹۴۷)؛ نقطهٔ عطف کوچک‌شدن مدارها.",
    credit: "Wikimedia Commons",
  },
  {
    id: "ph-intel4004",
    slug: "transistor",
    after:
      "ریزپردازنده بخش مهمی از عملیات پردازشی رو در یک تراشه مجتمع می‌کنه.",
    file: "intel-4004.jpg",
    wikiFile: "File:Intel_C4004.jpg",
    fallbackQuery: "Intel 4004 microprocessor",
    alt: "تراشهٔ ریزپردازندهٔ Intel 4004 از سال ۱۹۷۱",
    caption:
      "ریزپردازندهٔ Intel 4004 (۱۹۷۱)؛ یکی از نخستین ریزپردازنده‌های تجاری که پردازش را روی یک تراشه آورد.",
    credit: "Wikimedia Commons",
  },
  {
    id: "ph-hopper",
    slug: "first-programs",
    after: "COBOL نیز برای کاربردهای تجاری طراحی شد.",
    file: "grace-hopper.jpg",
    wikiFile: "File:Commodore_Grace_M._Hopper,_USN_(covered).jpg",
    fallbackQuery: "Grace Hopper portrait USN",
    alt: "پرترهٔ گریس هاپر، از پیشگامان کامپایلر و زبان‌های سطح بالا",
    caption:
      "گریس هاپر (۱۹۰۶–۱۹۹۲)؛ از پیشگامان ساخت کامپایلر و ایده‌پرداز زبان‌های برنامه‌نویسی نزدیک به زبان انسان.",
    credit: "U.S. Navy / Wikimedia Commons",
  },
  {
    id: "ph-macintosh",
    slug: "personal-computing",
    after:
      "گسترش کامپیوترهای شخصی باعث شد افراد بیشتری به ابزارهای محاسباتی دسترسی پیدا کنن.",
    file: "macintosh-1984.jpg",
    wikiFile: "File:Macintosh_128k_transparency.png",
    fallbackQuery: "Apple Macintosh 128K computer",
    alt: "رایانهٔ شخصی Apple Macintosh 128K از سال ۱۹۸۴",
    caption:
      "Apple Macintosh (۱۹۸۴)؛ یکی از رایانه‌های شخصی که رابط گرافیکی و ماوس را برای کاربران عادی فراگیر کرد.",
    credit: "Wikimedia Commons",
  },
  {
    id: "ph-cern-web",
    slug: "message-journey",
    after: "بعدها وب، مرورگرها و ابزارهای ارتباطی باعث شدن",
    file: "cern-www-server.jpg",
    wikiFile: "File:First_Web_Server.jpg",
    fallbackQuery: "First Web Server CERN NeXTcube",
    alt: "کامپیوتر NeXTcube؛ نخستین سرور وب جهان در سازمان CERN",
    caption:
      "نخستین سرور وب جهان در CERN (کامپیوتر NeXT تیم برنرز-لی)؛ روی برچسب آن نوشته شده: «این ماشین یک سرور است، خاموشش نکنید!»",
    credit: "CERN / Wikimedia Commons",
  },
  {
    id: "ph-quantum",
    slug: "the-future",
    after:
      "ساخت سامانه‌های کوانتومی پایدار و قابل‌استفاده هم با چالش‌های فنی مهمی روبه‌روست.",
    file: "quantum-computer.jpg",
    wikiFile: "File:IBM_Q_system_(Fraunhofer_2).jpg",
    fallbackQuery: "IBM Quantum computer cryostat chandelier",
    alt: "ساختار سردکنندهٔ یک سامانهٔ محاسبات کوانتومی آزمایشی",
    caption:
      "ساختار فیزیکی یک سامانهٔ کوانتومی پژوهشی؛ نیازمند دمای بسیار پایین برای حفظ پایداری کیوبیت‌ها.",
    credit: "Wikimedia Commons",
  },
  {
    id: "ph-logbook",
    slug: "history-of-bugs",
    after: "موزهٔ ملی تاریخ آمریکا",
    file: "mark2-logbook-bug.jpg",
    wikiFile: "File:First_Computer_Bug,_1945.jpg",
    fallbackQuery: "First Computer Bug 1945 logbook moth",
    alt: "صفحهٔ اصلی دفتر ثبت وقایع Harvard Mark II با پروانهٔ چسبانده‌شده و یادداشت First actual case of bug being found",
    caption:
      "صفحهٔ اصلی دفتر ثبت وقایع Mark II (سپتامبر ۱۹۴۷) با پروانهٔ شب‌پره و یادداشت مشهور «اولین مورد واقعی پیدا شدن باگ».",
    credit: "Smithsonian NMAH / Wikimedia Commons",
  },
];

async function queryCommons(params) {
  const qs = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    ...params,
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${qs}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`Commons API HTTP ${res.status}`);
  return res.json();
}

async function resolveImage(item) {
  // 1) Try exact Wikimedia File title
  let data = await queryCommons({
    titles: item.wikiFile,
    prop: "imageinfo",
    iiprop: "url|size",
    iiurlwidth: "1200",
  });
  let pages = Object.values(data?.query?.pages || {});
  let info = pages[0]?.imageinfo?.[0];

  // 2) Fallback: search Commons if exact title wasn't found
  if (!info) {
    data = await queryCommons({
      generator: "search",
      gsrsearch: item.fallbackQuery,
      gsrnamespace: "6",
      gsrlimit: "3",
      prop: "imageinfo",
      iiprop: "url|size|mime",
      iiurlwidth: "1200",
    });
    pages = Object.values(data?.query?.pages || {}).filter((p) => {
      const m = p.imageinfo?.[0]?.mime || "";
      return m === "image/jpeg" || m === "image/png";
    });
    info = pages[0]?.imageinfo?.[0];
  }
  if (!info) return null;
  return {
    url: info.thumburl || info.url,
    w: info.thumbwidth || info.width || 1200,
    h: info.thumbheight || info.height || 800,
    pageUrl:
      info.descriptionurl ||
      `https://commons.wikimedia.org/wiki/${encodeURIComponent(item.wikiFile)}`,
  };
}

async function downloadFile(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3000) throw new Error("Downloaded file too small");
  fs.writeFileSync(dest, buf);
  return buf.length;
}

fs.mkdirSync(photoDir, { recursive: true });
const enr = JSON.parse(fs.readFileSync(enrPath, "utf8"));
const nextPhotos = [];
let okCount = 0;

console.log(
  `Fetching ${PHOTOS.length} curated photos from Wikimedia Commons...\n`,
);

for (const item of PHOTOS) {
  const dest = path.join(photoDir, item.file);
  try {
    const meta = await resolveImage(item);
    if (!meta) {
      console.log(`✗ [not found] ${item.file}`);
      continue;
    }
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 3000) {
      const bytes = await downloadFile(meta.url, dest);
      console.log(
        `✓ [saved] ${item.file} (${Math.round(bytes / 1024)} KB, ${meta.w}×${meta.h})`,
      );
    } else {
      console.log(`✓ [exists] ${item.file} (${meta.w}×${meta.h})`);
    }
    const entry = {
      slug: item.slug,
      after: item.after,
      id: item.id,
      file: item.file,
      w: meta.w,
      h: meta.h,
      alt: item.alt,
      caption: item.caption,
      credit: item.credit,
      source: meta.pageUrl,
    };
    if (item.replacesFig) entry.replacesFig = item.replacesFig;
    nextPhotos.push(entry);
    okCount++;
  } catch (err) {
    console.log(`✗ [error] ${item.file}: ${err.message}`);
  }
}

// Update enrichment.json: replace photos list and remove redundant inline SVG in history-of-bugs if real logbook photo exists
enr.photos = nextPhotos;
if (
  nextPhotos.some((p) => p.id === "ph-logbook") &&
  Array.isArray(enr.additions)
) {
  for (const ad of enr.additions) {
    if (ad.slug === "history-of-bugs" && ad.block?.blocks) {
      ad.block.blocks = ad.block.blocks.filter((b) => b.t !== "fig");
    }
  }
}
fs.writeFileSync(enrPath, JSON.stringify(enr, null, 2) + "\n", "utf8");

console.log(
  `\nUpdated enrichment.json with ${okCount}/${PHOTOS.length} photos. Rebuilding site...`,
);
execFileSync(process.execPath, ["build.mjs"], { stdio: "inherit" });
console.log("PHASE 2 DONE!");
