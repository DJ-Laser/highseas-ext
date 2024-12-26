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

export const EXT_SHIPS_KEY = "currentShips";
type ShipStatus = "shipped" | "staged";

export interface SourceShipData {
  id: string;
  title: string;
  credited_hours: number;
  total_hours: number;
  paidOut: boolean;
  doubloonPayout: number | undefined;
  shipStatus: ShipStatus;
  reshippedFromId: string | null;
  reshippedToId: string | null;
  screenshotUrl: string;
  deploymentUrl: string;
  repoUrl: string;
}

interface ShipUpdate {
  id: string;
  credited_hours: number;
  shipStatus: ShipStatus;
  doubloonPayout: number;
  paidOut: boolean;
}

export interface ShipData {
  title: string;
  total_hours: number;
  totalDoubloons: number;
  screenshotUrl: string;
  deploymentUrl: string;
  repoUrl: string;
  updates: ShipUpdate[];
}

export function parseShipData(sourceData: SourceShipData[]): ShipData[] {
  const sourceMap = new Map<string, SourceShipData>();
  for (const ship of sourceData) {
    sourceMap.set(ship.id, ship);
  }

  const ships: ShipData[] = [];
  for (const ship of sourceMap.values()) {
    // This is an update to a previous ship
    if (ship.reshippedFromId !== null) continue;

    const shipUpdates: ShipUpdate[] = [];
    let totalDoubloons = 0;
    let currentShip = ship;
    while (true) {
      totalDoubloons += currentShip.doubloonPayout ?? 0;
      shipUpdates.push({
        id: currentShip.id,
        credited_hours: currentShip.credited_hours,
        shipStatus: currentShip.shipStatus,
        doubloonPayout: currentShip.doubloonPayout ?? 0,
        paidOut: currentShip.paidOut,
      });

      // This is the latest ship in the update chain, use it to get the mian ship values
      if (!currentShip.reshippedToId) break;
      const maybeShip = sourceMap.get(currentShip.reshippedToId);

      if (!maybeShip) {
        console.error(
          `Could not find ship id ${currentShip.reshippedToId}, required by ship ${currentShip.id}`,
        );
        // This is the latest ship in the chain before lookup failed, so use this one
        break;
      } else {
        currentShip = maybeShip;
      }
    }

    ships.push({
      title: currentShip.title,
      totalDoubloons: totalDoubloons,
      total_hours: currentShip.total_hours,
      screenshotUrl: currentShip.screenshotUrl,
      deploymentUrl: currentShip.deploymentUrl,
      repoUrl: currentShip.repoUrl,
      updates: shipUpdates,
    });
  }

  return ships;
}
