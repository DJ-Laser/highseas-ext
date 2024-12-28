import { Suspense } from "react";
import { EXT_CACHED_SHIPS_KEY } from "../../scripts/storage";
import { Ship } from "./components/Ship";
import { Stats } from "./components/Stats";
import { useCacheItem } from "./hooks/storage";

function Ships() {
  console.log("TESR");
  const ships = useCacheItem(EXT_CACHED_SHIPS_KEY) ?? [];

  return (
    <div className="p-2 animate-fade_in">
      <h2 className="mb-3 text-center text-2xl text-blue-500">Your Ships</h2>
      <Stats ships={ships} />
      {ships.map((ship) => (
        <div className="mt-3" key={ship.updates[0].id}>
          <Ship data={ship} />
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <Suspense>
      <Ships />
    </Suspense>
  );
}

export default App;
