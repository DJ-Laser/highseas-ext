import type { ShipData } from "./storage";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDoubloonsPerHour(ships: ShipData[]) {
  const totalDoubloons = ships.reduce<number>(
    (total, ship) => total + ship.totalDoubloons,
    0,
  );

  const totalPaidHours = ships.reduce<number>(
    (total, ship) => total + ship.paidHours,
    0,
  );

  return totalDoubloons / totalPaidHours;
}
