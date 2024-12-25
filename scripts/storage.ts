export async function getStorageItem<T>(
  key: string,
  storage: browser.storage.StorageArea,
): Promise<T | undefined> {
  return (await storage.get(key))[key];
}

export async function setStorageItem<T>(
  key: string,
  value: T,
  storage: browser.storage.StorageArea,
): Promise<void> {
  await storage.set({
    [key]: value,
  });
}

export async function getCacheItem<T>(key: string): Promise<T | undefined> {
  return await getStorageItem(key, browser.storage.local);
}

export async function setCacheItem<T>(key: string, value: T): Promise<void> {
  await setStorageItem(key, value, browser.storage.local);
}

export const FAVOURITE_ITEMS_KEY = "favouriteItems";

export const EXT_SHOP_ITEMS_KEY = "shopItems";
export interface ShopItem {
  id: string;
  priceUs: number;
  priceGlobal: number;
}

export async function getShopItems(): Promise<Map<string, ShopItem>> {
  const items = await getCacheItem<ShopItem[]>(EXT_SHOP_ITEMS_KEY);
  const map = new Map<string, ShopItem>();
  if (!items) return map;

  for (const item of items) {
    map.set(item.id, item);
  }

  return map;
}

export const EXT_NUM_DOUBLOONS_KEY = "numDoubloons";
export async function getcurrentDoubloons(): Promise<number> {
  return (await getCacheItem<number>(EXT_NUM_DOUBLOONS_KEY)) ?? 0;
}
