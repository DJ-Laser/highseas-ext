import { sendMessage } from "./messaging";
import {
  FAVOURITE_ITEMS_KEY,
  getcurrentDoubloons,
  getShopItems,
} from "./storage";

function setupObservers(onPageChange: () => void) {
  window.addEventListener("load", function () {
    // Run it once when page loads
    onPageChange();
  });

  // Notify when the url of the single page app changes
  let previousUrl = "";
  const observer = new MutationObserver(function () {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      onPageChange();
    }
  });

  observer.observe(document, { subtree: true, childList: true });

  // Inject script to observe when localstorage is updated
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("scripts/storageListener.js");
  script.dataset.id = chrome.runtime.id;
  script.onload = function () {
    (this as HTMLScriptElement).remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

function getLocalStorage(): [string, string][] {
  const pairs: [string, string][] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    pairs.push([key, localStorage[key]]);
  }

  return pairs;
}

async function sendVisitedMessage() {
  const response: Message = await sendMessage({
    id: "visitedSite",
    localStorage: getLocalStorage(),
  });

  if (response.id == "setFavourites") {
    localStorage.setItem(FAVOURITE_ITEMS_KEY, response.value);
  }
}

function injectPage() {
  const path = window.location.pathname;
  switch (path) {
    case "/shop":
      injectShop();
  }
}

async function injectShop() {
  const regionElement = document.getElementById("region-select")!
    .children[1] as HTMLSelectElement;
  // Region 1 is US, everywhere else uses global prices
  const useUsPrices = regionElement.value == "1";

  const shopElement = document.getElementById("harbor-tab-scroll-element")!;
  const items = shopElement.querySelectorAll("[id^='item_']");

  const currentDoubloons = await getcurrentDoubloons();
  const shopItems = await getShopItems();

  for (const item of items) {
    const itemData = shopItems.get(item.id);
    if (!itemData) continue;

    const itemPrice = useUsPrices ? itemData.priceUs : itemData.priceGlobal;
    let text;

    if (itemPrice > currentDoubloons) {
      const fraction = currentDoubloons / itemPrice;
      const percent = Math.trunc(fraction * 100);
      text = `Progress: ${percent}% (${itemPrice - currentDoubloons} doubloons to go)`;
    } else {
      text = `Would leave you with ${currentDoubloons - itemPrice} doubloons`;
    }

    const hoursText = item.children[0].children[3]
      .children[1] as HTMLSpanElement;

    hoursText.innerText = text;
  }
}

sendVisitedMessage();
setupObservers(
  // on url change
  injectPage,
);
