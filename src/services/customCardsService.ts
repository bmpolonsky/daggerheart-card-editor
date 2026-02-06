import type { TemplateCard } from "@/lib/api";
import type { CardFields, CardTypeId } from "@/lib/cardTypes";
import { customCardsStore } from "@/stores/customCards";

export type CustomCardRecord = {
  id: string;
  baseCard: TemplateCard | null;
  typeId: CardTypeId;
  cardFields: CardFields;
  customImage: string | null;
  selectedFeatureIndex: number;
  updatedAt: number;
};

const STORAGE_KEY = "card-creator:custom-cards";

const isBrowser = () => typeof window !== "undefined";

class CustomCardsService {
  private cache = new Map<string, CustomCardRecord>();
  private loaded = false;

  private ensureLoaded() {
    if (this.loaded || !isBrowser()) {
      this.loaded = true;
      return;
    }

    this.loaded = true;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      parsed.forEach((item) => {
        if (!item || typeof item.id !== "string") return;
        this.cache.set(item.id, item as CustomCardRecord);
      });
      this.notify();
    } catch {
      return;
    }
  }

  private persist() {
    if (!isBrowser()) return;
    const payload = Array.from(this.cache.values());
    if (payload.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  private notify() {
    const items = Array.from(this.cache.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    const lastUpdatedAt = items.length > 0 ? items[0].updatedAt : null;
    customCardsStore.update(() => ({ items, lastUpdatedAt }));
  }

  createId(typeId?: CardTypeId) {
    const base = `custom${typeId ? `-${typeId}` : ""}`;
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${Date.now().toString(36)}${suffix}`;
  }

  get(id: string) {
    this.ensureLoaded();
    return this.cache.get(id) ?? null;
  }

  list() {
    this.ensureLoaded();
    return Array.from(this.cache.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  upsert(record: CustomCardRecord) {
    this.ensureLoaded();
    this.cache.set(record.id, record);
    this.persist();
    this.notify();
  }

  remove(id: string) {
    this.ensureLoaded();
    if (!this.cache.has(id)) return;
    this.cache.delete(id);
    this.persist();
    this.notify();
  }
}

export const customCardsService = new CustomCardsService();
