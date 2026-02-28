chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "clickLogo") return;
  const logo = document.querySelector('a[href*="home.do"] img[alt="楽天証券"]');
  if (logo) logo.closest("a").click();
});
