/**
  @typedef {import("../../scripts/messaging.ts").Message} Message
*/

const setStorage = localStorage.setItem;
localStorage.setItem = function (key, value) {
  setStorage.apply(this, [key, value]);
  onStorageChanged(key, value);
};

const extensionId = document.currentScript?.dataset.id;

/**
 *
 * @param {Message} message
 */
function sendMessage(message) {
  if (extensionId && chrome.runtime) {
    chrome.runtime.sendMessage(extensionId, message);
  } else {
    window.postMessage(message);
  }
}

/**
 * @param {string} key
 * @param {string} value
 */
function onStorageChanged(key, value) {
  sendMessage({
    id: "storageUpdated",
    key,
    value,
  });
}
