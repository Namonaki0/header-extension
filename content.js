const headerColors = {
  h1: "rgb(228, 50, 50)",
  h2: "rgb(52, 118, 198)",
  h3: "rgb(20, 194, 87)",
  h4: "rgb(231, 162, 23)",
  h5: "rgb(171, 143, 218)",
  h6: "rgb(1, 89, 152)",
};

const defaultSettings = {
  h1: false,
  h2: false,
  h3: false,
  h4: false,
  h5: false,
  h6: false,
};

function applyHighlights(settings) {
  Object.entries(headerColors).forEach(([type, color]) => {
    const elements = document.querySelectorAll(type);

    elements.forEach((el) => {
      el.style.backgroundColor = settings[type] ? color : "";
    });
  });
}

function loadAndApplyHighlights() {
  chrome.storage.local.get(defaultSettings, (settings) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Failed to load highlight settings:",
        chrome.runtime.lastError,
      );
      return;
    }

    applyHighlights(settings);
  });
}

function getHeaderCount(type) {
  return document.querySelectorAll(type).length;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === "getCount") {
    sendResponse({ count: getHeaderCount(message.type) });
    return;
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  loadAndApplyHighlights();
});

loadAndApplyHighlights();

let refreshTimeout;

const observer = new MutationObserver(() => {
  clearTimeout(refreshTimeout);
  refreshTimeout = setTimeout(() => {
    loadAndApplyHighlights();
  }, 100);
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
