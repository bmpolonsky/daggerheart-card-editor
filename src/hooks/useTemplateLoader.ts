import { useCallback, useEffect } from "preact/hooks";
import {
  fetchTemplateCollection,
  type TemplateCollectionResponse,
} from "@/lib/api";
import { templatesStore } from "@/stores/templates";

function applyTemplatePayload({ templateGroups, fetchedAt }: TemplateCollectionResponse) {
  templatesStore.update((prev) => {
    const nextExpanded: Record<string, boolean> = {};

    templateGroups.forEach((group, index) => {
      nextExpanded[group.id] = prev.expandedGroups[group.id] ?? index === 0;
    });

    return {
      ...prev,
      templateGroups,
      lastFetchedAt: fetchedAt,
      expandedGroups: nextExpanded,
    };
  });
}

export function useTemplateLoader() {
  const reload = useCallback(async () => {
    templatesStore.update((state) => ({
      ...state,
      isLoading: true,
      error: null,
    }));

    try {
      const data = await fetchTemplateCollection();
      applyTemplatePayload(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Неизвестная ошибка";
      templatesStore.update((state) => ({
        ...state,
        error: message,
      }));
    } finally {
      templatesStore.update((state) => ({
        ...state,
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { reload };
}
