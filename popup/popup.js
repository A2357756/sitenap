// Popup UI - 控制 Screen Veil 開關與同步狀態
const switchEl = document.getElementById("switch");
const statusText = document.getElementById("status");
const durationEl = document.getElementById("duration");
const durationValueEl = document.getElementById("duration-value");
const lockCheckbox = document.getElementById("lock-checkbox");

let isOn = false;
let endTime = null;
let countdownTimer = null;
let visualMode = "breathe";
let locked = false;

// 拖拉桿時即時更新旁邊顯示的數字
durationEl.addEventListener("input", () => {
    durationValueEl.textContent = durationEl.value;
});


// 問 content script 取得目前狀態
function syncState() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {

        chrome.tabs.sendMessage(tab.id, { action: "getState" }, (res) => {

            if (chrome.runtime.lastError || !res) {
                isOn = false;
                endTime = null;
                updateUI();
                return;
            }

            isOn = res.isOn;
            endTime = res.endTime || null;

            if (res.visualMode) {
            visualMode = res.visualMode;
            }

            // 開啟時把拉桿同步成目前正在跑的分鐘數，關閉時保留使用者上次選的值
            if (res.duration) {
                durationEl.value = String(res.duration);
                durationValueEl.textContent = String(res.duration);
            }
            if (typeof res.locked === "boolean") {
            locked = res.locked;
            lockCheckbox.checked = locked;
            }
            updateModeUI()
            updateUI();
        });
    });
}

// 點擊開關 → 切換開關
switchEl.addEventListener("click", () => {

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {

        // 只有從「關」切到「開」才需要帶 duration，關掉不需要
        const msg = isOn
            ? { action: "toggle" }
            : { action: "toggle", duration: parseInt(durationEl.value, 10) };
        chrome.tabs.sendMessage(tab.id, msg, (res) => {
            if (chrome.runtime.lastError || !res) return;
            isOn = res.isOn;
            endTime = res.endTime || null;
            updateUI();
        });
    });
});

//切換mode
const modeButtons = document.querySelectorAll(".mode-btn");
modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        const newMode = btn.dataset.mode;

        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            chrome.tabs.sendMessage(tab.id, { action: "setVisualMode", visualMode: newMode }, (res) => {
                if (chrome.runtime.lastError || !res) return;
                visualMode = res.visualMode;
                updateModeUI();
            });
        });
    });
});

function updateModeUI() {
    modeButtons.forEach((btn) => {
        if (btn.dataset.mode === visualMode) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

// 更新 UI 顯示
function updateUI() {
    if (isOn) {
        switchEl.classList.add("on");
        durationEl.disabled = true; // 倒數中不能改時間，避免邏輯打架
    } else {
        switchEl.classList.remove("on");
        durationEl.disabled = false;
    }

    updateCountdownText();
    startCountdownLoop();
}

// 每秒更新剩餘時間文字
function updateCountdownText() {
    if (!isOn || !endTime) {
        statusText.textContent = "Status: OFF";
        return;
    }

    const remainMs = Math.max(0, endTime - Date.now());
    const totalSec = Math.ceil(remainMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    statusText.textContent = `Status: ON (剩 ${mm}:${ss})`;
}

// popup 開著的時候，每秒重算一次倒數顯示；popup 關掉時瀏覽器會直接把這個 interval 清掉，不用擔心洩漏
function startCountdownLoop() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    if (!isOn) return;

    countdownTimer = setInterval(updateCountdownText, 1000);
}

lockCheckbox.addEventListener("change", () => {
    const newLocked = lockCheckbox.checked;

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, { action: "setLocked", locked: newLocked }, (res) => {
            if (chrome.runtime.lastError || !res) return;
            locked = res.locked;
            lockCheckbox.checked = locked;
        });
    });
});


syncState();