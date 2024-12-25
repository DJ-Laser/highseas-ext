export type Message = VisitedSiteMessage | StorageUpdatedMessage;

export async function sendMessage(
  message: Message,
  options?: browser.runtime._SendMessageOptions,
) {
  await browser.runtime.sendMessage(message, options);
}

interface BaseMessage {
  id: string;
}

interface VisitedSiteMessage {
  id: "visitedSite";
  localStorage: Map<string, string>;
}

interface StorageUpdatedMessage {
  id: "storageUpdated";
  key: string;
  value: string;
}
