import type { ShipData } from "../../../scripts/storage";
import { Ship } from "./Ship";
import { Stats } from "./Stats";

export function ShipsOverview({ ships }: { ships: ShipData[] }) {
  return (
    <>
      <Stats ships={ships} />
      {ships.map((ship) => (
        <div className="mt-3" key={ship.updates[0].id}>
          <Ship data={ship} />
        </div>
      ))}
    </>
  );
}
