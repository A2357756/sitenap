const switchEl = document.getElementById("switch");
const statusText = document.getElementById("status");

let isOn = false;

//syncState()在popup開啟時，向content.js要目前的狀態
function syncState() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {

        if (!tab) return;

        chrome.tabs.sendMessage(tab.id, { action: "getState" }, (res) => {

            if (chrome.runtime.lastError || !res) return;

            isOn = res.isOn;
            updateUI();
        });
    });
}

//抓使用者點擊開關的事件，並傳送訊息給content.js，讓content.js去切換遮罩狀態
switchEl.addEventListener("click", () => {

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {

        if (!tab) return;

        chrome.tabs.sendMessage(tab.id, { action: "toggle" }, (res) => {

            if (chrome.runtime.lastError || !res) return;

            isOn = res.isOn;
            updateUI();
        });
    });
});

//根據isOn的值，更新UI
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