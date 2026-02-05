import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";

const BASE_URL = process.env.ASSET_SOURCE ?? "https://daggerheart.su";
const ASSET_MODE = process.env.ASSET_MODE ?? "full";
const SHOULD_REFRESH = process.env.ASSET_REFRESH === "1";
const PUBLIC_DIR = resolve("public");
const DATA_DIR = resolve("public/data");
const CSS_FILES = ["/styles.css", "/cards.css"];
const CATEGORIES = ["ancestry", "community", "subclass", "domain-card"];

const stripTrailingSlash = (value) => value.replace(/\/+$/, "");
const cleanBase = stripTrailingSlash(BASE_URL);

const assetSet = new Set();
const domainEmblemSet = new Set();

function ensureLeadingSlash(value) {
  if (!value.startsWith("/")) return `/${value}`;
  return value;
}

function optimizeAssetPath(path) {
  const domainCardMatch = path.match(/^\/image\/domain\/card\/([^/.]+)(\.[a-zA-Z0-9]+)?$/);
  if (domainCardMatch) {
    return `/image/domain/card/small/${domainCardMatch[1]}.avif`;
  }
  const genericMatch = path.match(/^\/image\/(.+?)\/([^/.]+)\.(jpe?g|png|webp)$/);
  if (genericMatch) {
    const [, folder, slug] = genericMatch;
    return `/image/${folder}/small/${slug}.avif`;
  }
  return path;
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadTo(pathname) {
  const normalized = ensureLeadingSlash(pathname);
  const targetPath = resolve(PUBLIC_DIR, `.${normalized}`);

  if (await fileExists(targetPath)) return;

  await ensureDir(dirname(targetPath));
  const url = `${cleanBase}${normalized}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url} (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(targetPath, buffer);
}

function addAsset(pathname) {
  if (!pathname) return;
  assetSet.add(ensureLeadingSlash(pathname));
}

function addOptimizedAsset(pathname) {
  if (!pathname) return;
  const normalized = ensureLeadingSlash(pathname);
  addAsset(optimizeAssetPath(normalized));
}

function rewriteCssUrls(cssText) {
  return cssText.replace(/url\((['"]?)\/(?!\/)/g, "url($1./");
}

function extractUrlsFromCss(cssText) {
  const matches = cssText.matchAll(/url\(([^)]+)\)/g);
  for (const match of matches) {
    const raw = match[1].trim().replace(/^['"]|['"]$/g, "");
    if (!raw || raw.startsWith("data:")) continue;
    if (raw.startsWith("http://") || raw.startsWith("https://")) continue;
    const normalized = raw.startsWith("./") ? `/${raw.slice(2)}` : raw;
    addAsset(normalized);
  }
}

async function downloadCss() {
  for (const file of CSS_FILES) {
    const targetPath = resolve(PUBLIC_DIR, `.${file}`);
    let cssText = "";
    if (!SHOULD_REFRESH && (await fileExists(targetPath))) {
      cssText = await readFile(targetPath, "utf8");
    } else {
      const url = `${cleanBase}${file}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download ${url} (${response.status})`);
      }
      cssText = await response.text();
    }

    extractUrlsFromCss(cssText);

    const rewrittenCss = rewriteCssUrls(cssText);
    if (!(await fileExists(targetPath)) || rewrittenCss !== cssText || SHOULD_REFRESH) {
      await ensureDir(PUBLIC_DIR);
      await writeFile(targetPath, rewrittenCss);
    }
  }
}

function addCardAssets(item) {
  if (item.image_url) {
    addOptimizedAsset(item.image_url);
  }

  if (item.class_slug) {
    addAsset(`/image/class/divider/${item.class_slug.replace("playtest-", "")}.avif`);
    addAsset(`/image/class/banner/${item.class_slug.replace("playtest-", "")}.avif`);
  }

  if (item.domain_slug) {
    const normalized = item.domain_slug.replace("playtest-", "");
    addAsset(`/image/domain/divider/${normalized}.avif`);
    addAsset(`/image/domain/banner/${normalized}.avif`);
    domainEmblemSet.add(normalized);
  }

  if (Array.isArray(item.domain_slugs)) {
    item.domain_slugs
      .map((slug) => slug.replace("playtest-", ""))
      .forEach((slug) => domainEmblemSet.add(slug));
  }
}

async function downloadData() {
  await ensureDir(DATA_DIR);

  for (const endpoint of CATEGORIES) {
    const url = `${cleanBase}/api/${endpoint}?lang=ru`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Failed to download ${url} (${response.status})`);
    }
    const payload = await response.json();
    await writeFile(join(DATA_DIR, `${endpoint}.json`), JSON.stringify(payload, null, 2));

    if (payload?.data && Array.isArray(payload.data)) {
      payload.data.forEach(addCardAssets);
    }
  }
}

async function main() {
  await downloadCss();
  if (ASSET_MODE !== "css") {
    await downloadData();

    addAsset("/image/wip.avif");
    addAsset("/image/domain/stress-cost.avif");
    addAsset("/image/ancestry/divider.avif");
    addAsset("/image/community/divider.webp");
  }

  domainEmblemSet.forEach((slug) => {
    addAsset(`/image/domain/emblems/${slug}.svg`);
  });

  for (const asset of assetSet) {
    try {
      await downloadTo(asset);
    } catch (error) {
      console.warn(String(error));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
