import type { TemplateCard } from "@/lib/api";
import {
  CARD_TYPE_CONFIG,
  DEFAULT_CARD_TYPE_ID,
  type CardFields,
  type CardTypeId,
  createEmptyCardFields,
} from "@/lib/cardTypes";
import { buildCardFieldsFromTemplate } from "@/lib/cardBuilder";
import { stripMarkdownLinks } from "@/lib/templateUtils";
import { editorStore } from "@/stores/editor";
import { exportStore } from "@/stores/export";
import { prefetchImages } from "@/lib/assetPrefetcher";
import { buildClassBanner, buildClassDivider, buildDomainBanner, buildDomainDivider } from "@/lib/domainAssets";
import { domainService } from "@/services/domainService";
import { domainStore } from "@/stores/domains";
import { templatesStore } from "@/stores/templates";
import { customCardsService, type CustomCardRecord } from "@/services/customCardsService";

type FieldTransformer = (value: string) => string;

type HashTarget =
  | { type: "card"; value: string }
  | { type: "custom"; value: string }
  | { type: "none" };

const isBrowser = () => typeof window !== "undefined";

const parseHash = (hash: string): HashTarget => {
  const cleaned = hash.replace(/^#/, "").trim();
  if (!cleaned) return { type: "none" };
  const [kind, ...rest] = cleaned.split("/");
  const value = decodeURIComponent(rest.join("/"));
  if (kind === "card" && value && value.includes(":")) return { type: "card", value };
  if (kind === "custom" && value) return { type: "custom", value };
  return { type: "none" };
};

const buildHash = (target: HashTarget) => {
  if (target.type === "card") return `#card/${encodeURIComponent(target.value)}`;
  if (target.type === "custom") return `#custom/${encodeURIComponent(target.value)}`;
  return "";
};

export class EditorService {
  readonly store = editorStore;
  private hashBootstrapped = false;
  private pendingHash: HashTarget | null = null;

  constructor() {
    domainStore.subscribe(() => {
      this.refreshDomainAssets();
    });
  }

  ensureHashSync() {
    if (this.hashBootstrapped || !isBrowser()) return;
    this.hashBootstrapped = true;
    window.addEventListener("hashchange", this.handleHashChange);
    templatesStore.subscribe(() => this.resolvePendingHash());
    this.handleHashChange();
  }

  selectCard(card: TemplateCard, options?: { skipHash?: boolean }) {
    const { cardFields, typeId, selectedFeatureIndex } = buildCardFieldsFromTemplate(card);
    const nextFields = this.applyDomainAssets(cardFields, typeId);

    this.prefetchAssets(nextFields, card.image);

    editorStore.update(() => ({
      selectedCard: card,
      selectedTypeId: typeId,
      cardFields: nextFields,
      customImage: null,
      selectedFeatureIndex,
      customCardId: null,
    }));

    exportStore.update(() => ({
      isExporting: false,
      exportError: null,
    }));

    if (!options?.skipHash) {
      this.updateHash({ type: "card", value: `${typeId}:${card.slug}` });
    }
  }

  closeEditor(options?: { skipHash?: boolean }) {
    editorStore.update(() => ({
      selectedCard: null,
      selectedTypeId: DEFAULT_CARD_TYPE_ID,
      cardFields: createEmptyCardFields(),
      customImage: null,
      selectedFeatureIndex: 0,
      customCardId: null,
    }));

    exportStore.update(() => ({
      isExporting: false,
      exportError: null,
    }));

    if (!options?.skipHash) {
      this.updateHash({ type: "none" });
    }
  }

  setCardType(nextType: CardTypeId) {
    this.ensureCustomCardId();
    editorStore.update((prev) => {
      const nextConfig = CARD_TYPE_CONFIG[nextType];
      const nextFields = {
        ...prev,
        selectedTypeId: nextType,
        cardFields: {
          ...prev.cardFields,
          label: prev.cardFields.label || nextConfig.cardLabel,
          dividerImage: nextConfig.defaultDivider || "",
        },
      };

      return {
        ...nextFields,
        cardFields: this.applyDomainAssets(nextFields.cardFields, nextType),
      };
    });
    this.persistCustomCard();
  }

  setField(field: keyof CardFields, value: string, transform?: FieldTransformer) {
    this.ensureCustomCardId();
    editorStore.update((prev) => {
      const nextFields = {
        ...prev.cardFields,
        [field]: transform ? transform(value) : value,
      } as CardFields;

      return {
        ...prev,
        cardFields: this.applyDomainAssets(nextFields, prev.selectedTypeId),
      };
    });
    this.persistCustomCard();
  }

  setDomainPrimary(value: string) {
    this.setField("domainPrimary", value);
  }

  setDomainSecondary(value: string) {
    this.setField("domainSecondary", value);
  }

  refreshDomainAssets() {
    editorStore.update((prev) => ({
      ...prev,
      cardFields: this.applyDomainAssets(prev.cardFields, prev.selectedTypeId),
    }));
  }

  setSubclassFeature(index: number) {
    this.ensureCustomCardId();
    editorStore.update((prev) => {
      const feature = prev.selectedCard?.features[index];
      return {
        ...prev,
        selectedFeatureIndex: index,
        cardFields: {
          ...prev.cardFields,
          description: stripMarkdownLinks(feature?.text ?? ""),
          subclassTier: feature?.group ?? prev.cardFields.subclassTier,
        },
      };
    });
    this.persistCustomCard();
  }

  setCustomImage(dataUrl: string | null) {
    this.ensureCustomCardId();
    editorStore.update((prev) => ({
      ...prev,
      customImage: dataUrl,
    }));
    this.persistCustomCard();
  }

  async loadImageFromFile(file: File) {
    const result = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    this.setCustomImage(result);
  }

  private prefetchAssets(cardFields: CardFields, cardImage: string | null) {
    prefetchImages([
      cardFields.dividerImage,
      cardFields.bannerImage,
      cardFields.stressImage,
      cardImage,
    ]);
  }

  private applyDomainAssets(cardFields: CardFields, typeId: CardTypeId): CardFields {
    if (typeId !== "domain-card" && typeId !== "subclass") {
      return cardFields;
    }

    const primaryId = cardFields.domainPrimary || cardFields.dataDomain;
    const secondaryId = cardFields.domainSecondary || primaryId;
    const primaryTheme = domainService.getTheme(primaryId) ?? {
      id: primaryId || "",
      name: primaryId || "",
      color: "#6b7280",
      icon: null,
      source: "custom" as const,
    };
    const secondaryTheme = domainService.getTheme(secondaryId) ?? primaryTheme;

    const bannerImage =
      typeId === "domain-card"
        ? buildDomainBanner(primaryTheme)
        : buildClassBanner(primaryTheme, secondaryTheme);
    const dividerImage =
      typeId === "domain-card"
        ? buildDomainDivider(primaryTheme)
        : buildClassDivider(primaryTheme, secondaryTheme);

    const classSet = new Set(cardFields.customClasses.split(" ").filter(Boolean));
    if (typeId === "domain-card") {
      if (primaryTheme.id) classSet.add(primaryTheme.id);
      if (secondaryTheme.id) classSet.add(secondaryTheme.id);
    }

    return {
      ...cardFields,
      bannerImage,
      dividerImage,
      dataDomain: typeId === "domain-card" ? primaryTheme.id : cardFields.dataDomain,
      customClasses: Array.from(classSet).join(" "),
    };
  }

  private handleHashChange = () => {
    const target = parseHash(window.location.hash);
    if (target.type === "none") {
      this.closeEditor({ skipHash: true });
      return;
    }

    if (!this.tryApplyHashTarget(target)) {
      this.pendingHash = target;
    }
  };

  private resolvePendingHash() {
    if (!this.pendingHash) return;
    if (this.tryApplyHashTarget(this.pendingHash)) {
      this.pendingHash = null;
    }
  }

  private tryApplyHashTarget(target: HashTarget) {
    if (target.type === "card") {
      const hasTemplates = templatesStore.getState().templateGroups.length > 0;
      if (!hasTemplates) return false;
      const card = this.findCardBySlug(target.value);
      if (!card) {
        this.closeEditor({ skipHash: true });
        this.updateHash({ type: "none" });
        return true;
      }
      this.selectCard(card, { skipHash: true });
      return true;
    }

    if (target.type === "custom") {
      const record = customCardsService.get(target.value);
      if (!record) {
        this.closeEditor({ skipHash: true });
        this.updateHash({ type: "none" });
        return true;
      }
      this.restoreCustomCard(record, { skipHash: true });
      return true;
    }

    return true;
  }

  private findCardBySlug(value: string) {
    const [prefix, ...rest] = value.split(":");
    if (!rest.length) return null;
    const slug = rest.join(":");
    const { templateGroups } = templatesStore.getState();
    const group = templateGroups.find((item) => item.id === prefix);
    if (!group) return null;
    return group.items.find((item) => item.slug === slug || item.id === slug) ?? null;
  }

  private restoreCustomCard(record: CustomCardRecord, options?: { skipHash?: boolean }) {
    const hydratedFields = {
      ...createEmptyCardFields(),
      ...record.cardFields,
    };
    const nextFields = this.applyDomainAssets(hydratedFields, record.typeId);
    this.prefetchAssets(nextFields, record.baseCard?.image ?? null);
    editorStore.update(() => ({
      selectedCard: record.baseCard,
      selectedTypeId: record.typeId,
      cardFields: nextFields,
      customImage: record.customImage,
      selectedFeatureIndex: record.selectedFeatureIndex,
      customCardId: record.id,
    }));

    exportStore.update(() => ({
      isExporting: false,
      exportError: null,
    }));

    if (!options?.skipHash) {
      this.updateHash({ type: "custom", value: record.id });
    }
  }

  private ensureCustomCardId() {
    const state = editorStore.getState();
    if (state.customCardId || !state.selectedCard) {
      return state.customCardId;
    }
    const nextId = customCardsService.createId(state.selectedTypeId);
    editorStore.update((prev) => ({
      ...prev,
      customCardId: nextId,
    }));
    return nextId;
  }

  private persistCustomCard() {
    const state = editorStore.getState();
    if (!state.customCardId) return;

    const record: CustomCardRecord = {
      id: state.customCardId,
      baseCard: state.selectedCard,
      typeId: state.selectedTypeId,
      cardFields: state.cardFields,
      customImage: state.customImage,
      selectedFeatureIndex: state.selectedFeatureIndex,
      updatedAt: Date.now(),
    };

    customCardsService.upsert(record);
    this.updateHash({ type: "custom", value: state.customCardId });
  }

  private updateHash(target: HashTarget) {
    if (!isBrowser()) return;
    const nextHash = buildHash(target);
    const current = window.location.hash || "";
    if (nextHash === current) return;
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, "", nextUrl);
  }

  openCustomCard(record: CustomCardRecord) {
    this.restoreCustomCard(record);
  }

  removeCustomCard(id: string) {
    customCardsService.remove(id);
    const state = editorStore.getState();
    if (state.customCardId === id) {
      this.closeEditor();
    }
  }
}

export const editorService = new EditorService();
