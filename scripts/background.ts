import type { Message } from "./types";
function updateStorage() {}

browser.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    switch (message.id) {
      case "visitedSite": {
      }
    }
  },
);
