chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "whoAmI") {
        sendResponse({ tabId: sender.tab.id });
    }
});