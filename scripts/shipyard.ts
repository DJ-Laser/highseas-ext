let previousUrl = "";
const observer = new MutationObserver(function (mutations) {
  if (location.href !== previousUrl) {
    previousUrl = location.href;

    // When single page app URL changes
    onPageChange();
  }
});

const config = { subtree: true, childList: true };
observer.observe(document, config);

function onPageChange() {
  let path = window.location.pathname;
  console.log(`Hello, ${path}!`);
}

class CustomStorageEvent extends Event {
  key: string;
  value: string;

  constructor(key: string, value: string) {
    super("localStorageUpdated");

    this.key = key;
    this.value = value;
  }
}

const localStore = localStorage.setItem;
localStorage.setItem = function (key, value) {
  const event = new CustomStorageEvent(key, value);

  document.dispatchEvent(event);
  localStore.apply(this, [key, value]);
};

document.addEventListener("localStorageUpdated", (e) => {
  let event = e as CustomStorageEvent;
  console.log(`👉 localStorage.set('${event.key}', '${event.value}') updated`);
});

localStorage.setItem("sheeps", "400");

console.log("Hello, High Seas!");
console.log(localStorage);
