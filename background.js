chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "whoAmI") {
        sendResponse({ tabId: sender.tab.id });
    }
});
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.remove(`sitenap_${tabId}`);
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(null, (all) => {
        const staleKeys = Object.keys(all).filter((k) => !k.startsWith("sitenap_"));
        chrome.storage.local.remove(staleKeys);
    });
});