let state = {
    isOn: false,
    opacity: 0.85,
    animation: "pulse"
};

let mask = null;
let ani = null;


function setState(partial) {
    // 用...展開運算子，將partial的值覆蓋到state上
    state = {
        ...state,
        ...partial
    };
    //呼叫render渲染畫面
    render();
    //呼叫syncStorage同步到storage
    syncStorage();
}


// 讀取state 決定要不要開UI
function render() {
    if (state.isOn) {
        showUI();
    } else {
        hideUI();
    }
}

// render底下的兩個方法，分別是顯示UI和隱藏UI
function showUI() {
    if (!mask) createMask();
    if (!ani) createAnimation();
}

function hideUI() {
    removeMask();
    removeAnimation();
}

//製作&移除遮罩
function createMask() {
    //建立一個區塊
    mask = document.createElement("div");
    //給這個區塊ID
    mask.id = "screen-veil-mask";
    //把mask丟進body裡面
    document.body.appendChild(mask);
    //requestAnimationFrame強制等畫面更新再改透明度
    requestAnimationFrame(() => {
        mask.style.opacity = state.opacity;
    });
}
function removeMask() {
    if (!mask) return;
    mask.remove();
    mask = null;
}

//製作&移除動畫
function createAnimation() {
    ani = document.createElement("div");
    ani.id = "screen-veil-animation";
    document.body.appendChild(ani);
}
function removeAnimation() {
    if (!ani) return;
    ani.remove();
    ani = null;
}

// 同步到 storage(儲存在本地電腦的永久記憶體)
function syncStorage() {
    chrome.storage.local.set({ screenVeil: state });
}

// 讀取popup message
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    //如果是切換開關(toggle)處理setState順便回傳最新的state給popup.js，讓popup.js更新UI
    if (msg.action === "toggle") {
        setState({ isOn: !state.isOn });
        sendResponse({ isOn: state.isOn });
    }
    //如果是詢問狀態(getState)回傳state給popup.js(只有初始化會問)
    if (msg.action === "getState") {
        sendResponse(state);
    }
}); 

// 抓本地儲存的狀態 有的話就覆蓋掉state，然後重新渲染畫面
chrome.storage.local.get(["screenVeil"], (result) => {
    if (result.screenVeil) {
        state = result.screenVeil;
    }
    render();
});

// 抓escape鍵，按下去就呼叫setState把isOn改成false，然後就會觸發render去關掉UI
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.isOn) {
        setState({ isOn: false });
    }
});