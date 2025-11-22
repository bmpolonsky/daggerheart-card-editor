const loaded = new Set<string>();

function canPrefetch(url: string | null | undefined) {
  if (!url) return false;
  if (url.startsWith("data:") || url.startsWith("blob:")) return false;
  return true;
}

export function prefetchImages(urls: Array<string | null | undefined>) {
  urls.forEach((url) => {
    if (!canPrefetch(url)) return;
    const normalized = url!;
    if (loaded.has(normalized)) return;

    loaded.add(normalized);
    const img = new Image();
    img.src = normalized;
  });
}
