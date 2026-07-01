// Popup UI - 控制 Screen Veil 開關與同步狀態
const switchEl = document.getElementById("switch");
const statusText = document.getElementById("status");

let isOn = false;


// 問 content script 取得目前狀態
function syncState() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {

        chrome.tabs.sendMessage(tab.id, { action: "getState" }, (res) => {

            if (chrome.runtime.lastError || !res) {
                isOn = false;
                updateUI();
                return;
            }

            isOn = res.isOn;
            updateUI();
        });
    });
}

// 點擊開關 → 切換狀態
switchEl.addEventListener("click", () => {

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {

        chrome.tabs.sendMessage(tab.id, { action: "toggle" }, (res) => {

            if (chrome.runtime.lastError || !res) return;

            isOn = res.isOn;
            updateUI();
        });
    });
});

// 更新 UI 顯示
function updateUI() {
    if (isOn) {
        switchEl.classList.add("on");
        statusText.textContent = "Status: ON";
    } else {
        switchEl.classList.remove("on");
        statusText.textContent = "Status: OFF";
    }
}



syncState();