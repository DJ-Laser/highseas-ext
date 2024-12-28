import { Suspense } from "react";
import { EXT_CACHED_SHIPS_KEY } from "../../scripts/storage";
import { Ship } from "./components/Ship";
import { useCacheItem } from "./hooks/storage";

function Ships() {
  console.log("TESR");
  const ships = useCacheItem(EXT_CACHED_SHIPS_KEY) ?? [];
  console.log(ships);

  return (
    <div className="p-2 min-w-50">
      SHipsyard!!!
      {ships.map((ship) => (
        <Ship data={ship} key={ship.updates[0].id} />
      ))}
    </div>
  );
}

function App() {
  return (
    <Suspense fallback="Loading ships n stuff">
      <Ships />
    </Suspense>
  );
}

export default App;
