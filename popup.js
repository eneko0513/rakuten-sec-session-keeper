const log = (...args) => console.log("[popup]", ...args);
const btn = document.getElementById("btn");
const sel = document.getElementById("interval");
const status = document.getElementById("status");

chrome.tabs.query({ url: "https://member.rakuten-sec.co.jp/*" }, (tabs) => {
  const msg = tabs.length > 0 ? "✅ タブ検出済み" : "⚠️ タブが見つかりません";
  status.textContent = msg;
  log("タブ確認:", msg);
});

chrome.runtime.sendMessage({ type: "getState" }, ({ paused, intervalMin, history }) => {
  log("getState ->", paused, intervalMin);
  btn.textContent = paused ? "▶ 再開" : "⏸ 一時停止";
  sel.value = intervalMin;
  const hist = document.getElementById("history");
  hist.innerHTML = history.length === 0 ? "<div style='color:#aaa'>履歴なし</div>"
    : history.map(h => `<div>${h.ok ? "✅" : "❌"} ${h.time} ${h.reason}</div>`).join("");
});

document.getElementById("save").addEventListener("click", () => {
  log("save clicked, intervalMin:", sel.value);
  chrome.runtime.sendMessage({ type: "saveInterval", intervalMin: Number(sel.value) });
});

btn.addEventListener("click", () => {
  log("togglePause clicked");
  chrome.runtime.sendMessage({ type: "togglePause" }, () => {
    chrome.runtime.sendMessage({ type: "getState" }, ({ paused }) => {
      btn.textContent = paused ? "▶ 再開" : "⏸ 一時停止";
    });
  });
});
