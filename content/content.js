let state = {
    isOn: false,
    opacity: 0.85,
    animation: "pulse",
    duration: 5,     // 使用者選擇的持續分鐘數(預設5分鐘)
    endTime: null ,   // 這次開啟預計結束的絕對時間戳(ms)，沒開啟時為 null
    visualMode: "breathe", // 視覺模式，預設為呼吸燈模式，另一個選項是貓咪模式
    locked: false
};

let countdownEl = null;
let countdownInterval = null;
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

// render底下的兩個方法，分別是顯示UI和隱藏UI
function showUI() {
    if (!mask) createMask();
    if (!ani) createAnimation();
    if (!countdownEl) createCountdown();
}

function hideUI() {
    removeMask();
    removeAnimation();
    removeCountdown();
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
    const el = mask; // 凍結參照，避免外層 mask 被改成 null 之後這裡還在用舊的
    requestAnimationFrame(() => {
        if (!el.isConnected) return; // 如果這個元素已經被移除了，就不要再對它做任何操作
        void el.offsetWidth;
        el.style.opacity = "1";
    });
}
function removeMask() {
    if (!mask) return;
    const el = mask;
    mask = null;
    el.style.opacity = "0";
    const remove = () => {
        el.remove();
    };
    el.addEventListener("transitionend", remove, { once: true });
    setTimeout(remove, 300);
}

//製作&移除動畫 同遮罩邏輯 抓css進退場動畫
function createAnimation() {
    if (ani) return;
    ani = document.createElement("div");
    ani.id = "screen-veil-animation";
    let child;
    if (state.visualMode === "breathe") {
        child = document.createElement("div");
        child.className = "pulse-circle";

        const ring = document.createElement("div");
        ring.className = "spinner-ring";
        child.appendChild(ring);
    }
    if (state.visualMode === "cloud") {
        child = document.createElement("div");
        child.className = "cloud-wrap";
        child.innerHTML = `<svg viewBox="0 0 680 340" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="340" cy="270" rx="150" ry="14" fill="#e8e3da"/>
    <g class="cloud-body">
    <path d="M250 220 C220 220, 200 198, 210 172 C216 155, 235 148, 250 152 C252 128, 275 110, 300 112 C320 114, 337 128, 342 148 C358 130, 388 128, 405 145 C418 158, 418 178, 405 190 C425 192, 440 208, 435 226 C430 244, 408 252, 390 244 C378 250, 260 250, 250 244 C235 240, 232 226, 250 220 Z"
            fill="#eef0f3" stroke="#a9adb5" stroke-width="2" stroke-linejoin="round"/>
    <path d="M285 186 Q295 194, 305 186" fill="none" stroke="#6b6e75" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M335 186 Q345 194, 355 186" fill="none" stroke="#6b6e75" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M310 205 Q320 213, 330 205" fill="none" stroke="#6b6e75" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="278" cy="205" rx="10" ry="6" fill="#f3c9c9" opacity="0.7"/>
    <ellipse cx="362" cy="205" rx="10" ry="6" fill="#f3c9c9" opacity="0.7"/>
    </g>
    <g class="cloud-zzz" style="animation-delay:0s"><text x="410" y="130" fill="#9a9da3" font-size="18" font-family="sans-serif" font-weight="600">z</text></g>
    <g class="cloud-zzz" style="animation-delay:1.05s"><text x="432" y="105" fill="#9a9da3" font-size="24" font-family="sans-serif" font-weight="600">Z</text></g>
    <g class="cloud-zzz" style="animation-delay:2.1s"><text x="460" y="75" fill="#9a9da3" font-size="30" font-family="sans-serif" font-weight="600">Z</text></g>
    </svg>`;
    }
    if (state.visualMode === "cat") {
    child = document.createElement("img");
    child.src = chrome.runtime.getURL("assets/cat_playing.svg");
    child.className = "cat-img";
    }
    ani.appendChild(child);
    document.body.appendChild(ani);
    requestAnimationFrame(() => {
        ani.classList.add("show");
    });
}
function removeAnimation(callback) {
    if (!ani) return;
    const el = ani; // 凍結參照，避免被之後新建立的 ani 覆蓋
    ani = null; // 🔑 立刻歸零

    el.classList.remove("show");

    el.addEventListener("transitionend", () => {
        el.remove();
        if (callback) { callback(); }
    }, { once: true });
}

//新增&移除倒數計時器
function createCountdown() {
    if (countdownEl) return;
    countdownEl = document.createElement("div");
    countdownEl.id = "screen-veil-countdown";
    document.body.appendChild(countdownEl);
    updateCountdownText();
    countdownInterval = setInterval(updateCountdownText, 1000);
}
function removeCountdown() {
    if (countdownEl) {
        countdownEl.remove();
        countdownEl = null;
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}
function updateCountdownText() {
    if (!countdownEl || !state.endTime) return;
    const remainMs = Math.max(0, state.endTime - Date.now());
    const totalSec = Math.ceil(remainMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    countdownEl.textContent = `${mm}:${ss}`;
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
            if (state.locked){
                sendResponse({ isOn: state.isOn, endTime: state.endTime, duration: state.duration });
                {return;} // 如果是鎖定狀態，就不允許手動關掉
            }
            // 開 → 關（手動關掉）：清掉 endTime，取消倒數
            setState({ isOn: false, endTime: null });
        }
        sendResponse({ isOn: state.isOn, endTime: state.endTime, duration: state.duration });
    }
    //如果是詢問狀態(getState)回傳state給popup.js(只有初始化會問)
    if (msg.action === "getState") {
        sendResponse(state);
    }
    //如果是變更動作(visualMode)
    if (msg.action === "setVisualMode") {
        setState({ visualMode: msg.visualMode });
        switchVisualMode();
        sendResponse({ visualMode: state.visualMode });
    }
    if (msg.action === "setLocked") {
        if (state.isOn && state.locked && msg.locked === false) {
            sendResponse({ locked: state.locked });
            return;} 
        setState({ locked: msg.locked });
        sendResponse({ locked: state.locked });
    }
}); 

function switchVisualMode() {
    if (!ani) {
        return;
    }
    removeAnimation(function() {
        createAnimation();
    });
}


// init抓本地儲存的狀態 有的話就覆蓋掉state，然後重新渲染畫面
chrome.storage.local.get(["screenVeil"], (result) => {
    if (result.screenVeil) {
        state = result.screenVeil;
    }
    render();
});

// 抓escape鍵，按下去就呼叫setState把isOn改成false，然後就會觸發render去關掉UI
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.isOn && !state.locked) {
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

// 滑鼠滾輪事件，當mask存在時，阻止滾動
document.addEventListener("wheel", (e) => {
    if (mask) {
        e.preventDefault();
    }
}, { passive: false });