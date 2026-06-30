// Popup UI - 控制 Screen Veil 開關與同步狀態
const switchEl = document.getElementById("switch");
const statusText = document.getElementById("status");

let isOn = false;

// 問 content script 取得目前狀態
async function syncState() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: "getState" }, (res) => {
        if (!res) return;
        isOn = res.isOn;
        updateUI();
    });
}
// 點擊開關 → 切換狀態
switchEl.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: "toggle" }, (res) => {
        if (!res) return;
        isOn = res.isOn;
        updateUI();
    });
});

// 更新 UI 顯示
function updateUI() {
    console.log("updateUI");
    console.log("isOn =", isOn);

    if (isOn) {
        console.log("add on");
        switchEl.classList.add("on");
        statusText.textContent = "Status: ON";
    } else {
        console.log("remove on");
        switchEl.classList.remove("on");
        statusText.textContent = "Status: OFF";
    }
}

syncState();