import {
  type Message,
  type NullMessage,
  type SetFavoutitesMessage,
  type VisitedSiteMessage,
} from "./messaging";
import {
  EXT_CACHED_SHIPS_KEY,
  EXT_NUM_DOUBLOONS_KEY,
  EXT_SHOP_ITEMS_KEY,
  FAVOURITE_ITEMS_KEY,
  getFavouriteItems,
  getStorageItem,
  parseShipData,
  setCacheItem,
  setStorageItem,
  type ShipData,
  type ShopItem,
  type SourceShipData,
} from "./storage";

function updateStorage(key: string, value: string) {
  switch (key) {
    case FAVOURITE_ITEMS_KEY: {
      // Don't set favourites to undefined
      if (!value) break;
      setStorageItem(FAVOURITE_ITEMS_KEY, value, browser.storage.sync);
      break;
    }

    case "cache.shopItems": {
      const items = JSON.parse(value).value as Array<ShopItem>;
      const itemData = items.map<ShopItem>((item) => ({
        id: item.id,
        priceUs: item.priceUs,
        priceGlobal: item.priceGlobal,
      }));

      setCacheItem<ShopItem[]>(EXT_SHOP_ITEMS_KEY, itemData);
      break;
    }

    case "cache.personTicketBalance": {
      setCacheItem<number>(EXT_NUM_DOUBLOONS_KEY, JSON.parse(value).value);
      break;
    }

    case "cache.ships": {
      const rawShips: SourceShipData[] = JSON.parse(value).value;
      if (!rawShips) {
        console.log("Ship cache cleared");
        break;
      }

      const shipData = parseShipData(rawShips);
      console.log("Updating cached ship data: ", shipData);
      setCacheItem<ShipData[]>(EXT_CACHED_SHIPS_KEY, shipData);
      break;
    }
  }
}

browser.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    switch (message.id) {
      case "visitedSite": {
        handlevisitedSiteMessage(message).then((message) =>
          sendResponse(message),
        );
        return true;
      }

      case "storageUpdated": {
        updateStorage(message.key, message.value);
        break;
      }

      default: {
        console.error("Unknown internal message: ", message);
      }
    }
  },
);

browser.runtime.onMessageExternal.addListener((message: Message) => {
  switch (message.id) {
    case "storageUpdated": {
      updateStorage(message.key, message.value);
      break;
    }

    default: {
      console.error("Unknown external message: ", message);
    }
  }
});

async function handlevisitedSiteMessage(
  message: VisitedSiteMessage,
): Promise<SetFavoutitesMessage | NullMessage> {
  const cachedFavourites = await getFavouriteItems();
  let updateFavoutites = true;

  for (const [key, value] of message.localStorage) {
    if (key == FAVOURITE_ITEMS_KEY) {
      if (value == cachedFavourites) {
        updateFavoutites = false;
      }

      if (!cachedFavourites) {
        // No synced favoutites, set the current ones to be synced
        updateFavoutites = false;
      } else {
        // Don't set synced favourites to this, it might be outdates
        continue;
      }
    }

    updateStorage(key, value);
  }

  if (updateFavoutites || true) {
    return {
      id: "setFavourites",
      value: await getFavouriteItems() ?? "[]",
    };
  }

  return {
    id: "null",
  };
}
