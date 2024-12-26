import type { ShipData } from "./storage";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncateTo(num: number, factor: number) {
  return Math.trunc(num * factor) / factor;
}

export function getTotalDoubloons(ships: ShipData[]): number {
  return ships.reduce<number>((total, ship) => total + ship.totalDoubloons, 0);
}

export function getTotalHours(ships: ShipData[]): number {
  return ships.reduce<number>((total, ship) => total + ship.paidHours, 0);
}

export function getDoubloonsPerHour(ships: ShipData[]): number {
  return getTotalDoubloons(ships) / getTotalHours(ships);
}

// True if a ship was ever shipped, even if there are draft updates
export function isShipShipped(ship: ShipData) {
  for (const update of ship.updates) {
    if (update.shipStatus == "shipped") return true;
  }

  return false;
}
