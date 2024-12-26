import { sendMessage } from "./messaging";
import {
  FAVOURITE_ITEMS_KEY,
  getcurrentDoubloons,
  getShipData,
  getShopItems,
  type ShipData,
} from "./storage";
import { getDoubloonsPerHour, isShipShipped, truncateTo } from "./util";

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

let shipyardInterval: NodeJS.Timeout | null | undefined = null;

function injectPage() {
  const path = window.location.pathname;
  if (shipyardInterval) {
    clearInterval(shipyardInterval);
    shipyardInterval = null;
  }

  switch (path) {
    case "/shop":
      injectShop();
      break;
    case "/shipyard":
      shipyardInterval = undefined;
      getShipData().then((ships) => {
        // If there are no shipped ships, don't do anything
        if (ships.filter((ship) => isShipShipped(ship)).length == 0) return;
        injectShipyard(ships);

        // If its null, we canceled it before it could start, if its undefined, we havent switched yet
        if (shipyardInterval !== null) {
          shipyardInterval = setInterval(() => injectShipyard(ships), 10);
        }
      });
      break;
  }
}

const SHIP_DOUBLOONS_PREFIX = "DJLASER-doubloonsPerHour-shipped-ship-";
function injectDoubloonsPerHour(
  doubloonsElement: HTMLSpanElement,
  shipIdx: number,
  doubloonsPerHour: number,
) {
  const elementId = SHIP_DOUBLOONS_PREFIX + shipIdx;
  if (document.getElementById(elementId)) return;

  const doubloonsPerHourElement = document.createElement("span");
  doubloonsPerHourElement.innerText = `(${doubloonsPerHour} per hour)`;
  doubloonsElement.id = elementId;

  doubloonsElement.parentElement!.appendChild(doubloonsPerHourElement);
}

const SHIP_ESTIMATED_DOUBLOONS_PREFIX =
  "DJLASER-estimatedDoubloons-shipped-ship-";

const SHIPYARD_STATS_ID = "DJLASER-shipyard-stats";
const SHIPYARD_STATS_CLASSES =
  "rounded-lg bg-card text-card-foreground shadow-sm bg-blend-color-burn flex flex-col sm:gap-2 sm:flex-row items-start sm:items-center p-4 hover:bg-gray-100 transition-colors duration-200";

function injectStats(ships: ShipData[]) {
  if (document.getElementById(SHIPYARD_STATS_ID)) return;
  const doubloonsPerHour = getDoubloonsPerHour(ships);

  const shipContainerElement = (
    (document.getElementById("radix-:r0:-content-shipyard") ||
      document.getElementById("radix-:rd:-content-shipyard")) as HTMLDivElement
  ).children[0].children[1].children[3].children[0];

  const statsElement = document.createElement("div");
  statsElement.className = SHIPYARD_STATS_CLASSES;
  statsElement.id = SHIPYARD_STATS_ID;
  console.log(statsElement);

  shipContainerElement.insertBefore(
    statsElement,
    shipContainerElement.children[1],
  );
}

async function injectShipyard(ships: ShipData[]) {
  // If this is on the page, we don't need to re render
  if (
    document.getElementById(SHIP_DOUBLOONS_PREFIX + "0") ||
    document.getElementById(SHIP_ESTIMATED_DOUBLOONS_PREFIX + "0")
  )
    return;

  injectStats(ships);

  let shipIdx = -1;
  while (true) {
    shipIdx++;

    const maybeShip = document.getElementById(
      `shipped-ship-${shipIdx}-shipped`,
    );

    if (!maybeShip) break;
    const shipElement = maybeShip.children[0] as HTMLDivElement;
    const shipImage = (
      shipElement.querySelector("div > img") as HTMLImageElement
    ).src;

    const shipTitle = (
      shipElement.querySelectorAll("h2")[1] as HTMLHeadingElement
    ).innerText;

    // Ship doesn't have the data id in the html, so filter based on title and screenshot
    const matchingShips = ships.filter(
      (ship) => ship.title == shipTitle && ship.screenshotUrl == shipImage,
    );

    if (matchingShips.length == 0) {
      console.error(
        `No ships found with title: ${shipTitle} and screenshot: ${shipImage}`,
      );
      continue;
    } else if (matchingShips.length > 1) {
      console.error(
        `Found ${matchingShips.length} ships: ${shipTitle} and screenshot: ${shipImage}`,
      );
      continue;
    }

    const shipData = matchingShips[0];

    const doubloonsElement = shipElement.querySelector(
      "img[alt=doubloons] + span",
    ) as HTMLSpanElement | null;

    if (doubloonsElement && shipData.doubloonsPerHour) {
      injectDoubloonsPerHour(
        doubloonsElement,
        shipIdx,
        truncateTo(shipData.doubloonsPerHour, 10),
      );
    }
  }
}

async function injectShop() {
  const regionElement = document.getElementById("region-select")!
    .children[1] as HTMLSelectElement;
  // Region 1 is US, everywhere else uses global prices
  const useUsPrices = regionElement.value == "1";

  const shopElement = document.getElementById("harbor-tab-scroll-element")!;
  const items = shopElement.querySelectorAll("[id^='item_']");

  const [currentDoubloons, shopItems, ships] = await Promise.all([
    getcurrentDoubloons(),
    getShopItems(),
    getShipData(),
  ]);

  const doubloonsPerHour = getDoubloonsPerHour(ships);

  for (const item of items) {
    const itemData = shopItems.get(item.id);
    if (!itemData) continue;

    const itemPrice = useUsPrices ? itemData.priceUs : itemData.priceGlobal;
    if (itemPrice > currentDoubloons) {
      const doubloonsNeeded = itemPrice - currentDoubloons;
      const hoursLeft = doubloonsNeeded / doubloonsPerHour;
      const hoursFormatted =
        hoursLeft < 1 ? truncateTo(hoursLeft, 10) : Math.trunc(hoursLeft);

      const disabledButton = item.children[2].children[0] as HTMLButtonElement;
      disabledButton.innerText = `${hoursFormatted} hours to go`;
    }

    const hoursWorth = truncateTo(itemPrice / doubloonsPerHour, 10);

    const hoursText = item.children[0].children[3]
      .children[1] as HTMLSpanElement;
    hoursText.innerText = `(${hoursWorth} hours worth)`;
  }
}

sendVisitedMessage();
setupObservers(
  // on url change
  injectPage,
);
