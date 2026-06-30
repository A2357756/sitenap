let mask = null;
let isOn = false;

//創造遮罩函式
function createMask() {
    mask = document.createElement("div");
    mask.id = "screen-veil-mask";
    mask.innerText = "SCREEN VEIL";
    document.body.appendChild(mask);

    requestAnimationFrame(() => {
        mask.style.opacity = "1";
    });
}

//關閉遮罩函式
function removeMask() {
    if (!mask) return;

    mask.style.opacity = "0";

    setTimeout(() => {
        if (mask) {
            mask.remove();
            mask = null;
        }
    }, 250);
}

//更新狀態並同步 UI + storage
function setState(state) {
    isOn = state;

    if (isOn) {
        if (!mask) createMask();
    } else {
        removeMask();
    }
    // 存到 chrome storage
    chrome.storage.local.set({ screenVeil: isOn });
}

// ESC 關閉
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOn) {
        setState(false);
    }
});

//接收popup指令判斷回傳
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "toggle") {
        setState(!isOn);
        sendResponse({ isOn });
    }

    if (msg.action === "getState") {
        sendResponse({ isOn });
    }
});

// 初始化：讀取 storage 狀態
chrome.storage.local.get(["screenVeil"], (result) => {
    if (result.screenVeil) {
        setState(true);
    }

    console.log("content script loaded");
});