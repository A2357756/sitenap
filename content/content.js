let state = {
    isOn: false,
    opacity: 0.85,
    animation: "pulse",
    duration: 5,     // 使用者選擇的持續分鐘數(預設5分鐘)
    endTime: null    // 這次開啟預計結束的絕對時間戳(ms)，沒開啟時為 null
};

let mask = null;
let ani = null;
let autoOffTimer = null; // 每個分頁各自的「時間到自動關閉」計時器


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

    // 每次 render 都重新校正「時間到自動關閉」的計時器
    scheduleAutoOff();
}

// 根據 state.endTime 排(或取消)自動關閉的計時器
// 這個函式是讓「多分頁同步」跟「倒數自動關」能一起運作的關鍵：
// 每個分頁各自根據同一個 endTime 算出剩餘時間，不依賴觸發那個分頁去通知別人
function scheduleAutoOff() {
    // 先清掉舊的計時器，避免重複觸發或跟新的計時器打架
    if (autoOffTimer) {
        clearTimeout(autoOffTimer);
        autoOffTimer = null;
    }

    if (!state.isOn || !state.endTime) return;

    const remaining = state.endTime - Date.now();

    if (remaining <= 0) {
        // 時間已經過了(例如分頁剛被喚醒、或跨分頁同步有時間差)，直接關閉
        setState({ isOn: false, endTime: null });
        return;
    }

    autoOffTimer = setTimeout(() => {
        setState({ isOn: false, endTime: null });
    }, remaining);
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

    const circle = document.createElement("div");
    circle.className = "pulse-circle";

    ani.appendChild(circle);
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
        if (!state.isOn) {
            // 關 → 開：用 popup 傳來的 duration(沒傳就用上次存的值)算出結束時間
            const minutes = msg.duration || state.duration;
            setState({
                isOn: true,
                duration: minutes,
                endTime: Date.now() + minutes * 60 * 1000
            });
        } else {
            // 開 → 關（手動關掉）：清掉 endTime，取消倒數
            setState({ isOn: false, endTime: null });
        }
        sendResponse({ isOn: state.isOn, endTime: state.endTime, duration: state.duration });
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
        setState({ isOn: false, endTime: null });
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