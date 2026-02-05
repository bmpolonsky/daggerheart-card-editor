import bannerDomainRaw from "@/assets/templates/banner-domain.svg?raw";
import dividerClassRaw from "@/assets/templates/divider-class.svg?raw";
import dividerDomainRaw from "@/assets/templates/divider-domain.svg?raw";
import { createSvgTemplate } from "@/lib/svgTemplateEngine";

const bannerDomain = createSvgTemplate(bannerDomainRaw);
const dividerClass = createSvgTemplate(dividerClassRaw, { removeText: true });
const dividerDomain = createSvgTemplate(dividerDomainRaw, { removeText: true });

export const TEMPLATE_REGISTRY = {
  bannerDomain,
  dividerClass,
  dividerDomain,
} as const;
