export type Message =
  | VisitedSiteMessage
  | StorageUpdatedMessage
  | SetFavoutitesMessage
  | InjectUpdatedDataMessage
  | NullMessage;

export type SendResponse = (respose: Message) => void;
export async function sendMessage(
  message: Message,
  options?: browser.runtime._SendMessageOptions,
) {
  return await browser.runtime.sendMessage(message, options);
}

export interface NullMessage {
  id: "null";
}

export interface VisitedSiteMessage {
  id: "visitedSite";
  localStorage: [string, string][];
}

export interface SetFavoutitesMessage {
  id: "setFavourites";
  value: string;
}

export interface StorageUpdatedMessage {
  id: "storageUpdated";
  key: string;
  value: string;
}

export interface InjectUpdatedDataMessage {
  id: "InjectUpdatedData";
}
