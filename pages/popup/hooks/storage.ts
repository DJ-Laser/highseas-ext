import { use } from "react";
import { type StorageKey, type StorageValue } from "../../../scripts/storage";

type StorageAreaName = "local" | "sync";
type StorageCache = {
  [K in StorageAreaName]: Promise<{
    [L in StorageKey]: StorageValue<L> | undefined
  }>
}

const storageItems: StorageCache = {
  local: browser.storage.local.get(null), sync: browser.storage.sync.get(null)
} as StorageCache;

function useStorageItem<K extends StorageKey>(key: K, areaName: StorageAreaName): StorageValue<K> | undefined {
  const initial = use(storageItems[areaName])[key];

  return initial;
}

export function useCacheItem<K extends StorageKey>(key: K): StorageValue<K> | undefined {
  return useStorageItem(key, "local");
}

export function useSyncItem<K extends StorageKey>(key: K): StorageValue<K> | undefined {
  return useStorageItem(key, "sync");
}
