import {
  type Message,
  type NullMessage,
  type SetFavoutitesMessage,
  type VisitedSiteMessage,
} from "./messaging";
import {
  EXT_NUM_DOUBLOONS_KEY,
  EXT_SHOP_ITEMS_KEY,
  FAVOURITE_ITEMS_KEY,
  getStorageItem,
  setCacheItem,
  setStorageItem,
  type ShopItem,
} from "./storage";

function updateStorage(key: string, value: string) {
  switch (key) {
    case FAVOURITE_ITEMS_KEY: {
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

      default: {
        console.log("Unknown internal message:");
        console.log(message);
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
      console.log("Unknown external message:");
      console.log(message);
    }
  }
});

async function handlevisitedSiteMessage(
  message: VisitedSiteMessage,
): Promise<SetFavoutitesMessage | NullMessage> {
  const cachedFavourites = await getStorageItem<string>(
    FAVOURITE_ITEMS_KEY,
    browser.storage.sync,
  );
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

  // eslint-disable-next-line no-constant-condition
  if (updateFavoutites || true) {
    return {
      id: "setFavourites",
      // If cachedFavourites was undefined we would skip this
      value: cachedFavourites!,
    };
  }

  return {
    id: "null",
  };
}
