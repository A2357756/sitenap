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
    if (state.isOn && !mask) {
        showUI();
    }

    if (!state.isOn && mask) {
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
    if (mask) return;
    //建立一個區塊
    mask = document.createElement("div");
    //給這個區塊ID
    mask.id = "screen-veil-mask";

    //先把透明度設為0
    mask.style.opacity = "0";
    //把mask丟進body裡面
    document.body.appendChild(mask);
    //requestAnimationFrame強制等畫面更新再改透明度到1
    requestAnimationFrame(() => {
        //強制瀏覽器重新計算樣式，讓transition可以生效
        void mask.offsetWidth;
        mask.style.opacity = "1";
    });
}
function removeMask() {
    if (!mask) return;
    //製作一個el變數 把mask快照存起來，避免在transitionend事件裡面被remove掉
    const el = mask; // 🔥 freeze reference

    el.style.opacity = "0";

    const remove = () => {
        el.remove();
        if (mask === el) {
            mask = null;
        }
    };

    el.addEventListener("transitionend", remove, { once: true });

    // 🔥 fallback（避免 transitionend miss）
    setTimeout(remove, 300);
}

//製作&移除動畫 同遮罩邏輯 抓css進退場動畫
function createAnimation() {
    if (ani) return;

    ani = document.createElement("div");
    ani.id = "screen-veil-animation";

    document.body.appendChild(ani);

    requestAnimationFrame(() => {
        ani.classList.add("show");
    });
}
function removeAnimation() {
    if (!ani) return;

    ani.classList.remove("show");

    ani.addEventListener("transitionend", () => {
        if (ani) {
            ani.remove();
            ani = null;
        }
    }, { once: true });
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

// init抓本地儲存的狀態 有的話就覆蓋掉state，然後重新渲染畫面
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

// 全分頁同步 抓到storage的變化就會觸發onChanged事件，然後把新的值覆蓋掉state，並重新渲染畫面
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    if (changes.screenVeil) {
        state = changes.screenVeil.newValue;
        render();
    }
});