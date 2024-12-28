import type { ShipData } from "../../../scripts/storage";
import { Card } from "./generic/Card";

export interface ShipProps {
  data: ShipData;
}

export function Ship({ data }: ShipProps) {
  return (
    <Card>
      <img
        className="object-cover w-8 h-8 rounded"
        src={data.screenshotUrl}
        alt={`Screenshot of ${data.title}`}
      />
      <h2>ship.title</h2>
    </Card>
  );
}
