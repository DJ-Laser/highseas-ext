function setupObservers(
  onPageChange: () => void,
  onStorageUpdated: (key: string, value: string) => void,
) {
  // Notify when the url of the single page app changes
  let previousUrl = "";
  const observer = new MutationObserver(function (mutations) {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      onPageChange();
    }
  });

  observer.observe(document, { subtree: true, childList: true });

  // Add hook to observe when localstorage is updated
  const localStore = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    localStore.apply(this, [key, value]);
    onStorageUpdated(key, value);
  };
}

setupObservers(
  // on url change
  () => {
    let path = window.location.pathname;
    console.log(`Hello, ${path}!`);
  },
  // on storage updated
  (key: string, value: string) => {
    console.log(`👉 localStorage.set('${key}', '${value}') updated`);
  },
);
