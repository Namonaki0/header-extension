const defaultSettings = {
  h1: false,
  h2: false,
  h3: false,
  h4: false,
  h5: false,
  h6: false,
};

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab;
}

async function getSettings() {
  return await chrome.storage.local.get(defaultSettings);
}

async function setSetting(type, value) {
  await chrome.storage.local.set({ [type]: value });
}

async function resetSettings() {
  await chrome.storage.local.set(defaultSettings);
}

async function getCount(tabId, type) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: "getCount",
      type,
    });

    return response?.count ?? 0;
  } catch (error) {
    console.error(`Could not get count for ${type}:`, error);
    return 0;
  }
}

async function updateAllCounts(tabId) {
  const rows = document.querySelectorAll(".container[data-type]");

  for (const row of rows) {
    const type = row.dataset.type;
    const countSpan = row.querySelector(".headers-count span");
    const checkbox = row.querySelector('input[type="checkbox"]');

    if (!type || !countSpan) continue;

    const count = await getCount(tabId, type);
    countSpan.textContent = count;

    if (count == 0) {
      checkbox.checked = false;
      checkbox.disabled = true;
      row.classList.add("disabled");
      await setSetting(type, false);
    } else {
      checkbox.disabled = false;
      row.classList.remove("disabled");
    }
  }
}

async function syncCheckboxesFromStorage() {
  const settings = await getSettings();
  const rows = document.querySelectorAll(".container[data-type]");

  for (const row of rows) {
    const type = row.dataset.type;
    const checkbox = row.querySelector('input[type="checkbox"]');

    if (!type || !checkbox) continue;

    checkbox.checked = settings[type];
  }
}

async function init() {
  const tab = await getActiveTab();
  if (!tab?.id) return;

  const settings = await getSettings();
  const rows = document.querySelectorAll(".container[data-type]");
  const resetButton = document.querySelector(".reset-container button");

  for (const row of rows) {
    const type = row.dataset.type;
    const checkbox = row.querySelector('input[type="checkbox"]');
    const countSpan = row.querySelector(".headers-count span");

    if (!type || !checkbox || !countSpan) continue;

    checkbox.checked = settings[type];

    checkbox.addEventListener("change", async (e) => {
      await setSetting(type, e.target.checked);
      await updateAllCounts(tab.id);
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", async () => {
      await resetSettings();
      await syncCheckboxesFromStorage();
      await updateAllCounts(tab.id);
    });
  }

  await updateAllCounts(tab.id);
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => {
    console.error("Popup init failed:", error);
  });
});
