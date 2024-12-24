browser.action.onClicked.addListener(function () {
  browser.tabs.create({ url: "pages/landing.html" });
});
