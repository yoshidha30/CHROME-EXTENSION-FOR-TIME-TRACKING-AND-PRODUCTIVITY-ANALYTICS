let activeTabId = null;
let activeStartTime = null;

// Category classification (you can expand this)
const SITE_CATEGORIES = {
  "youtube.com": "unproductive",
  "facebook.com": "unproductive",
  "twitter.com": "unproductive",
  "gmail.com": "productive",
  "docs.google.com": "productive",
  "stackoverflow.com": "productive",
  "github.com": "productive",
  "w3schools.com": "productive",
  "instagram.com": "unproductive",
};

function getDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    return parts.slice(-2).join('.');
  } catch {
    return null;
  }
}

function trackSiteTime(domain, timeSpent, category) {
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  console.log(`Saving time: ${timeSpent.toFixed(2)} mins for domain: ${domain} under category: ${category}`);

  chrome.storage.local.get([today], (res) => {
    const todayData = res[today] || {
      productive: 0,
      unproductive: 0,
      neutral: 0,
      sites: {}
    };

    todayData.sites[domain] = (todayData.sites[domain] || 0) + timeSpent;

    if (category === "productive") todayData.productive += timeSpent;
    else if (category === "unproductive") todayData.unproductive += timeSpent;
    else todayData.neutral += timeSpent;

    chrome.storage.local.set({ [today]: todayData }, () => {
      console.log("Data saved for today:", todayData);
    });
  });
}

// Handle tab switch or browser activity
function handleTabChange(newTabId) {
  const now = Date.now();

  if (activeTabId !== null && activeStartTime !== null) {
    const timeSpentSeconds = Math.floor((now - activeStartTime) / 1000); // seconds
    if (timeSpentSeconds > 0) {
      const timeSpentMinutes = timeSpentSeconds / 60;
      chrome.tabs.get(activeTabId, (tab) => {
        if (chrome.runtime.lastError || !tab || !tab.url) return;
        const domain = getDomain(tab.url);
        if (!domain) return;

        const category = SITE_CATEGORIES[domain] || "neutral";
        trackSiteTime(domain, timeSpentMinutes, category);
      });
    }
  }

  activeTabId = newTabId;
  activeStartTime = now;
}

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  handleTabChange(activeInfo.tabId);
});

// Listen for tab updates (like URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === "complete") {
    handleTabChange(tabId);
  }
});

// When the window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    handleTabChange(null); // User left Chrome
  } else {
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
      if (tabs.length > 0) handleTabChange(tabs[0].id);
    });
  }
});

// On extension startup
chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) handleTabChange(tabs[0].id);
  });
});
