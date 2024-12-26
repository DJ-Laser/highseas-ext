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

export const EXT_CACHED_SHIPS_KEY = "cachedShips";

export async function getShipData(): Promise<ShipData[]> {
  return (await getCacheItem<ShipData[]>(EXT_CACHED_SHIPS_KEY)) ?? [];
}

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
  // The hours spent to get `totalDoubloons` (only includes paid out updates)
  // used for calculating doubloons per hour
  paidHours: number;
  totalDoubloons: number;
  // Null for non paid out initial ships or those that have 0 hours somehow
  doubloonsPerHour: number | null;
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
    let currentShip = ship;
    while (true) {
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

    const totalDoubloons = shipUpdates.reduce<number>(
      (total, ship) => total + ship.doubloonPayout,
      0,
    );

    const paidHours = shipUpdates.reduce<number>(
      (total, ship) => total + (ship.paidOut ? ship.credited_hours : 0),
      0,
    );

    const doubloonsPerHour =
      totalDoubloons > 0 && paidHours > 0 ? totalDoubloons / paidHours : null;

    ships.push({
      title: currentShip.title,
      paidHours,
      totalDoubloons,
      doubloonsPerHour,
      screenshotUrl: currentShip.screenshotUrl,
      deploymentUrl: currentShip.deploymentUrl,
      repoUrl: currentShip.repoUrl,
      updates: shipUpdates,
    });
  }

  return ships;
}
