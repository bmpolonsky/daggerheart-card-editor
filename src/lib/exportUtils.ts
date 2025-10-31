const EXPORT_PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" fill="#9ca3af" font-size="18" font-family="sans-serif" dominant-baseline="middle" text-anchor="middle">Изображение недоступно при экспорте</text></svg>`
  );

async function toDataUrl(url: string) {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function buildProxyUrl(url: string) {
  const clean = url.replace(/^https?:\/\//, "");
  return `https://images.weserv.nl/?url=${encodeURIComponent(clean)}&default=404&output=png`;
}

export async function inlineExternalImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  const restoreCallbacks: Array<() => void> = [];

  await Promise.all(
    images.map(async (img) => {
      const src = img.currentSrc || img.getAttribute("src");
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
        return;
      }

      const originalSrc = img.getAttribute("src") ?? "";
      const originalSrcSet = img.getAttribute("srcset");
      const originalCrossOrigin = img.getAttribute("crossorigin");

      const applyPlaceholder = () => {
        if (originalSrcSet) img.removeAttribute("srcset");
        img.setAttribute("src", EXPORT_PLACEHOLDER_IMAGE);
        restoreCallbacks.push(() => {
          img.setAttribute("src", originalSrc);
          if (originalSrcSet) {
            img.setAttribute("srcset", originalSrcSet);
          } else {
            img.removeAttribute("srcset");
          }
          if (originalCrossOrigin) {
            img.setAttribute("crossorigin", originalCrossOrigin);
          } else {
            img.removeAttribute("crossorigin");
          }
        });
      };

      try {
        let dataUrl: string | null = null;

        try {
          dataUrl = await toDataUrl(src);
        } catch (primaryError) {
          console.warn("Image inline failed, retry via proxy", primaryError);
          try {
            dataUrl = await toDataUrl(buildProxyUrl(src));
          } catch (proxyError) {
            console.warn("Proxy inline failed", proxyError);
            dataUrl = null;
          }
        }

        if (!dataUrl) {
          applyPlaceholder();
          return;
        }

        img.setAttribute("crossorigin", "anonymous");
        if (originalSrcSet) img.removeAttribute("srcset");
        img.setAttribute("src", dataUrl);

        restoreCallbacks.push(() => {
          img.setAttribute("src", originalSrc);
          if (originalSrcSet) {
            img.setAttribute("srcset", originalSrcSet);
          } else {
            img.removeAttribute("srcset");
          }
          if (originalCrossOrigin) {
            img.setAttribute("crossorigin", originalCrossOrigin);
          } else {
            img.removeAttribute("crossorigin");
          }
        });
      } catch (error) {
        console.warn("Failed to inline image", error);
        applyPlaceholder();
      }
    })
  );

  return () => {
    restoreCallbacks.forEach((restore) => restore());
  };
}
