import { getStorageItem, type StorageKey, type StorageValue } from "../../../scripts/storage";
import { suspend } from "suspend-react";

type storageAreaName = "local" | "sync";

//browser.storage.onChanged.addListener((changes, areaName) => { });

function useStorageItem<K extends StorageKey>(key: K, areaName: storageAreaName): StorageValue<K> | undefined {
  const initial = suspend(() => getStorageItem(key, browser.storage[areaName]), [key, areaName])

  return initial;
}

export function useCacheItem<K extends StorageKey>(key: K): StorageValue<K> | undefined {
  return useStorageItem(key, "local");
}

export function useSyncItem<K extends StorageKey>(key: K): StorageValue<K> | undefined {
  return useStorageItem(key, "sync");
}
