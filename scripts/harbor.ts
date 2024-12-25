function setupObservers(onPageChange: () => void) {
  // Notify when the url of the single page app changes
  let previousUrl = "";
  const observer = new MutationObserver(function (mutations) {
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

function getLocalStorage(): Map<string, string> {
  let pairs = new Map<string, string>();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    pairs.set(key, localStorage[key]);
  }

  return pairs;
}

setupObservers(
  // on url change
  () => {
    let path = window.location.pathname;
    console.log(`Hello, ${path}!`);
  },
);

sendMessage({
  id: "visitedSite",
  localStorage: getLocalStorage(),
});
