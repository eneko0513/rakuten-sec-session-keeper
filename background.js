let intervalMin = 10;
let paused = false;
let remaining = intervalMin * 60;
let history = [];

const log = (...args) => console.log("[rakuten-session]", ...args);

function addHistory(ok, reason) {
  const time = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  history.unshift({ ok, reason, time });
  if (history.length > 5) history.pop();
  log("history:", ok ? "✅" : "❌", reason);
}

function updateBadge() {
  if (paused) {
    chrome.action.setBadgeText({ text: "||" });
    chrome.action.setBadgeBackgroundColor({ color: "#888" });
  } else {
    chrome.action.setBadgeText({ text: String(remaining) });
    chrome.action.setBadgeBackgroundColor({ color: remaining <= 10 ? "#e44" : "#2a2" });
  }
}

async function doAction() {
  const [tab] = await chrome.tabs.query({ url: "https://member.rakuten-sec.co.jp/*", status: "complete" });
  if (!tab) {
    addHistory(false, "タブが見つかりません");
    return;
  }
  const isLoggedOut = tab.url.includes("login") || !tab.url.includes("member.rakuten-sec.co.jp/app/");
  if (isLoggedOut) {
    addHistory(false, "ログアウト状態");
    return;
  }
  log("clickLogo -> tabId:", tab.id);
  chrome.tabs.sendMessage(tab.id, { type: "clickLogo" });
  addHistory(true, "クリック実行");
}

chrome.storage.local.get({ intervalMin: 10 }, (s) => {
  intervalMin = s.intervalMin;
  remaining = intervalMin * 60;
  log("起動: intervalMin =", intervalMin);
  updateBadge();
});

setInterval(() => {
  if (paused) return;
  remaining--;
  if (remaining <= 0) {
    remaining = intervalMin * 60;
    log("インターバル経過 -> doAction");
    doAction();
  }
  updateBadge();
}, 1000);

// Service Workerを生かし続ける（20秒ごとにstorageアクセス）
setInterval(() => chrome.storage.local.get("intervalMin"), 20000);

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  log("onMessage:", msg.type, msg);
  if (msg.type === "togglePause") {
    paused = !paused;
    log("togglePause -> paused:", paused, "remaining:", remaining);
    updateBadge();
    reply({});
    return true;
  }
  if (msg.type === "saveInterval") {
    intervalMin = msg.intervalMin;
    remaining = intervalMin * 60;
    chrome.storage.local.set({ intervalMin });
    log("saveInterval -> intervalMin:", intervalMin, "remaining:", remaining);
    updateBadge();
    reply({});
    return true;
  }
  if (msg.type === "getState") {
    log("getState -> paused:", paused, "intervalMin:", intervalMin);
    reply({ paused, intervalMin, history });
    return true;
  }
});
